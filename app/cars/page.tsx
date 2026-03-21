"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CarsPage() {
  const [roNumber, setRoNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [insurer, setInsurer] = useState("");
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("cars").insert({
      ro_number: roNumber,
      customer_name: customerName,
      vehicle,
      insurer,
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
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Add Car</h1>

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

        <button className="w-full rounded bg-black text-white p-3">
          Save Car
        </button>
      </form>

      {message ? <div className="text-sm">{message}</div> : null}
    </div>
  );
}
