"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";

type CountdownTimerProps = {
  startDate: string | null | undefined;
  hours?: number;
  title: string;
  description: string;
  expiredMessage: string;
};

type TiempoRestante = {
  total: number;
  dias: number;
  horas: number;
  minutos: number;
};

const TIEMPO_VACIO: TiempoRestante = {
  total: 0,
  dias: 0,
  horas: 0,
  minutos: 0,
};

function calcularTiempoRestante(fechaLimite: number): TiempoRestante {
  const diferencia = Math.max(0, fechaLimite - Date.now());

  return {
    total: diferencia,
    dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diferencia / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diferencia / (1000 * 60)) % 60),
  };
}

export default function CountdownTimer({
  startDate,
  hours = 48,
  title,
  description,
  expiredMessage,
}: CountdownTimerProps) {
  const fechaLimite = useMemo(() => {
    if (!startDate) return null;

    const fechaInicial = new Date(startDate).getTime();

    if (Number.isNaN(fechaInicial)) return null;

    return fechaInicial + hours * 60 * 60 * 1000;
  }, [startDate, hours]);

  const [tiempo, setTiempo] = useState<TiempoRestante>(() =>
    fechaLimite ? calcularTiempoRestante(fechaLimite) : TIEMPO_VACIO
  );

  useEffect(() => {
    if (!fechaLimite) {
      setTiempo(TIEMPO_VACIO);
      return;
    }

    const actualizarTiempo = () => {
      setTiempo(calcularTiempoRestante(fechaLimite));
    };

    actualizarTiempo();

    const intervalo = window.setInterval(actualizarTiempo, 1000);

    return () => window.clearInterval(intervalo);
  }, [fechaLimite]);

  if (!fechaLimite) return null;

  const vencido = tiempo.total <= 0;

  const mostrarDias = tiempo.dias > 0;

  return (
    <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-100/70 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm">
          {vencido ? <AlertTriangle size={21} /> : <Clock size={21} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            {title}
          </p>

          <div
  className={`mt-3 grid gap-3 ${
    mostrarDias ? "grid-cols-3" : "grid-cols-2"
  }`}
>
  {mostrarDias && (
    <TimeBox value={tiempo.dias} label="días" />
  )}

  <TimeBox value={tiempo.horas} label="horas" />

  <TimeBox value={tiempo.minutos} label="min" />
</div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {vencido ? expiredMessage : description}
          </p>

          {vencido && (
            <p className="mt-3 text-xs font-semibold text-[#1e3a8a]">
              El sistema actualizará el estado del pedido automáticamente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white px-3 py-3 text-center shadow-sm">
      <p className="text-xl font-bold tabular-nums text-[#1e3a8a]">
        {String(value).padStart(2, "0")}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}