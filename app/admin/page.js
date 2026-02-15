"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminHome() {
  const [stats, setStats] = useState({
    establecimientos: 0,
    pedidos: 0,
    incidencias: 0,
  });

  useEffect(() => {
    obtenerStats();

    // Suscripción realtime
    const canal = supabase
      .channel("cambios")
      .on("postgres_changes", { event: "*", schema: "public" }, obtenerStats)
      .subscribe();

    return () => supabase.removeChannel(canal);
  }, []);

  async function obtenerStats() {
    const { count: estCount } = await supabase
      .from("establecimientos")
      .select("*", { count: "exact" });

    const { count: pedCount } = await supabase
      .from("pedidos")
      .select("*", { count: "exact" });

    const { count: incCount } = await supabase
      .from("incidencias")
      .select("*", { count: "exact" });

    setStats({
      establecimientos: estCount || 0,
      pedidos: pedCount || 0,
      incidencias: incCount || 0,
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Establecimientos" value={stats.establecimientos} />
      <MetricCard title="Pedidos" value={stats.pedidos} />
      <MetricCard title="Incidencias" value={stats.incidencias} />
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-4xl font-bold text-blue-600">
        {value}
      </CardContent>
    </Card>
  );
}
