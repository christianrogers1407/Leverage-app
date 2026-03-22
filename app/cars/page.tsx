"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function CarsPage() {
  const [roNumber, setRoNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [insurer, setInsurer] = useState("");

  const [techs, setTechs] = useState([]);
  const [techInput, setTechInput] = useState("");

  const [message, setMessage] = useState("");

  function addTech() {
    if (!techInput) return;
    setTechs([...techs, techInput]);
    setTechInput("");
  }

  async function handleSave(e) {
    e.preventDefault();

    const { error } = await supabase.from("cars").insert({
      ro_number: roNumber,
      customer_name: customerName,
      vehicle,
      insurer,
      techs,
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
    setTechs([]);
  }

  return (
    <div>
      <h1>Add Car</h1>

      <Link href="/routesheet">Route Sheet</Link>

      <form onSubmit={handleSave}>
        <input value={roNumber} onChange={(e) => setRoNumber(e.target.value)} placeholder="RO" />
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer" />
        <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Vehicle" />
        <input value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="Insurer" />

        <input value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder="Add Tech" />
        <button type="button" onClick={addTech}>Add</button>

        <div>
          {techs.map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>

        <button>Save</button>
      </form>

      {message && <div>{message}</div>}
    </div>
  );
}
