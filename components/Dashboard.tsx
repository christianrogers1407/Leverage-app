"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { Toggle } from "@/components/Toggle";
import { supabase } from "@/lib/supabaseClient";
import { fmtMoney } from "@/lib/utils";

type TechSnap = {
  tech_id: string;
  initials: string;
  name: string;
  flag_hours: number;
  rework_hours: number;
  cars_attached: number;
};

type DashboardKPIs = {
  active_ros: number;
  dead_cars: number;
  delivered_gross_wtd: number;
  pipeline_active_estimate: number;
  cycle_avg_days: number | null;
};

function ratio(n: number, d: number) {
  if (d <= 0) return 0;
  return n / d;
}

export default function Dashboard() {
  const [range, setRange] = useState<"left" | "right">("left"); // WTD / Pay Period
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [techs, setTechs] = useState<TechSnap[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const userId = s.session?.user.id;
      if (!userId) return;

      const { data: memberships } = await supabase
        .from("user_shop_roles")
        .select("shop_id")
        .eq("user_id", userId)
        .limit(1);

      setShopId(memberships?.[0]?.shop_id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const period = range === "left" ? "wtd" : "pay_period";
      const { data: k } = await supabase.rpc("rpc_dashboard_kpis", { p_shop_id: shopId, p_period: period }).single();
      setKpis(k as any);

      const { data: t } = await supabase.rpc("rpc_tech_snapshot", { p_shop_id: shopId, p_period: period });
      setTechs((t as any) ?? []);
    })();
  }, [shopId, range]);

  const techCards = useMemo(() => {
    return techs.map(t => {
      const reworkPct = ratio(t.rework_hours, t.flag_hours);
      const eff = t.flag_hours; // placeholder (we’ll upgrade later)
      const color =
        eff >= 105 ? "border-money/40" : eff >= 95 ? "border-warn/40" : "border-danger/40";

      return (
        <div key={t.tech_id} className={"rounded-2xl bg-panel2/70 border " + color + " p-4"}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold">{t.initials}</div>
              <div className="text-xs text-muted">{t.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{t.flag_hours.toFixed(1)} hrs</div>
              <div className="text-xs text-muted">{t.cars_attached} cars</div>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>Rework</span>
            <span>{(reworkPct * 100).toFixed(0)}%</span>
          </div>
        </div>
      );
    });
  }, [techs]);

  return (
    <div>
      <TopNav
        title="Leverage"
        right={<Toggle left="WTD" right="Pay Period" value={range} onChange={setRange} />}
      />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card title="Active">
            <div className="text-2xl font-semibold">{kpis?.active_ros ?? "—"}</div>
          </Card>
          <Card title="Dead Cars">
            <div className="text-2xl font-semibold">{kpis?.dead_cars ?? "—"}</div>
          </Card>
          <Card title="Gross (WTD Delivered)">
            <div className="text-2xl font-semibold">{kpis ? fmtMoney(kpis.delivered_gross_wtd) : "—"}</div>
          </Card>
          <Card title="Pipeline (Active $)">
            <div className="text-2xl font-semibold">{kpis ? fmtMoney(kpis.pipeline_active_estimate) : "—"}</div>
          </Card>
        </div>

        <Card title="Tech Snapshot">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {techCards.length ? techCards : <div className="text-sm text-muted">No tech data yet.</div>}
          </div>
        </Card>

        <Card title="Needs Attention">
          <div className="text-sm text-muted">
            Coming next: dead car list, overdue ROs, blockers, comebacks flagged.
          </div>
        </Card>
      </div>
    </div>
  );
}
