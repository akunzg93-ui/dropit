"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Movimiento = {
  id: number;
  neto_establecimiento: number;
  monto_bruto: number;
  comision_monto: number;
  iva_monto: number;
  status: string;
  created_at: string;
};

type RetiroAplicacion = {
  monto_aplicado: number;
  created_at: string;
};

type Establecimiento = {
  uuid: string;
  nombre: string;
};

function formatMoney(value: number) {
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function BalanceEstablecimiento() {
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [establecimientoActivo, setEstablecimientoActivo] = useState<string>("");

  const [saldoReal, setSaldoReal] = useState(0);
  const [pendienteRetiro, setPendienteRetiro] = useState(0);
  const [totalRetirado, setTotalRetirado] = useState(0);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [retirosAplicaciones, setRetirosAplicaciones] = useState<RetiroAplicacion[]>([]);

  const [montoRetiro, setMontoRetiro] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRetiro, setLoadingRetiro] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
  const { data: { user } } = await supabase.auth.getUser();

console.log("USER FRONT:", user?.id);

if (!user) return;

  if (!user) return;

  const { data, error } = await supabase
    .from("establecimientos")
    .select("uuid, nombre")
    .eq("usuario_id", user.id);

  console.log("ESTABLECIMIENTOS DATA:", data);
  console.log("ESTABLECIMIENTOS ERROR:", error);

  if (!data || data.length === 0) return;

  setEstablecimientos(data);
  setEstablecimientoActivo(data[0].uuid);

  console.log("ESTABLECIMIENTO ACTIVO:", data[0]);

  await cargarBalance(data[0].uuid);
}

  async function cargarBalance(uuid: string) {
    setLoading(true);

    const { data, error } = await supabase
  .from("establecimiento_saldos")
  .select("*")
  .eq("establecimiento_id", uuid);

  console.log("BALANCE RAW:", data, error);

const saldo = data?.[0] || {
  saldo_disponible: 0,
  saldo_en_proceso: 0,
  saldo_retirado: 0,
};

console.log("SALDO OBJ:", saldo);
      
  setSaldoReal(Number(saldo?.saldo_disponible || 0));
setPendienteRetiro(Number(saldo?.saldo_en_proceso || 0));
setTotalRetirado(Number(saldo?.saldo_retirado || 0));

    const { data: movs } = await supabase
      .from("balance_movimientos")
      .select("*")
      .eq("establecimiento_id", uuid)
      .order("created_at", { ascending: false });

    if (movs) setMovimientos(movs);

    // 🔥 NUEVO: traer retiros reales
    // 🔹 1. traer movimientos del establecimiento
const { data: movimientosIds } = await supabase
  .from("balance_movimientos")
  .select("id")
  .eq("establecimiento_id", uuid);

const ids = (movimientosIds || []).map((m) => m.id);

if (ids.length === 0) {
  setRetirosAplicaciones([]);
} else {
  // 🔹 2. traer retiros reales ligados a esos movimientos
  const { data: retirosApp } = await supabase
    .from("retiro_aplicaciones")
    .select("monto_aplicado, created_at")
    .in("balance_movimiento_id", ids);

  setRetirosAplicaciones(retirosApp || []);
}

    let pendiente = 0;
    let retirado = 0;

    const { data: retirosData } = await supabase
      .from("retiros")
      .select("monto, status")
      .eq("establecimiento_id", uuid);

    if (retirosData) {
      retirosData.forEach((r) => {
        if (r.status === "pending" || r.status === "approved") pendiente += Number(r.monto);
        if (r.status === "paid") retirado += Number(r.monto);
      });
    }

    setPendienteRetiro(pendiente);
    setTotalRetirado(retirado);

    const disponible = Number(saldo?.saldo_disponible || 0) - pendiente;
    setMontoRetiro(disponible > 0 ? String(disponible) : "");

    setLoading(false);
  }

  async function solicitarRetiro() {
    setMensaje("");

    const monto = Number(montoRetiro);
    const disponible = saldoReal - pendienteRetiro;

    if (!monto || monto <= 0) return setMensaje("Monto inválido");
    if (monto > disponible) return setMensaje("Saldo insuficiente");

    setLoadingRetiro(true);

    const res = await fetch("/api/orders/retiros/solicitar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        establecimientos: [
          {
            establecimiento_id: establecimientoActivo,
            monto,
          },
        ],
      }),
    });

    const json = await res.json();

    if (!res.ok) setMensaje(json.error);
    else {
      setMensaje("✅ Retiro solicitado");
      await cargarBalance(establecimientoActivo);
    }

    setLoadingRetiro(false);
  }

  const disponible = saldoReal - pendienteRetiro;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-10">

        <h1 className="text-4xl font-bold text-indigo-900">Balance</h1>

        <div className="relative w-full max-w-xs">
          <select
            value={establecimientoActivo}
            onChange={(e) => {
              setEstablecimientoActivo(e.target.value);
              cargarBalance(e.target.value);
            }}
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {establecimientos.map((e) => (
              <option key={e.uuid} value={e.uuid}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card label="Disponible" value={disponible} color="sky" />
          <Card label="En proceso" value={pendienteRetiro} color="amber" />
          <Card label="Retirado" value={totalRetirado} color="indigo" />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow space-y-4">
          <p className="text-2xl font-bold">{formatMoney(disponible)}</p>

          <div className="flex gap-2">
            <Input value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)} />

            <Button variant="outline" onClick={() => setMontoRetiro(String(disponible))}>
              Input
            </Button>

            <Button
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
              onClick={solicitarRetiro}
              disabled={loadingRetiro}
            >
              {loadingRetiro ? "Procesando..." : "Retiro parcial"}
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                setMontoRetiro(String(disponible));
                await solicitarRetiro();
              }}
              disabled={loadingRetiro}
            >
              Retirar todo
            </Button>
          </div>

          {mensaje && <p>{mensaje}</p>}
        </div>

        <div className="bg-white rounded-3xl shadow-lg border p-6">
          <h2 className="font-semibold mb-4">Movimientos</h2>

          <div className="divide-y">

            {/* INGRESO ORIGINAL (solo 1 vez) */}
            {movimientos
              .filter((m) => m.status === "paid")
              .map((m) => (
                <div key={"ingreso-" + m.id} className="py-4 space-y-1">

                  <div className="flex justify-between">
                    <p className="font-medium">Ingreso</p>

                    <p className="text-green-600">
                      +{formatMoney(m.neto_establecimiento)}
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Bruto: {formatMoney(m.monto_bruto)}</p>
                    <p>Comisión: -{formatMoney(m.comision_monto)}</p>
                    <p>IVA: -{formatMoney(m.iva_monto)}</p>
                  </div>

                  <p className="text-xs text-slate-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}

            {/* RETIROS REALES */}
            {retirosAplicaciones.map((r, i) => (
              <div key={"retiro-" + i} className="py-4 space-y-1">

                <div className="flex justify-between">
                  <p className="font-medium">Retiro</p>

                  <p className="text-red-600">
                    -{formatMoney(r.monto_aplicado)}
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}

function Card({ label, value, color }: any) {
  const colors = {
    sky: "bg-sky-50 border-sky-200 text-sky-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  };

  return (
    <div className={`border rounded-2xl p-6 ${colors[color]}`}>
      <p className="text-sm">{label}</p>
      <p className="text-xl font-bold">{formatMoney(value)}</p>
    </div>
  );
}