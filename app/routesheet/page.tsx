"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────
type RO = {
  id: string;
  ro_number: string;
  customer: string | null;
  vehicle: string | null;
  tech: string | null;
  insurance: string | null;
  claim_number: string | null;
  estimate_total: number | null;
  color: string | null;
  vin: string | null;
  stage: string | null;
  last_touch: string | null;
  status: string;
  closed_at: string | null;
  shop_id: string;
};

type Toast = { id: number; msg: string; type: "success" | "error" };

// ── Constants ──────────────────────────────────────────────────────────────────
const STAGES = [
  "Intake",
  "Parts Ordered",
  "In Progress",
  "Paint",
  "Assembly",
  "Detail",
  "QC",
  "Ready",
  "Delivered",
];

const TECH_COLORS: Record<string, string> = {};
const PALETTE = [
  "#00c97a", "#3b82f6", "#f59e0b", "#ef4444",
  "#a78bfa", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16",
];
function techColor(name: string | null): string {
  if (!name) return "#555";
  if (!TECH_COLORS[name]) {
    const idx = Object.keys(TECH_COLORS).length % PALETTE.length;
    TECH_COLORS[name] = PALETTE[idx];
  }
  return TECH_COLORS[name];
}
function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isDeadCar(last_touch: string | null): boolean {
  if (!last_touch) return true;
  return Date.now() - new Date(last_touch).getTime() > 24 * 60 * 60 * 1000;
}

function fmtMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(ts: string | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

let toastId = 0;

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RouteSheetPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [view, setView] = useState<"active" | "archived">("active");
  const [rows, setRows] = useState<RO[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRO, setNewRO] = useState({
    ro_number: "",
    customer: "",
    vehicle: "",
    tech: "",
    insurance: "",
    claim_number: "",
    estimate_total: "",
    color: "",
    vin: "",
    stage: STAGES[0],
  });
  const stageRefs = useRef<Record<string, boolean>>({});
  const [selected, setSelected] = useState<RO | null>(null);
  const [scrollToStage, setScrollToStage] = useState(false);
  const stagePanelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (scrollToStage && stagePanelRef.current) {
      stagePanelRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setScrollToStage(false);
    }
  }, [scrollToStage, selected]);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // ── Load shop + rows ─────────────────────────────────────────────────────────
  const load = useCallback(
    async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('repair_orders')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('DATA:', data)
      console.log('ERROR:', error)
      if (error) toast(error.message, "error");
      setRows((data as RO[]) ?? []);
      setLoading(false);
    },
    [view, toast]
  );

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    load()
  }, [view]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function handleAdd() {
    const { error } = await supabase.from("repair_orders").insert({
      status: "active",
      ro_number: newRO.ro_number || `NEW-${Date.now()}`,
      customer: newRO.customer || null,
      vehicle: newRO.vehicle || null,
      tech: newRO.tech || null,
      insurance: newRO.insurance || null,
      claim_number: newRO.claim_number || null,
      estimate_total: newRO.estimate_total ? parseFloat(newRO.estimate_total) : null,
      color: newRO.color || null,
      vin: newRO.vin || null,
      stage: newRO.stage,
      last_touch: new Date().toISOString(),
    });
    if (error) { toast(error.message, "error"); return; }
    toast("Job added");
    setShowAdd(false);
    setNewRO({ ro_number: "", customer: "", vehicle: "", tech: "", insurance: "", claim_number: "", estimate_total: "", color: "", vin: "", stage: STAGES[0] });
    load();
  }

  async function handleClose(id: string) {
    const { error } = await supabase
      .from('repair_orders')
      .update({ status: 'archived', closed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast(error.message, "error"); return; }
    toast("Job closed");
    setRows(p => p.filter(r => r.id !== id));
    setSelected(null);
  }

  async function handleRestore(id: string) {
    const { error } = await supabase
      .from("repair_orders")
      .update({ status: "active", closed_at: null })
      .eq("id", id);
    if (error) { toast(error.message, "error"); return; }
    toast("Job restored");
    setRows((r) => r.filter((x) => x.id !== id));
  }

  async function handleStageChange(id: string, stage: string) {
    if (stageRefs.current[id]) return;
    stageRefs.current[id] = true;
    const { error } = await supabase
      .from("repair_orders")
      .update({ stage, last_touch: new Date().toISOString() })
      .eq("id", id);
    stageRefs.current[id] = false;
    if (error) { toast(error.message, "error"); return; }
    toast(`Stage → ${stage}`);
    setRows((rows) =>
      rows.map((r) =>
        r.id === id ? { ...r, stage, last_touch: new Date().toISOString() } : r
      )
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!mounted) return null;

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Bebas+Neue&display=swap');
        .rs-root { font-family: 'DM Sans', sans-serif; background: #080808; min-height: 100vh; color: #e8eaf2; }
        .rs-heading { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .rs-card { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; padding: 16px; position: relative; transition: border-color 0.15s; }
        .rs-card:hover { border-color: #2a2a2a; }
        .rs-card.dead { border-color: #3d1a1a; }
        .dead-badge { background: #3d1a1a; color: #ef4444; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 99px; letter-spacing: 0.08em; text-transform: uppercase; }
        .accent { color: #00c97a; }
        .btn-primary { background: #00c97a; color: #000; font-weight: 600; border: none; border-radius: 9px; padding: 8px 18px; cursor: pointer; font-size: 13px; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-ghost { background: transparent; color: #9aa3b2; border: 1px solid #2a2a2a; border-radius: 9px; padding: 6px 14px; cursor: pointer; font-size: 12px; transition: all 0.15s; }
        .btn-ghost:hover { border-color: #444; color: #e8eaf2; }
        .btn-danger { background: transparent; color: #ef4444; border: 1px solid #3d1a1a; border-radius: 9px; padding: 6px 14px; cursor: pointer; font-size: 12px; transition: all 0.15s; }
        .btn-danger:hover { background: #3d1a1a; }
        .toggle-bar { display: flex; gap: 4px; background: #111; border: 1px solid #1e1e1e; border-radius: 10px; padding: 3px; }
        .toggle-item { border: none; border-radius: 7px; padding: 6px 18px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; background: transparent; color: #9aa3b2; }
        .toggle-item.active { background: #00c97a; color: #000; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .stage-select { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 7px; color: #e8eaf2; font-size: 12px; padding: 4px 8px; cursor: pointer; outline: none; }
        .stage-select:focus { border-color: #00c97a; }
        .input-field { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; color: #e8eaf2; font-size: 13px; padding: 8px 12px; outline: none; width: 100%; }
        .input-field:focus { border-color: #00c97a; }
        .input-field::placeholder { color: #555; }
        .toast { position: fixed; bottom: 80px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
        .toast-item { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 10px 16px; font-size: 13px; min-width: 220px; animation: slideIn 0.2s ease; }
        .toast-item.success { border-color: #00c97a44; }
        .toast-item.error { border-color: #ef444444; color: #ef4444; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        @media (max-width: 600px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .ro-meta { font-size: 11px; color: #666; }
        .ro-val { font-size: 13px; }
        .ro-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
        .rs-card { cursor: pointer; }
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; }
        .drawer { position: fixed; top: 0; right: 0; height: 100%; width: 380px; max-width: 100vw; background: #111; border-left: 1px solid #1e1e1e; z-index: 101; overflow-y: auto; padding: 24px 20px; display: flex; flex-direction: column; gap: 20px; }
        @media (max-width: 480px) { .drawer { width: 100vw; } }
        .drawer-close { background: transparent; border: 1px solid #2a2a2a; border-radius: 8px; color: #9aa3b2; padding: 6px 14px; cursor: pointer; font-size: 12px; }
        .drawer-close:hover { border-color: #444; color: #e8eaf2; }
        .drawer-section { background: #1a1a1a; border: 1px solid #222; border-radius: 10px; padding: 14px; }
        .drawer-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; }
        .btn-stage { background: transparent; color: #9aa3b2; border: 1px solid #2a2a2a; border-radius: 9px; padding: 6px 14px; cursor: pointer; font-size: 12px; transition: all 0.15s; }
        .btn-stage:hover { border-color: #00c97a; color: #00c97a; }
      `}</style>

      <div className="rs-root">
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <h1 className="rs-heading" style={{ fontSize: 36, margin: 0, color: "#e8eaf2" }}>
              Route Sheet
            </h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="toggle-bar">
                <button className={`toggle-item ${view === "active" ? "active" : ""}`} onClick={() => setView("active")}>
                  Route Sheet
                </button>
                <button className={`toggle-item ${view === "archived" ? "active" : ""}`} onClick={() => setView("archived")}>
                  Archive
                </button>
              </div>
              {view === "active" && (
                <button className="btn-primary" onClick={() => setShowAdd(true)}>
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Add Modal */}
          {showAdd && (
            <div className="modal-overlay" onClick={() => setShowAdd(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="drawer-title">New Job</div>
                  <button className="drawer-close" onClick={() => setShowAdd(false)}>✕</button>
                </div>
                <div className="grid-2">
                  <div>
                    <div className="ro-label">RO #</div>
                    <input className="input-field" placeholder="RO-001" value={newRO.ro_number} onChange={(e) => setNewRO((v) => ({ ...v, ro_number: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Customer Name</div>
                    <input className="input-field" placeholder="Jane Smith" value={newRO.customer} onChange={(e) => setNewRO((v) => ({ ...v, customer: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Vehicle</div>
                    <input className="input-field" placeholder="2022 Honda Civic" value={newRO.vehicle} onChange={(e) => setNewRO((v) => ({ ...v, vehicle: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Tech</div>
                    <input className="input-field" placeholder="Mike R." value={newRO.tech} onChange={(e) => setNewRO((v) => ({ ...v, tech: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Insurance</div>
                    <input className="input-field" placeholder="State Farm" value={newRO.insurance} onChange={(e) => setNewRO((v) => ({ ...v, insurance: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Claim #</div>
                    <input className="input-field" placeholder="CLM-12345" value={newRO.claim_number} onChange={(e) => setNewRO((v) => ({ ...v, claim_number: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Estimate Total</div>
                    <input className="input-field" placeholder="0.00" type="number" value={newRO.estimate_total} onChange={(e) => setNewRO((v) => ({ ...v, estimate_total: e.target.value }))} />
                  </div>
                  <div>
                    <div className="ro-label">Color</div>
                    <input className="input-field" placeholder="Pearl White" value={newRO.color} onChange={(e) => setNewRO((v) => ({ ...v, color: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <div className="ro-label">VIN</div>
                  <input className="input-field" placeholder="1HGBH41JXMN109186" value={newRO.vin} onChange={(e) => setNewRO((v) => ({ ...v, vin: e.target.value }))} />
                </div>
                <div>
                  <div className="ro-label">Stage</div>
                  <select className="stage-select" style={{ width: "100%", padding: "8px 12px" }} value={newRO.stage} onChange={(e) => setNewRO((v) => ({ ...v, stage: e.target.value }))}>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={handleAdd}>Save Job</button>
              </div>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div style={{ color: "#555", fontSize: 14, textAlign: "center", paddingTop: 60 }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div style={{ color: "#555", fontSize: 14, textAlign: "center", paddingTop: 60 }}>
              {view === "active" ? "No active jobs." : "No archived jobs."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map((ro) => {
                const dead = view === "active" && isDeadCar(ro.last_touch);
                return (
                  <div key={ro.id} className={`rs-card${dead ? " dead" : ""}`} onClick={() => setSelected(ro)}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        {/* Avatar */}
                        <div className="avatar" style={{ background: techColor(ro.tech) + "22", color: techColor(ro.tech), border: `1.5px solid ${techColor(ro.tech)}44` }}>
                          {initials(ro.tech)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>{ro.customer || "—"}</span>
                            <span className="ro-meta">RO #{ro.ro_number}</span>
                            {dead && <span className="dead-badge">Dead Car</span>}
                          </div>
                          <div className="ro-meta" style={{ marginTop: 2 }}>
                            {ro.vehicle || "—"} &bull; {ro.insurance || "No insurance"} &bull; {fmtMoney(ro.estimate_total)}
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setSelected(ro); }}>Edit</button>
                        <button className="btn-stage" onClick={(e) => { e.stopPropagation(); setSelected(ro); setScrollToStage(true); }}>Stages</button>
                        {view === "active" && (
                          <button className="btn-danger" onClick={(e) => { e.stopPropagation(); handleClose(ro.id); }}>Close Job</button>
                        )}
                        {view === "archived" && (
                          <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); handleRestore(ro.id); }}>Restore</button>
                        )}
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <div>
                          <div className="ro-label">Tech</div>
                          <div className="ro-val" style={{ color: techColor(ro.tech) }}>{ro.tech || "—"}</div>
                        </div>
                        <div>
                          <div className="ro-label">Last Touch</div>
                          <div className="ro-val" style={{ color: dead ? "#ef4444" : "#9aa3b2" }}>{timeAgo(ro.last_touch)}</div>
                        </div>
                      </div>
                      {/* Stage pill */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="ro-label" style={{ marginBottom: 0 }}>Stage</div>
                        <span style={{ fontSize: 13, color: "#9aa3b2" }}>{ro.stage || "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="drawer-title">{selected.customer || "Job Detail"}</div>
              <button className="drawer-close" onClick={() => setSelected(null)}>✕ Close</button>
            </div>

            <div className="drawer-section">
              <div className="ro-label" style={{ marginBottom: 8 }}>Job Info</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  ["Customer", selected.customer],
                  ["RO #", selected.ro_number],
                  ["Vehicle", selected.vehicle],
                  ["Color", (selected as any).color],
                  ["VIN", (selected as any).vin],
                  ["Tech", selected.tech, techColor(selected.tech)],
                  ["Insurance", selected.insurance],
                  ["Claim #", (selected as any).claim_number],
                  ["Estimate", fmtMoney(selected.estimate_total)],
                  ["Last Touch", timeAgo(selected.last_touch)],
                ] as [string, string | null, string?][]).map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span className="ro-label" style={{ marginBottom: 0, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: color ?? "#e8eaf2", textAlign: "right", wordBreak: "break-all" }}>{val || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {selected.status === "active" && (
              <button
                className="btn-danger"
                style={{ width: "100%", padding: "10px", fontSize: 13 }}
                onClick={async () => {
                  await handleClose(selected.id);
                  setSelected(null);
                }}
              >
                Close Job
              </button>
            )}

            <div style={{marginBottom: 20}}>
              <div style={{fontSize: 22, fontWeight: 700, marginBottom: 4}}>{selected.customer || 'No Customer'}</div>
              <div style={{fontSize: 14, color: '#888', marginBottom: 16}}>{selected.vehicle || 'No Vehicle'}</div>
              <div style={{fontSize: 28, fontWeight: 700, color: '#00c97a', marginBottom: 16}}>
                ${Number(selected.estimate_total || 0).toLocaleString()}
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                {[
                  {l: 'RO Number', v: selected.ro_number},
                  {l: 'Technician', v: selected.tech},
                  {l: 'Insurance', v: selected.insurance},
                  {l: 'Claim #', v: selected.claim_number},
                  {l: 'Color', v: selected.color},
                  {l: 'VIN', v: selected.vin},
                ].map((m, i) => (
                  <div key={i} style={{background: '#1a1a1a', border: '1px solid #222', borderRadius: 9, padding: '10px 12px'}}>
                    <div style={{fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#3a3a3a', marginBottom: 4}}>{m.l}</div>
                    <div style={{fontSize: 13, fontWeight: 600, color: '#888'}}>{m.v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="drawer-section" ref={stagePanelRef}>
              <div className="ro-label" style={{ marginBottom: 10 }}>Stage</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      handleStageChange(selected.id, s);
                      setSelected((prev) => prev ? { ...prev, stage: s, last_touch: new Date().toISOString() } : prev);
                    }}
                    style={{
                      background: selected.stage === s ? "#00c97a22" : "transparent",
                      border: `1px solid ${selected.stage === s ? "#00c97a" : "#2a2a2a"}`,
                      borderRadius: 8,
                      color: selected.stage === s ? "#00c97a" : "#9aa3b2",
                      padding: "8px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toasts */}
      <div className="toast">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}
