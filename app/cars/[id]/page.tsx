"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Car = {
  id: string;
  ro_number: string;
  customer_name: string | null;
  vehicle: string | null;
  insurer: string | null;
  status: string | null;
  stage: string | null;
  tech_name: string | null;
  promised_date: string | null;
};

export default function CarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [car, setCar] = useState<Car | null>(null);
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState("intake");
  const [stage, setStage] = useState("estimate");
 const [techs, setTechs] = useState<string[]>([]);
 const [techInput, setTechInput] = useState("");
const [techInput, setTechInput] = useState("");
  const [promisedDate, setPromisedDate] = useState("");

  useEffect(() => {
    async function loadCar() {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id, ro_number, customer_name, vehicle, insurer, status, stage, tech_name, promised_date"
        )
        .eq("id", params.id)
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setCar(data);
      setStatus(data.status || "intake");
      setStage(data.stage || "estimate");
      setTech(data.tech_name || "");
      setPromisedDate(data.promised_date || "");
    }

    loadCar();
  }, [params.id]);

  async function handleSave() {
    setMessage("");

    const { error } = await supabase
      .from("cars")
      .update({
        status,
        stage,
        techs,
        promised_date: promisedDate || null,
      })
      .eq("id", params.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Changes saved.");
  }

  if (message && !car) {
    return <div className="p-6">{message}</div>;
  }

  if (!car) {
    return <div className="p-6">Loading...</div>;
  }
function addTech() {
  if (!techInput) return;
  setTechs([...techs, techInput]);
  setTechInput("");
}
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">RO #{car.ro_number}</h1>

      <div>Customer: {car.customer_name || "—"}</div>
      <div>Vehicle: {car.vehicle || "—"}</div>
      <div>Insurer: {car.insurer || "—"}</div>

      <div className="space-y-3 pt-4">
        <select
          className="w-full rounded border p-3"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="intake">Intake</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          className="w-full rounded border p-3"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
        >
          <option value="estimate">Estimate</option>
          <option value="tear_down">Tear Down</option>
          <option value="body">Body</option>
          <option value="paint">Paint</option>
          <option value="reassembly">Reassembly</option>
        </select>

        <div className="flex gap-2">
  <input
    className="w-full rounded border p-3"
    placeholder="Add Tech"
    value={techInput}
    onChange={(e) => setTechInput(e.target.value)}
  />
  <button type="button" onClick={addTech}>
    Add
  </button>
</div>

<div className="flex gap-2 flex-wrap">
  {techs.map((t, i) => (
    <div key={i} className="border px-2 py-1 rounded text-sm">
      {t}
    </div>
  ))}
</div>

        <input
          type="date"
          className="w-full rounded border p-3"
          value={promisedDate}
          onChange={(e) => setPromisedDate(e.target.value)}
        />

        <button
          className="w-full rounded bg-black text-white p-3"
          onClick={handleSave}
        >
          Save Changes
        </button>

        {message ? <div className="text-sm">{message}</div> : null}
      </div>
    </div>
  );
}