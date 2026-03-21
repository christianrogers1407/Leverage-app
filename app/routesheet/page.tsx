"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  created_at: string;
};

export default function RouteSheetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCars() {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id, ro_number, customer_name, vehicle, insurer, status, stage, tech_name, promised_date, created_at"
        )
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

      <div className="flex gap-3">
        <Link href="/routesheet" className="px-3 py-2 rounded border">
          Route Sheet
        </Link>
        <Link href="/cars" className="px-3 py-2 rounded border">
          Add Car
        </Link>
      </div>

      {message ? <div className="text-sm">{message}</div> : null}

      <div className="space-y-3">
        {cars.map((car) => (
          <div key={car.id} className="rounded-xl border p-4 bg-white/5 space-y-1">
            <div className="text-lg font-semibold">RO #{car.ro_number}</div>
            <div>Customer: {car.customer_name || "—"}</div>
            <div>Vehicle: {car.vehicle || "—"}</div>
            <div>Insurer: {car.insurer || "—"}</div>
            <div>Status: {car.status || "—"}</div>
            <div>Stage: {car.stage || "—"}</div>
            <div>Tech: {car.tech_name || "—"}</div>
            <div>Promised: {car.promised_date || "—"}</div>
          </div>
        ))}

        {!cars.length && !message ? (
          <div className="text-sm">No cars yet.</div>
        ) : null}
      </div>
    </div>
  );
}
