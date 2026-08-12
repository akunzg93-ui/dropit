"use client";

export default function FiscalProfileCard({
  perfil,
  seleccionado,
  onSelect,
}) {
  if (!perfil) return null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        seleccionado
          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-[#1e3a8a]">
            {perfil.nombre_perfil}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {perfil.razon_social}
          </p>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            RFC
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {perfil.rfc}
          </p>
        </div>

        <div
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            seleccionado
              ? "border-blue-500 bg-blue-500"
              : "border-slate-300 bg-white"
          }`}
        >
          {seleccionado && (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </div>
      </div>

      {perfil.es_predeterminado && (
        <span className="mt-3 inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Predeterminado
        </span>
      )}
    </button>
  );
}