"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Toggle } from "@/components/Toggle";
import { supabase } from "@/lib/supabaseClient";
import { fmtMoney } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

type Point = { day: string; delivered_gross: number; pipeline: number; touch_hours: number; dead_cars: number; paint_hours: number };

export default function SpreadPage() {
  const [range, setRange] = useState<"left" | "right">("right"); // 30D/90D
  const [data, setData] = useState<Point[]>([]);
  const [series, setSeries] = useState<"delivered_gross" | "pipeline" | "touch_hours" | "dead_cars" | "paint_hours">("delivered_gross");

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

      const days = range === "left" ? 30 : 90;
      const { data: pts } = await supabase.rpc("rpc_spread_series", { p_shop_id: shopId, p_days: days });
      setData((pts as any) ?? []);
    })();
  }, [range]);

  const label = useMemo(() => {
    switch (series) {
      case "delivered_gross": return "Delivered Gross";
      case "pipeline": return "Pipeline $";
      case "touch_hours": return "Touch Hours";
      case "dead_cars": return "Dead Cars";
      case "paint_hours": return "Paint Hours";
    }
  }, [series]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Toggle left="30D" right="90D" value={range} onChange={setRange} />
        <div className="flex gap-2 flex-wrap">
          {(["delivered_gross","pipeline","touch_hours","dead_cars","paint_hours"] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSeries(s)}
              className={"px-3 py-1.5 rounded-xl text-xs border border-white/10 " + (series === s ? "bg-white/10" : "text-muted")}
            >
              {s === "delivered_gross" ? "Gross" : s === "touch_hours" ? "Hours" : s === "dead_cars" ? "Dead" : s === "paint_hours" ? "Paint" : "Pipeline"}
            </button>
          ))}
        </div>
      </div>

      <Card title={label}>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tickFormatter={(d) => format(new Date(d), "MM/dd")} stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{ background: "#0f1320", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                formatter={(v: any) => {
                  if (series === "delivered_gross" || series === "pipeline") return fmtMoney(Number(v));
                  return Number(v).toFixed(1);
                }}
                labelFormatter={(d: any) => format(new Date(d), "MMM d")}
              />
              <Line type="monotone" dataKey={series} stroke="rgba(31,157,85,0.9)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-muted mt-2">
          Uses daily snapshots for long-term history.
        </div>
      </Card>
    </div>
  );
}
