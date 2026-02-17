"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Movimiento = {
  id: number;
  pedido_id: number;
  monto_bruto: number;
  comision_monto: number;
  iva_monto: number;
  neto_establecimiento: number;
  status: string;
  fecha_pago: string | null;
  referencia_pago: string | null;
  created_at: string;
};

export default function BalanceEstablecimiento() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [resumen, setResumen] = useState({
    total_disponible: 0,
    total_pagado: 0,
    total_comision: 0,
    total_iva: 0,
  });

  const [graficaMensual, setGraficaMensual] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarBalance();
  }, []);

  async function cargarBalance() {
    setLoading(true);

    let query = supabase
      .from("balance_movimientos")
      .select("*")
      .order("created_at", { ascending: false });

    if (fechaInicio) query = query.gte("created_at", fechaInicio);
    if (fechaFin) query = query.lte("created_at", fechaFin + " 23:59:59");

    const { data } = await query;
    if (!data) {
      setLoading(false);
      return;
    }

    setMovimientos(data);

    let totalDisponible = 0;
    let totalPagado = 0;
    let totalComision = 0;
    let totalIva = 0;

    const agrupado: Record<string, any> = {};

    data.forEach((m) => {
      const fecha = new Date(m.created_at);
      const mes = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!agrupado[mes]) {
        agrupado[mes] = {
          mes,
          neto: 0,
          comision: 0,
        };
      }

      agrupado[mes].neto += Number(m.neto_establecimiento);
      agrupado[mes].comision += Number(m.comision_monto);

      totalComision += Number(m.comision_monto);
      totalIva += Number(m.iva_monto);

      if (m.status === "available")
        totalDisponible += Number(m.neto_establecimiento);

      if (m.status === "paid")
        totalPagado += Number(m.neto_establecimiento);
    });

    setResumen({
      total_disponible: totalDisponible,
      total_pagado: totalPagado,
      total_comision: totalComision,
      total_iva: totalIva,
    });

    setGraficaMensual(Object.values(agrupado));
    setLoading(false);
  }

  function exportarCSV() {
    const headers = [
      "Pedido",
      "Bruto",
      "Comisión",
      "IVA",
      "Neto",
      "Estado",
      "Fecha Pago",
      "Referencia",
    ];

    const rows = movimientos.map((m) => [
      m.pedido_id,
      m.monto_bruto,
      m.comision_monto,
      m.iva_monto,
      m.neto_establecimiento,
      m.status,
      m.fecha_pago || "",
      m.referencia_pago || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "balance_dropit.csv");
    document.body.appendChild(link);
    link.click();
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando balance...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Balance Financiero
      </h1>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 items-end bg-white border rounded-2xl p-6 shadow-sm">
        <div>
          <label className="text-xs text-gray-500">Desde</label>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Hasta</label>
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <Button onClick={cargarBalance}>
          Filtrar
        </Button>

        <Button variant="outline" onClick={exportarCSV}>
          Exportar CSV
        </Button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card label="Disponible" value={resumen.total_disponible} color="green" />
        <Card label="Pagado" value={resumen.total_pagado} color="gray" />
        <Card label="Comisión Dropit" value={resumen.total_comision} color="blue" />
        <Card label="IVA Comisión" value={resumen.total_iva} color="purple" />
      </div>

      {/* GRAFICA */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold mb-4 text-gray-700">
          Resumen mensual
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graficaMensual}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="neto" fill="#2d6cdf" />
            <Bar dataKey="comision" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABLA */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 text-left">Pedido</th>
              <th className="p-4 text-left">Bruto</th>
              <th className="p-4 text-left">Comisión</th>
              <th className="p-4 text-left">IVA</th>
              <th className="p-4 text-left">Neto</th>
              <th className="p-4 text-left">Estado</th>
              <th className="p-4 text-left">Fecha Pago</th>
              <th className="p-4 text-left">Referencia</th>
            </tr>
          </thead>

          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-4 font-medium">{m.pedido_id}</td>
                <td className="p-4">${m.monto_bruto}</td>
                <td className="p-4">${m.comision_monto}</td>
                <td className="p-4">${m.iva_monto}</td>
                <td className="p-4 font-semibold">
                  ${m.neto_establecimiento}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      m.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="p-4">
                  {m.fecha_pago
                    ? new Date(m.fecha_pago).toLocaleString()
                    : "-"}
                </td>
                <td className="p-4">{m.referencia_pago || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {movimientos.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No hay movimientos en este rango.
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, color }: any) {
  const colors: any = {
    green: "from-green-50 to-green-100 border-green-200 text-green-700",
    gray: "from-gray-50 to-gray-100 border-gray-200 text-gray-800",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 shadow-sm`}
    >
      <p className="text-sm">{label}</p>
      <p className="text-3xl font-bold">
        ${value.toFixed(2)} MXN
      </p>
    </div>
  );
}
