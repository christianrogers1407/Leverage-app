"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CarsPage() {
  const [roNumber, setRoNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [insurer, setInsurer] = useState("");

  const [status, setStatus] = useState("intake");
  const [stage, setStage] = useState("estimate");
  const [tech, setTech] = useState("");
  const [promisedDate, setPromisedDate] = useState("");

  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("cars").insert({
      ro_number: roNumber,
      customer_name: customerName,
      vehicle,
      insurer,
      status,
      stage,
      tech_name: tech,
      promised_date: promisedDate || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Car saved.");
    setRoNumber("");
    setCustomerName("");
    setVehicle("");
    setInsurer("");
    setTech("");
    setPromisedDate("");
    setStatus("intake");
    setStage("estimate");
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Add Car</h1>

      <div className="flex gap-3">
        <Link href="/routesheet" className="px-3 py-2 rounded border">
          Route Sheet
        </Link>
        <Link href="/cars" className="px-3 py-2 rounded border">
          Add Car
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <input
          className="w-full rounded border p-3"
          placeholder="RO Number"
          value={roNumber}
          onChange={(e) => setRoNumber(e.target.value)}
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Vehicle"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Insurer"
          value={insurer}
          onChange={(e) => setInsurer(e.target.value)}
        />

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

        <input
          className="w-full rounded border p-3"
          placeholder="Tech Name"
          value={tech}
          onChange={(e) => setTech(e.target.value)}
        />

        <input
          type="date"
          className="w-full rounded border p-3"
          value={promisedDate}
          onChange={(e) => setPromisedDate(e.target.value)}
        />

        <button className="w-full rounded bg-black text-white p-3">
          Save Car
        </button>
      </form>

      {message ? <div className="text-sm">{message}</div> : null}
    </div>
  );
}
