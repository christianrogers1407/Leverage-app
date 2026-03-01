"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/Card";

type TechRow = { id: string; initials: string; name: string; is_active: boolean };

export default function TechsPage() {
  const [rows, setRows] = useState<TechRow[]>([]);

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
        .from("techs")
        .select("id, initials, name, is_active")
        .eq("shop_id", shopId)
        .order("initials");

      setRows((data as any) ?? []);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
      <Card title="Tech list">
        <div className="text-sm text-muted">Add/edit techs in Settings (coming next).</div>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(t => (
          <Card key={t.id}>
            <div className="text-lg font-semibold">{t.initials}</div>
            <div className="text-xs text-muted">{t.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
