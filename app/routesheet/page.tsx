"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Car = {
  id: string;
  ro_number: string;
  customer_name: string | null;
  vehicle: string | null;
  insurer: string | null;
  created_at: string;
};

export default function RouteSheetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCars() {
      const { data, error } = await supabase
        .from("cars")
        .select("id, ro_number, customer_name, vehicle, insurer, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      setCars(data ?? []);
    }

    loadCars();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Route Sheet</h1>

      {message ? <div className="text-sm">{message}</div> : null}

      <div className="space-y-3">
        {cars.map((car) => (
          <div key={car.id} className="rounded border p-4">
            <div className="font-semibold">RO: {car.ro_number}</div>
            <div>Customer: {car.customer_name || "—"}</div>
            <div>Vehicle: {car.vehicle || "—"}</div>
            <div>Insurer: {car.insurer || "—"}</div>
          </div>
        ))}

        {!cars.length && !message ? (
          <div className="text-sm">No cars yet.</div>
        ) : null}
      </div>
    </div>
  );
}
