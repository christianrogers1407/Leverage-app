"use client";

import { Card } from "@/components/Card";

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
      <Card title="Setup checklist">
        <ol className="list-decimal ml-5 text-sm text-muted space-y-2">
          <li>Create Supabase project → run schema.sql</li>
          <li>Create your first shop + owner membership</li>
          <li>Add techs + add ROs</li>
          <li>Deploy to Vercel</li>
        </ol>
      </Card>
    </div>
  );
}
