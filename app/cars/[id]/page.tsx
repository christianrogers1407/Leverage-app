"use client";

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
};

export default function CarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [car, setCar] = useState<Car | null>(null);
  const [message, setMessage] = useState("");

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
    }

    loadCar();
  }, [params.id]);

  if (message) {
    return <div className="p-6">{message}</div>;
  }

  if (!car) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">RO #{car.ro_number}</h1>
      <div>Customer: {car.customer_name || "—"}</div>
      <div>Vehicle: {car.vehicle || "—"}</div>
      <div>Insurer: {car.insurer || "—"}</div>
      <div>Status: {car.status || "—"}</div>
      <div>Stage: {car.stage || "—"}</div>
      <div>Tech: {car.tech_name || "—"}</div>
      <div>Promised: {car.promised_date || "—"}</div>
    </div>
  );
}
