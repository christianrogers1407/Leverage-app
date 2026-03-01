create extension if not exists pgcrypto;

do $$ begin
  create type ro_status as enum ('intake','estimating','waiting_parts','in_repair','paint','reassembly','qc','delivered','comeback');
exception when duplicate_object then null; end $$;

do $$ begin
  create type touch_type as enum ('TD','BU','REP','MECH','PAINT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('owner','manager','tech');
exception when duplicate_object then null; end $$;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists user_shop_roles (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  user_id uuid not null,
  role user_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create table if not exists techs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  initials text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, initials)
);

create table if not exists repair_orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  ro_number text not null,
  insurer text,
  vehicle text,
  status ro_status not null default 'intake',
  estimate_total numeric(12,2) not null default 0,
  supplement_total numeric(12,2) not null default 0,
  final_total numeric(12,2) not null default 0,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, ro_number)
);

create table if not exists ro_assignments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  ro_id uuid not null references repair_orders(id) on delete cascade,
  tech_id uuid not null references techs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ro_id, tech_id)
);

create table if not exists touches (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  ro_id uuid not null references repair_orders(id) on delete cascade,
  tech_id uuid not null references techs(id) on delete cascade,
  touch_type touch_type not null,
  hours numeric(10,2) not null check (hours >= 0),
  is_rework boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists shop_settings (
  shop_id uuid primary key references shops(id) on delete cascade,
  dead_threshold_hours int not null default 24
);

create table if not exists stats_shop_daily (
  id bigserial primary key,
  shop_id uuid not null references shops(id) on delete cascade,
  day date not null,
  delivered_gross numeric(12,2) not null default 0,
  pipeline_estimate numeric(12,2) not null default 0,
  touch_hours numeric(10,2) not null default 0,
  dead_cars int not null default 0,
  paint_hours numeric(10,2) not null default 0,
  unique (shop_id, day)
);

alter table shops enable row level security;
alter table user_shop_roles enable row level security;
alter table techs enable row level security;
alter table repair_orders enable row level security;
alter table ro_assignments enable row level security;
alter table touches enable row level security;
alter table shop_settings enable row level security;
alter table stats_shop_daily enable row level security;

create or replace function is_shop_member(p_shop_id uuid)
returns boolean language sql stable as $$
  select exists (select 1 from user_shop_roles where shop_id = p_shop_id and user_id = auth.uid());
$$;

create policy "shops read" on shops
for select using (exists (select 1 from user_shop_roles r where r.shop_id = id and r.user_id = auth.uid()));

create policy "usr read" on user_shop_roles
for select using (user_id = auth.uid());

create policy "techs rw" on techs
for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

create policy "ros rw" on repair_orders
for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

create policy "assign rw" on ro_assignments
for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

create policy "touches rw" on touches
for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

create policy "settings rw" on shop_settings
for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

create policy "stats read" on stats_shop_daily
for select using (is_shop_member(shop_id));

create or replace function rpc_dashboard_kpis(p_shop_id uuid, p_period text)
returns table (
  active_ros int,
  dead_cars int,
  delivered_gross_wtd numeric,
  pipeline_active_estimate numeric,
  cycle_avg_days numeric
) language plpgsql stable as $$
declare dead_hours int;
begin
  select dead_threshold_hours into dead_hours from shop_settings where shop_id = p_shop_id;
  if dead_hours is null then dead_hours := 24; end if;

  active_ros := (select count(*) from repair_orders where shop_id=p_shop_id and status <> 'delivered');
  dead_cars := (
    select count(*) from repair_orders r
    where r.shop_id=p_shop_id and r.status <> 'delivered'
      and (select coalesce(max(t.created_at), r.created_at) from touches t where t.ro_id=r.id) < (now() - make_interval(hours => dead_hours))
  );

  delivered_gross_wtd := (
    select coalesce(sum(final_total),0) from repair_orders
    where shop_id=p_shop_id and status='delivered' and delivered_at >= date_trunc('week', now())
  );

  pipeline_active_estimate := (
    select coalesce(sum(estimate_total + supplement_total),0) from repair_orders
    where shop_id=p_shop_id and status <> 'delivered'
  );

  cycle_avg_days := null;
  return next;
end $$;

create or replace function rpc_tech_snapshot(p_shop_id uuid, p_period text)
returns table (
  tech_id uuid,
  initials text,
  name text,
  flag_hours numeric,
  rework_hours numeric,
  cars_attached int
) language plpgsql stable as $$
declare start_ts timestamptz;
begin
  if p_period = 'pay_period' then
    start_ts := (now() - interval '14 days');
  else
    start_ts := date_trunc('week', now());
  end if;

  return query
  select
    t.id,
    t.initials,
    t.name,
    coalesce((select sum(hours) from touches x where x.shop_id=p_shop_id and x.tech_id=t.id and x.created_at >= start_ts),0),
    coalesce((select sum(hours) from touches x where x.shop_id=p_shop_id and x.tech_id=t.id and x.is_rework=true and x.created_at >= start_ts),0),
    coalesce((select count(*) from ro_assignments a join repair_orders r on r.id=a.ro_id where a.shop_id=p_shop_id and a.tech_id=t.id and r.status <> 'delivered'),0)
  from techs t
  where t.shop_id=p_shop_id and t.is_active=true
  order by t.initials;
end $$;

create or replace function rpc_spread_series(p_shop_id uuid, p_days int)
returns table (
  day date,
  delivered_gross numeric,
  pipeline numeric,
  touch_hours numeric,
  dead_cars int,
  paint_hours numeric
) language plpgsql stable as $$
begin
  return query
  with d as (
    select generate_series((current_date - (p_days-1))::date, current_date::date, interval '1 day')::date as day
  )
  select
    d.day,
    coalesce(s.delivered_gross,0),
    coalesce(s.pipeline_estimate,0),
    coalesce(s.touch_hours,0),
    coalesce(s.dead_cars,0),
    coalesce(s.paint_hours,0)
  from d
  left join stats_shop_daily s on s.shop_id=p_shop_id and s.day=d.day
  order by d.day;
end $$;
