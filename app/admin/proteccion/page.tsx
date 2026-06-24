"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminProteccionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [porcentaje, setPorcentaje] = useState("1.5");
  const [valorMaximo, setValorMaximo] = useState("10000");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarConfig();
  }, []);

  async function cargarConfig() {
    setLoading(true);
    setMensaje("");

    const { data, error } = await supabase
      .from("dropit_config")
      .select("clave, valor");

    setLoading(false);

    if (error) {
      console.error(error);
      setMensaje("No se pudo cargar la configuración.");
      return;
    }

    const config: Record<string, string> = {};
    data?.forEach((item) => {
      config[item.clave] = item.valor;
    });

    setEnabled(config.proteccion_enabled === "true");
    setPorcentaje(config.proteccion_porcentaje || "1.5");
    setValorMaximo(config.proteccion_valor_maximo || "10000");
  }

  async function guardarConfig() {
    setSaving(true);
    setMensaje("");

    const updates = [
      {
        clave: "proteccion_enabled",
        valor: enabled ? "true" : "false",
      },
      {
        clave: "proteccion_porcentaje",
        valor: porcentaje,
      },
      {
        clave: "proteccion_valor_maximo",
        valor: valorMaximo,
      },
    ];

    for (const item of updates) {
      const { error } = await supabase
        .from("dropit_config")
        .update({
          valor: item.valor,
          updated_at: new Date().toISOString(),
        })
        .eq("clave", item.clave);

      if (error) {
        console.error(error);
        setSaving(false);
        setMensaje("No se pudo guardar la configuración.");
        return;
      }
    }

    setSaving(false);
    setMensaje("Configuración guardada correctamente.");
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-gray-600">Cargando configuración...</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Protección Dropit
        </h1>

        <p className="text-gray-600 mb-6">
          Controla si los vendedores pueden asegurar pedidos, el porcentaje de
          cobro y el valor máximo asegurable.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between border rounded-xl p-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Activar protección
              </h2>
              <p className="text-sm text-gray-500">
                Si está apagado, no aparecerá la opción al crear pedido.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                enabled
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {enabled ? "Activa" : "Inactiva"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Porcentaje de protección
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1.5"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ejemplo: 1.5 significa 1.5% sobre el valor declarado.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor máximo asegurable
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={valorMaximo}
              onChange={(e) => setValorMaximo(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10000"
            />
            <p className="text-sm text-gray-500 mt-1">
              Monto máximo en MXN que podrá declarar el vendedor.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
            <strong>Nota:</strong> la cobertura solo aplica mientras el pedido
            está bajo custodia del establecimiento.
          </div>

          {mensaje && (
            <p className="text-sm text-gray-700 bg-gray-50 border rounded-xl p-3">
              {mensaje}
            </p>
          )}

          <button
            type="button"
            onClick={guardarConfig}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>
    </main>
  );
}