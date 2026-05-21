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
    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  setLoading(false);
  return;
}

    const { data } = await supabase
      .from("establecimientos")
      .select("uuid, nombre")
      .eq("usuario_id", user.id);

    if (!data || data.length === 0) {
  setLoading(false);
  return;
}

    setEstablecimientos(data);
    setEstablecimientoActivo(data[0].uuid);

    await cargarBalance(data[0].uuid);
  }

  async function cargarBalance(uuid: string) {
    setLoading(true);

    // 👉 SOLO usamos saldo disponible para base
    const { data } = await supabase
      .from("establecimiento_saldos")
      .select("*")
      .eq("establecimiento_id", uuid);

    const saldo = data?.[0] || {
      saldo_disponible: 0,
      saldo_en_proceso: 0,
    };

    setSaldoReal(Number(saldo?.saldo_disponible || 0));
    setPendienteRetiro(Number(saldo?.saldo_en_proceso || 0));

    // 🔹 movimientos
    const { data: movs } = await supabase
      .from("balance_movimientos")
      .select("*")
      .eq("establecimiento_id", uuid)
      .order("created_at", { ascending: false });

    if (movs) setMovimientos(movs);

    // 🔹 retiro_aplicaciones (fuente real)
    const { data: movimientosIds } = await supabase
      .from("balance_movimientos")
      .select("id")
      .eq("establecimiento_id", uuid);

    const ids = (movimientosIds || []).map((m) => m.id);

    if (ids.length === 0) {
      setRetirosAplicaciones([]);
    } else {
      const { data: retirosApp } = await supabase
        .from("retiro_aplicaciones")
        .select("monto_aplicado, created_at")
        .in("balance_movimiento_id", ids);

      setRetirosAplicaciones(retirosApp || []);
    }

    const disponible = Number(saldo?.saldo_disponible || 0) - Number(saldo?.saldo_en_proceso || 0);
    setMontoRetiro(disponible > 0 ? String(disponible) : "");

    setLoading(false);
  }

  async function solicitarRetiro() {
    if (loadingRetiro) return;

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

  // 🔥 cálculos correctos
  const disponible = saldoReal - pendienteRetiro;

  const totalRetirado = retirosAplicaciones.reduce(
    (acc, r) => acc + Number(r.monto_aplicado),
    0
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

 return (
  <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-12 pb-36">
    <div className="max-w-5xl mx-auto space-y-5 md:space-y-10">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-indigo-900">
            Balance
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Gestiona tus ingresos y retiros.
          </p>
        </div>

        <div className="relative w-full md:w-[280px]">
          <select
            value={establecimientoActivo}
            onChange={(e) => {
              setEstablecimientoActivo(e.target.value);
              cargarBalance(e.target.value);
            }}
            className="
              w-full
              bg-white
              border
              border-slate-200
              rounded-2xl
              px-4
              py-3
              text-sm
              shadow-sm
            "
          >
            {establecimientos.map((e) => (
              <option key={e.uuid} value={e.uuid}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Disponible" value={disponible} color="sky" />
        <Card label="En proceso" value={pendienteRetiro} color="amber" />
        <Card label="Retirado" value={totalRetirado} color="indigo" />
      </div>

      {/* RETIRO */}
      <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl border border-slate-200 space-y-4">

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitar retiro
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Retira tu saldo disponible.
          </p>
        </div>

        {/* INPUT + ACTIONS */}
        <div className="space-y-3">

          <Input
            value={montoRetiro}
            onChange={(e) => setMontoRetiro(e.target.value)}
            className="h-12 rounded-2xl text-base"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <Button
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={() => setMontoRetiro(String(disponible))}
            >
              Máximo
            </Button>

            <Button
              className="
                h-11
                rounded-2xl
                bg-indigo-600
                hover:bg-indigo-700
                text-white
              "
              onClick={solicitarRetiro}
              disabled={loadingRetiro}
            >
              {loadingRetiro
                ? "Procesando..."
                : "Retiro parcial"}
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={async () => {
                setMontoRetiro(String(disponible));
                await solicitarRetiro();
              }}
              disabled={loadingRetiro}
            >
              Retirar todo
            </Button>

          </div>
        </div>

        {mensaje && (
          <div className="text-sm text-center font-medium text-indigo-600">
            {mensaje}
          </div>
        )}
      </div>

      {/* MOVIMIENTOS */}
      <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-5 md:p-6">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900">
            Movimientos
          </h2>

          <span className="text-xs text-slate-400">
            {movimientos.length} registros
          </span>
        </div>

        <div className="divide-y">

          {/* INGRESOS */}
          {movimientos
            .filter((m) => m.status === "paid")
            .map((m) => (
              <div
                key={"ingreso-" + m.id}
                className="py-4 space-y-2"
              >
                <div className="flex justify-between items-start gap-3">

                  <div>
                    <p className="font-medium text-sm">
                      Ingreso
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-green-600 font-semibold text-sm">
                    +{formatMoney(m.neto_establecimiento)}
                  </p>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Bruto: {formatMoney(m.monto_bruto)}</p>
                  <p>Comisión: -{formatMoney(m.comision_monto)}</p>
                  <p>IVA: -{formatMoney(m.iva_monto)}</p>
                </div>
              </div>
            ))}

          {/* RETIROS */}
          {retirosAplicaciones.map((r, i) => (
            <div
              key={"retiro-" + i}
              className="py-4 space-y-2"
            >
              <div className="flex justify-between items-start gap-3">

                <div>
                  <p className="font-medium text-sm">
                    Retiro
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-red-600 font-semibold text-sm">
                  -{formatMoney(r.monto_aplicado)}
                </p>
              </div>
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
    <div
      className={`
        border
        rounded-[28px]
        p-5
        md:p-6
        shadow-sm
        ${colors[color]}
      `}
    >
      <p className="text-sm opacity-80">
        {label}
      </p>

      <p className="text-2xl font-bold mt-1">
        {formatMoney(value)}
      </p>
    </div>
  );
}