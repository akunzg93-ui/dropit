"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Wallet, Filter } from "lucide-react";

export default function AdminRetiros() {
  const [retiros, setRetiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pending");

  const [modalOpen, setModalOpen] = useState(false);
  const [retiroSeleccionado, setRetiroSeleccionado] = useState<any>(null);
  const [referencia, setReferencia] = useState("");

  async function fetchRetiros() {
    let query = supabase
      .from("retiros")
      .select(`
        id,
        monto,
        status,
        created_at,
        establecimientos ( nombre )
      `)
      .order("created_at", { ascending: false });

    if (filtro !== "all") {
      query = query.eq("status", filtro);
    }

    const { data } = await query;

    if (data) setRetiros(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchRetiros();
  }, [filtro]);

  // 🔥 USAR API
  async function updateStatus(id: string, status: string) {
    await fetch("/api/orders/retiros/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        retiro_id: id,
        status,
      }),
    });

    fetchRetiros();
  }

  // 🔥 USAR API
  async function marcarPagado() {
    if (!retiroSeleccionado) return;

    await fetch("/api/orders/retiros/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        retiro_id: retiroSeleccionado.id,
        status: "paid",
        referencia_pago: referencia,
      }),
    });

    setModalOpen(false);
    setReferencia("");
    setRetiroSeleccionado(null);
    fetchRetiros();
  }

  const statusStyle = (status: string) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "approved") return "bg-blue-100 text-blue-700";
    if (status === "paid") return "bg-emerald-100 text-emerald-700";
    if (status === "reversed") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-900">Retiros</h1>
            <p className="text-sm text-slate-500">
              Gestión de pagos a establecimientos
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm">
            <Filter size={16} />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="text-sm outline-none"
            >
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="paid">Pagados</option>
              <option value="reversed">Rechazados</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border overflow-hidden">

          <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-slate-50 text-sm font-medium text-slate-600">
            <span>Establecimiento</span>
            <span>Monto</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          <div className="divide-y">

            {retiros.length === 0 && (
              <div className="py-16 flex flex-col items-center text-slate-500">
                <Wallet className="w-8 h-8 mb-3" />
                <p className="font-medium">No hay retiros</p>
              </div>
            )}

            {retiros.map((r) => (
              <div key={r.id} className="grid grid-cols-5 px-6 py-4 items-center">

                <div>{r.establecimientos?.nombre}</div>
                <div>${r.monto}</div>
                <div>{new Date(r.created_at).toLocaleDateString()}</div>

                <div>
                  <span className={`px-2 py-1 text-xs rounded ${statusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </div>

                <div className="flex gap-2">

                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(r.id, "approved")}
                        className="px-3 py-1 text-xs bg-indigo-600 text-white rounded"
                      >
                        Aprobar
                      </button>

                      <button
                        onClick={() => updateStatus(r.id, "reversed")}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                      >
                        Rechazar
                      </button>
                    </>
                  )}

                  {r.status === "approved" && (
                    <button
                      onClick={() => {
                        setRetiroSeleccionado(r);
                        setModalOpen(true);
                      }}
                      className="px-3 py-1 text-xs bg-emerald-600 text-white rounded"
                    >
                      Marcar pagado
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">

              <h2 className="text-lg font-semibold">
                Confirmar pago
              </h2>

              <input
                placeholder="Referencia de pago (opcional)"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1 text-sm"
                >
                  Cancelar
                </button>

                <button
                  onClick={marcarPagado}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Confirmar pago
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}