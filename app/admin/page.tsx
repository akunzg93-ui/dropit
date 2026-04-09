"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminHome() {
  const [stats, setStats] = useState({
    establecimientos: 0,
    pedidos: 0,
    incidencias: 0,
    saldoPendiente: 0,
    retirosPendientes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerStats();
  }, []);

  async function obtenerStats() {
    const { count: estCount } = await supabase
      .from("establecimientos")
      .select("*", { count: "exact", head: true });

    const { count: pedCount } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true });

    const { count: incCount } = await supabase
      .from("incidencias")
      .select("*", { count: "exact", head: true });

    // 💰 saldo pendiente (no pagado)
    const { data: saldoData } = await supabase
      .from("balance_movimientos")
      .select("neto_establecimiento")
      .eq("status", "pendiente");

    const saldoPendiente =
      saldoData?.reduce((acc, i) => acc + Number(i.neto_establecimiento || 0), 0) || 0;

    // ⏳ retiros pendientes
    const { count: retirosPendientes } = await supabase
      .from("retiros")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setStats({
      establecimientos: estCount || 0,
      pedidos: pedCount || 0,
      incidencias: incCount || 0,
      saldoPendiente,
      retirosPendientes: retirosPendientes || 0,
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-indigo-900">
          Panel de Administrador
        </h1>
        <p className="text-sm text-slate-500">
          Control general de Dropit
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        <MetricCard title="Establecimientos" value={stats.establecimientos} />
        <MetricCard title="Pedidos" value={stats.pedidos} />
        <MetricCard title="Incidencias" value={stats.incidencias} />

        <MetricCard
          title="Saldo pendiente"
          value={`$${stats.saldoPendiente}`}
          highlight
        />

        <MetricCard
          title="Retiros pendientes"
          value={stats.retirosPendientes}
          highlight
        />

      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="grid md:grid-cols-3 gap-6">

        <QuickCard
          title="Retiros"
          desc="Gestiona pagos a establecimientos"
          href="/admin/retiros"
        />

        <QuickCard
          title="Establecimientos"
          desc="Ver y administrar puntos activos"
          href="/admin/establecimientos"
        />

        <QuickCard
          title="Pedidos"
          desc="Monitoreo de operaciones"
          href="/admin/pedidos"
        />

      </div>

    </div>
  );
}

function MetricCard({ title, value, highlight }: any) {
  return (
    <div className={`rounded-3xl p-6 shadow-lg border 
      ${highlight ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200"}
    `}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-3xl font-bold mt-2 
        ${highlight ? "text-indigo-700" : "text-indigo-600"}
      `}>
        {value}
      </p>
    </div>
  );
}

function QuickCard({ title, desc, href }: any) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition cursor-pointer">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
    </Link>
  );
}