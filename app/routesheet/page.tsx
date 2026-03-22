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
    loadCars();
  }, []);

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

  async function updateCar(id: string, updates: Partial<Car>) {
    const { error } = await supabase
      .from("cars")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadCars();
  }

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
          <div key={car.id} className="rounded-xl border p-4 bg-white/5 space-y-2">
            
            <Link href={`/cars/${car.id}`}>
              <div className="text-lg font-semibold">RO #{car.ro_number}</div>
              <div>Customer: {car.customer_name || "—"}</div>
              <div>Vehicle: {car.vehicle || "—"}</div>
            </Link>

            <div className="flex gap-2">
              <select
                className="rounded border p-2"
                value={car.status || "intake"}
                onChange={(e) =>
                  updateCar(car.id, { status: e.target.value })
                }
              >
                <option value="intake">Intake</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              <select
                className="rounded border p-2"
                value={car.stage || "estimate"}
                onChange={(e) =>
                  updateCar(car.id, { stage: e.target.value })
                }
              >
                <option value="estimate">Estimate</option>
                <option value="tear_down">Tear Down</option>
                <option value="body">Body</option>
                <option value="paint">Paint</option>
                <option value="reassembly">Reassembly</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Tech: {car.tech_name || "—"} | Due: {car.promised_date || "—"}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
