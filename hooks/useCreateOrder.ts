"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function useCreateOrder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createOrder(establecimiento: any) {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const res = await fetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        comprador_id: user?.id,
        establecimiento_id: establecimiento.id,
        establecimiento_nombre: establecimiento.nombre,
        lat: establecimiento.lat,
        lng: establecimiento.lng,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      console.error(json.error);
      return null;
    }

    // Redirigir al estado del pedido
    router.push(`/comprador/estado/${json.id}`);

    return json;
  }

  return { createOrder, loading };
}
