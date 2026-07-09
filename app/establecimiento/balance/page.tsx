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
  const [retirosAplicaciones, setRetirosAplicaciones] = useState<
    RetiroAplicacion[]
  >([]);

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

    const { data: movs } = await supabase
      .from("balance_movimientos")
      .select("*")
      .eq("establecimiento_id", uuid)
      .order("created_at", { ascending: false });

    if (movs) setMovimientos(movs);

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

    const disponible =
      Number(saldo?.saldo_disponible || 0) -
      Number(saldo?.saldo_en_proceso || 0);

    setMontoRetiro(disponible > 0 ? String(disponible) : "");
    setLoading(false);
  }

  async function solicitarRetiro(montoOverride?: number) {
    if (loadingRetiro) return;

    setMensaje("");

    const monto = montoOverride ?? Number(montoRetiro);
    const disponible = saldoReal - pendienteRetiro;

    if (!monto || monto <= 0) {
      setMensaje("Monto inválido");
      return;
    }

    if (monto > disponible) {
      setMensaje("Saldo insuficiente");
      return;
    }

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

    if (!res.ok) {
      setMensaje(json.error);
    } else {
      setMensaje("✅ Retiro solicitado");
      await cargarBalance(establecimientoActivo);
    }

    setLoadingRetiro(false);
  }

  const disponible = saldoReal - pendienteRetiro;

  const totalRetirado = retirosAplicaciones.reduce(
    (acc, r) => acc + Number(r.monto_aplicado),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Cargando balance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div className="grid md:grid-cols-[1.4fr_.8fr] gap-8 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
                Logística fácil y sin dramas
              </p>

              <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mt-3 leading-tight">
                Balance <span className="inline-block">💰</span>
              </h1>

              <p className="text-slate-600 mt-4 max-w-xl text-lg">
                Consulta tus ingresos, saldo disponible y solicita retiros de
                forma sencilla.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Establecimiento
              </label>

              <select
                value={establecimientoActivo}
                onChange={(e) => {
                  setEstablecimientoActivo(e.target.value);
                  cargarBalance(e.target.value);
                }}
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                {establecimientos.map((e) => (
                  <option key={e.uuid} value={e.uuid}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <BalanceCard
            label="Disponible"
            value={disponible}
            description="Saldo que puedes retirar"
            icon="✅"
          />

          <BalanceCard
            label="En proceso"
            value={pendienteRetiro}
            description="Retiros solicitados"
            icon="⏳"
          />

          <BalanceCard
            label="Retirado"
            value={totalRetirado}
            description="Histórico aplicado"
            icon="🏦"
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Paso 1
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
              Solicitar retiro
            </h2>

            <p className="text-slate-500 mt-2">
              Puedes retirar hasta{" "}
              <span className="font-semibold text-slate-700">
                {formatMoney(disponible)}
              </span>{" "}
              de saldo disponible.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-slate-50 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Monto a retirar
              </label>

              <Input
                value={montoRetiro}
                onChange={(e) => setMontoRetiro(e.target.value)}
                className="h-12 rounded-xl border-slate-300 bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl border-slate-300 text-slate-700"
                onClick={() => setMontoRetiro(String(disponible))}
              >
                Máximo
              </Button>

              <Button
                className="h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg transition-all"
                onClick={() => solicitarRetiro()}
                disabled={loadingRetiro}
              >
                {loadingRetiro ? "Procesando..." : "Retiro parcial"}
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-xl border-slate-300 text-slate-700"
                onClick={() => {
                  setMontoRetiro(String(disponible));
                  solicitarRetiro(disponible);
                }}
                disabled={loadingRetiro}
              >
                Retirar todo
              </Button>
            </div>

            {mensaje && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  mensaje.startsWith("✅")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                {mensaje}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Paso 2
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
                Movimientos
              </h2>

              <p className="text-slate-500 mt-2">
                Consulta el detalle de ingresos y retiros aplicados.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1e3a8a]">
              <strong>{movimientos.length + retirosAplicaciones.length}</strong>{" "}
              registros
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {movimientos.filter((m) => m.status === "paid").length === 0 &&
              retirosAplicaciones.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">
                  Todavía no hay movimientos.
                </div>
              )}

            {movimientos
              .filter((m) => m.status === "paid")
              .map((m) => (
                <MovimientoRow
                  key={"ingreso-" + m.id}
                  tipo="Ingreso"
                  fecha={m.created_at}
                  monto={m.neto_establecimiento}
                  positivo
                  detalles={[
                    `Bruto: ${formatMoney(m.monto_bruto)}`,
                    `Comisión: -${formatMoney(m.comision_monto)}`,
                    `IVA: -${formatMoney(m.iva_monto)}`,
                  ]}
                />
              ))}

            {retirosAplicaciones.map((r, i) => (
              <MovimientoRow
                key={"retiro-" + i}
                tipo="Retiro"
                fecha={r.created_at}
                monto={r.monto_aplicado}
                positivo={false}
                detalles={[]}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="text-3xl font-bold text-[#1e3a8a] mt-2">
            {formatMoney(value)}
          </p>

          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MovimientoRow({
  tipo,
  fecha,
  monto,
  positivo,
  detalles,
}: {
  tipo: string;
  fecha: string;
  monto: number;
  positivo: boolean;
  detalles: string[];
}) {
  return (
    <div className="py-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-semibold text-slate-800">{tipo}</p>

          <p className="text-xs text-slate-400 mt-1">
            {new Date(fecha).toLocaleDateString()}
          </p>

          {detalles.length > 0 && (
            <div className="text-xs text-slate-500 space-y-1 mt-3">
              {detalles.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </div>
          )}
        </div>

        <p
          className={`font-bold text-sm ${
            positivo ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {positivo ? "+" : "-"}
          {formatMoney(monto)}
        </p>
      </div>
    </div>
  );
}