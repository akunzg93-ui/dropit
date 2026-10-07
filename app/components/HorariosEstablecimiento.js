"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Settings2,
  Layers3,
} from "lucide-react";

const DIAS_LABORALES = [1, 2, 3, 4, 5];

const DIAS = [
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
];

export const HORARIOS_VACIOS = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
};

function copiarIntervalos(intervalos) {
  return intervalos.map((intervalo) => ({ ...intervalo }));
}

function ajustarHora(hora, minutos) {
  if (!hora) return hora;

  const [horas, mins] = hora.split(":").map(Number);

  let total = horas * 60 + mins + minutos;

  total = ((total % 1440) + 1440) % 1440;

  const nuevaHora = Math.floor(total / 60);
  const nuevosMinutos = total % 60;

  return `${String(nuevaHora).padStart(2, "0")}:${String(
    nuevosMinutos
  ).padStart(2, "0")}`;
}

function obtenerIntervalosGrupo(horarios, dias) {
  return horarios[dias[0]] || [];
}

function normalizarIntervalos(intervalos = []) {
  return intervalos.map((intervalo) => ({
    apertura: intervalo.apertura,
    cierre: intervalo.cierre,
  }));
}

function diasLaboralesIguales(horarios) {
  const referencia = JSON.stringify(
    normalizarIntervalos(horarios[DIAS_LABORALES[0]] || [])
  );

  return DIAS_LABORALES.every(
    (dia) =>
      JSON.stringify(normalizarIntervalos(horarios[dia] || [])) ===
      referencia
  );
}

function GrupoHorario({
  titulo,
  subtitulo,
  dias,
  horarios,
  onChange,
}) {
  const intervalos = obtenerIntervalosGrupo(horarios, dias);
  const abierto = intervalos.length > 0;

  function actualizarGrupo(nuevosIntervalos) {
    const nuevosHorarios = { ...horarios };

    dias.forEach((dia) => {
      nuevosHorarios[dia] = copiarIntervalos(nuevosIntervalos);
    });

    onChange(nuevosHorarios);
  }

  function abrir() {
    actualizarGrupo([
      {
        apertura: "09:00",
        cierre: "18:00",
      },
    ]);
  }

  function cerrar() {
    actualizarGrupo([]);
  }

  function agregarIntervalo() {
    actualizarGrupo([
      ...intervalos,
      {
        apertura: "09:00",
        cierre: "18:00",
      },
    ]);
  }

  function eliminarIntervalo(index) {
    actualizarGrupo(
      intervalos.filter((_, i) => i !== index)
    );
  }

  function actualizarIntervalo(index, campo, valor) {
    const nuevos = copiarIntervalos(intervalos);

    nuevos[index] = {
      ...nuevos[index],
      [campo]: valor,
    };

    actualizarGrupo(nuevos);
  }

  function moverHora(index, campo, minutos) {
  const horaActual = intervalos[index]?.[campo];

  if (!horaActual) return;

  actualizarIntervalo(
    index,
    campo,
    ajustarHora(horaActual, minutos)
  );
}

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {titulo}
          </p>

          {subtitulo && (
            <p className="mt-0.5 text-xs text-slate-400">
              {subtitulo}
            </p>
          )}

          <p
            className={`mt-1 text-xs font-medium ${
              abierto
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            {abierto ? "Horario configurado" : "Cerrado"}
          </p>
        </div>

        <button
          type="button"
          onClick={abierto ? cerrar : abrir}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            abierto ? "bg-[#2563eb]" : "bg-slate-300"
          }`}
          aria-label={
            abierto
              ? `Cerrar ${titulo}`
              : `Abrir ${titulo}`
          }
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
              abierto ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {abierto && (
        <div className="mt-4 space-y-3">
          {intervalos.map((intervalo, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() =>
        moverHora(index, "apertura", -15)
      }
      className="h-10 w-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-lg font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      aria-label="Restar 15 minutos a la hora de apertura"
    >
      −
    </button>

    <input
      type="time"
      step="900"
      value={intervalo.apertura}
      onChange={(e) =>
        actualizarIntervalo(
          index,
          "apertura",
          e.target.value
        )
      }
      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
    />

    <button
      type="button"
      onClick={() =>
        moverHora(index, "apertura", 15)
      }
      className="h-10 w-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-lg font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      aria-label="Sumar 15 minutos a la hora de apertura"
    >
      +
    </button>
  </div>

  <span className="text-center text-sm text-slate-400">
    a
  </span>

  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() =>
        moverHora(index, "cierre", -15)
      }
      className="h-10 w-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-lg font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      aria-label="Restar 15 minutos a la hora de cierre"
    >
      −
    </button>

    <input
      type="time"
      step="900"
      value={intervalo.cierre}
      onChange={(e) =>
        actualizarIntervalo(
          index,
          "cierre",
          e.target.value
        )
      }
      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
    />

    <button
      type="button"
      onClick={() =>
        moverHora(index, "cierre", 15)
      }
      className="h-10 w-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-lg font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      aria-label="Sumar 15 minutos a la hora de cierre"
    >
      +
    </button>
  </div>
</div>

              {intervalos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    eliminarIntervalo(index)
                  }
                  className="flex h-10 items-center justify-center rounded-xl px-3 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar horario"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={agregarIntervalo}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] transition hover:text-[#1e40af]"
          >
            <Plus size={16} />
            Agregar otro horario
          </button>
        </div>
      )}
    </div>
  );
}

export default function HorariosEstablecimiento({
  value,
  onChange,
}) {
  const horarios = value || HORARIOS_VACIOS;

  const [personalizado, setPersonalizado] =
    useState(false);

  const laboralesIguales =
    diasLaboralesIguales(horarios);

  function activarPersonalizado() {
    setPersonalizado(true);
  }

  function volverAgrupado() {
    if (!laboralesIguales) return;

    setPersonalizado(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Clock
            size={18}
            className="text-[#2563eb]"
          />

          <h3 className="font-semibold text-[#1e3a8a]">
            Horarios de atención
          </h3>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Indica cuándo pueden acudir vendedores y
          clientes. Si cierras durante el día, puedes
          agregar más de un horario.
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Por ejemplo: 08:00–13:00 y 16:00–18:00.
        </p>
      </div>

      <div className="space-y-3">
        {!personalizado ? (
          <GrupoHorario
            titulo="Lunes a viernes"
            subtitulo="El mismo horario se aplicará a los cinco días"
            dias={DIAS_LABORALES}
            horarios={horarios}
            onChange={onChange}
          />
        ) : (
          <>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3">
              <p className="text-sm font-semibold text-[#1e3a8a]">
                Horario personalizado
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Puedes configurar cada día entre semana
                de forma independiente.
              </p>
            </div>

            {DIAS.map((dia) => (
              <GrupoHorario
                key={dia.id}
                titulo={dia.nombre}
                dias={[dia.id]}
                horarios={horarios}
                onChange={onChange}
              />
            ))}
          </>
        )}

        <GrupoHorario
          titulo="Sábado"
          dias={[6]}
          horarios={horarios}
          onChange={onChange}
        />

        <GrupoHorario
          titulo="Domingo"
          dias={[7]}
          horarios={horarios}
          onChange={onChange}
        />
      </div>

      {!personalizado ? (
        <button
          type="button"
          onClick={activarPersonalizado}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] transition hover:text-[#1e40af]"
        >
          <Settings2 size={16} />
          Personalizar días
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={volverAgrupado}
            disabled={!laboralesIguales}
            className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
              laboralesIguales
                ? "text-[#2563eb] hover:text-[#1e40af]"
                : "cursor-not-allowed text-slate-300"
            }`}
          >
            <Layers3 size={16} />
            Usar horario agrupado
          </button>

          {!laboralesIguales && (
            <p className="text-xs text-slate-400">
              Para volver a agrupar, lunes a viernes
              deben tener exactamente los mismos horarios.
            </p>
          )}
        </div>
      )}
    </div>
  );
}