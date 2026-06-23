"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ResumenItem = {
  user_id: string;
  email: string;
  small_disponibles: number;
  medium_disponibles: number;
  admin_small_asignadas: number;
  admin_medium_asignadas: number;
  admin_total_asignadas: number;
  admin_small_disponibles: number;
  admin_medium_disponibles: number;
  admin_total_disponibles: number;
  admin_total_consumidas: number;
};

type HistorialItem = {
  id: string;
  email: string;
  coin_tipo: string;
  cantidad: number;
  motivo: string;
  created_at: string;
};

type AsignacionState = {
  coinTipo: "small" | "medium";
  cantidad: number;
  motivo: string;
  loading: boolean;
};

export default function AdminCoinsPage() {
  const [resumen, setResumen] = useState<ResumenItem[]>([]);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [asignaciones, setAsignaciones] = useState<Record<string, AsignacionState>>(
    {}
  );
  const [mensaje, setMensaje] = useState("");
  const [loadingResumen, setLoadingResumen] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, []);

  async function obtenerAdminId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user.id;
  }

  function prepararAsignaciones(data: ResumenItem[]) {
    const inicial: Record<string, AsignacionState> = {};

    data.forEach((vendedor) => {
      inicial[vendedor.user_id] = {
        coinTipo: "small",
        cantidad: 1,
        motivo: "",
        loading: false,
      };
    });

    setAsignaciones(inicial);
  }

  async function cargarResumen() {
    setLoadingResumen(true);
    setMensaje("");

    const adminId = await obtenerAdminId();

    if (!adminId) {
      setMensaje("No se pudo validar la sesión del admin.");
      setLoadingResumen(false);
      return;
    }

    try {
      const res = await fetch("/api/orders/coins/admin-resumen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_id: adminId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data?.error || "Error cargando resumen de coins.");
        setLoadingResumen(false);
        return;
      }

      setResumen(data.resumen || []);
      setHistorial(data.historial || []);
      prepararAsignaciones(data.resumen || []);
    } catch (error) {
      console.error(error);
      setMensaje("Error inesperado cargando resumen.");
    }

    setLoadingResumen(false);
  }

  function actualizarAsignacion(
    userId: string,
    campo: keyof AsignacionState,
    valor: string | number | boolean
  ) {
    setAsignaciones((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [campo]: valor,
      },
    }));
  }

  function cambiarCantidad(userId: string, nuevaCantidad: number) {
    actualizarAsignacion(userId, "cantidad", Math.max(1, nuevaCantidad));
  }

  async function asignarCoins(vendedor: ResumenItem) {
    setMensaje("");

    const asignacion = asignaciones[vendedor.user_id];

    if (!asignacion) return;

    if (!asignacion.cantidad || asignacion.cantidad < 1) {
      setMensaje("La cantidad debe ser mayor a 0.");
      return;
    }

    if (!asignacion.motivo.trim()) {
      setMensaje("Escribe un motivo.");
      return;
    }

    const adminId = await obtenerAdminId();

    if (!adminId) {
      setMensaje("No se pudo validar la sesión del admin.");
      return;
    }

    actualizarAsignacion(vendedor.user_id, "loading", true);

    try {
      const res = await fetch("/api/orders/coins/admin-asignar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: adminId,
          email_vendedor: vendedor.email,
          coin_tipo: asignacion.coinTipo,
          cantidad: Number(asignacion.cantidad),
          motivo: asignacion.motivo.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data?.error || "Error asignando coins.");
        actualizarAsignacion(vendedor.user_id, "loading", false);
        return;
      }

      setMensaje(`Coins asignados correctamente a ${vendedor.email}.`);
      await cargarResumen();
    } catch (error) {
      console.error(error);
      setMensaje("Error inesperado asignando coins.");
      actualizarAsignacion(vendedor.user_id, "loading", false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-indigo-900">Asignar coins</h1>
        <p className="text-sm text-slate-500">
          Asigna coins manualmente a vendedores y consulta su historial.
        </p>
      </div>

      {mensaje && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {mensaje}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-indigo-900">
            Vendedores y asignación manual
          </h2>
          <p className="text-sm text-slate-500">
            Ajusta cantidad, tipo de coin y motivo por vendedor.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Disp. small</th>
                <th className="px-4 py-3 text-left">Disp. medium</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Cantidad</th>
                <th className="px-4 py-3 text-left">Motivo</th>
                <th className="px-4 py-3 text-left">Acción</th>
              </tr>
            </thead>

            <tbody>
              {loadingResumen ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={7}>
                    Cargando vendedores...
                  </td>
                </tr>
              ) : resumen.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={7}>
                    No hay vendedores para mostrar.
                  </td>
                </tr>
              ) : (
                resumen.map((vendedor) => {
                  const asignacion = asignaciones[vendedor.user_id];

                  return (
                    <tr key={vendedor.user_id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {vendedor.email}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {vendedor.small_disponibles}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {vendedor.medium_disponibles}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={asignacion?.coinTipo || "small"}
                          onChange={(e) =>
                            actualizarAsignacion(
                              vendedor.user_id,
                              "coinTipo",
                              e.target.value
                            )
                          }
                          className="w-28 rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidad(
                                vendedor.user_id,
                                Number(asignacion?.cantidad || 1) - 1
                              )
                            }
                            className="h-9 w-9 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={asignacion?.cantidad || 1}
                            onChange={(e) =>
                              cambiarCantidad(
                                vendedor.user_id,
                                Number(e.target.value)
                              )
                            }
                            className="w-16 rounded-xl border border-slate-300 px-2 py-2 text-center text-slate-800 outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidad(
                                vendedor.user_id,
                                Number(asignacion?.cantidad || 1) + 1
                              )
                            }
                            className="h-9 w-9 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={asignacion?.motivo || ""}
                          onChange={(e) =>
                            actualizarAsignacion(
                              vendedor.user_id,
                              "motivo",
                              e.target.value
                            )
                          }
                          placeholder="Ej. Bono QA"
                          className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => asignarCoins(vendedor)}
                          disabled={asignacion?.loading}
                          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {asignacion?.loading ? "Asignando..." : "Asignar"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-indigo-900">
            Resumen por vendedor
          </h2>
          <p className="text-sm text-slate-500">
            Diferencia entre coins disponibles, asignadas por admin y consumidas.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Disp. small</th>
                <th className="px-4 py-3 text-left">Disp. medium</th>
                <th className="px-4 py-3 text-left">Histórico admin</th>
                <th className="px-4 py-3 text-left">Admin disponibles</th>
                <th className="px-4 py-3 text-left">Admin consumidas</th>
              </tr>
            </thead>

            <tbody>
              {loadingResumen ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Cargando resumen...
                  </td>
                </tr>
              ) : resumen.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    No hay vendedores para mostrar.
                  </td>
                </tr>
              ) : (
                resumen.map((item) => (
                  <tr key={item.user_id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.small_disponibles}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.medium_disponibles}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">
                      {item.admin_total_asignadas}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.admin_total_disponibles}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.admin_total_consumidas}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-indigo-900">
            Historial de asignaciones admin
          </h2>
          <p className="text-sm text-slate-500">
            Registro de coins asignados manualmente y motivo.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Cantidad</th>
                <th className="px-4 py-3 text-left">Motivo</th>
              </tr>
            </thead>

            <tbody>
              {loadingResumen ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    Cargando historial...
                  </td>
                </tr>
              ) : historial.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    Todavía no hay asignaciones manuales.
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(item.created_at).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.coin_tipo}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.motivo || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}