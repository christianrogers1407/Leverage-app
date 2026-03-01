"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/Card";
import { fmtMoney } from "@/lib/utils";

type RORow = {
  id: string;
  ro_number: string;
  status: string;
  insurer: string | null;
  vehicle: string | null;
  estimate_total: number;
  supplement_total: number;
  final_total: number;
  created_at: string;
};

export default function ROsList() {
  const [rows, setRows] = useState<RORow[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const userId = s.session?.user.id;
      if (!userId) return;

      const { data: m } = await supabase
        .from("user_shop_roles")
        .select("shop_id")
        .eq("user_id", userId)
        .limit(1);

      const shopId = m?.[0]?.shop_id;
      if (!shopId) return;

      const { data } = await supabase
        .from("repair_orders")
        .select("id, ro_number, status, insurer, vehicle, estimate_total, supplement_total, final_total, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(200);

      setRows((data as any) ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      r.ro_number.toLowerCase().includes(s) ||
      (r.insurer ?? "").toLowerCase().includes(s) ||
      (r.vehicle ?? "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
      <input
        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none"
        placeholder="Search RO #, insurer, vehicle"
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      <div className="space-y-3">
        {filtered.map(r => (
          <Link key={r.id} href={`/ros/${r.id}`} className="block">
            <Card className="hover:border-white/15 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">RO {r.ro_number}</div>
                  <div className="text-xs text-muted mt-1">
                    {r.vehicle ?? "—"} • {r.insurer ?? "—"} • <span className="uppercase">{r.status.replaceAll("_"," ")}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{fmtMoney(r.estimate_total)}</div>
                  <div className="text-xs text-muted">supp {fmtMoney(r.supplement_total)}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {!filtered.length && <div className="text-sm text-muted">No ROs found.</div>}
      </div>
    </div>
  );
}
