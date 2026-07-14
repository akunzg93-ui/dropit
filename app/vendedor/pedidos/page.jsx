"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  Search,
  Download,
  XCircle,
} from "lucide-react";

const estadoBadge = {
  creado: "bg-blue-50 text-[#2563eb] border-blue-100",
  pendiente_aprobacion_establecimiento:
    "bg-amber-50 text-amber-700 border-amber-100",
  confirmado: "bg-sky-50 text-sky-700 border-sky-100",
  pendiente_recoleccion:
    "bg-indigo-50 text-indigo-700 border-indigo-100",
  en_transito: "bg-purple-50 text-purple-700 border-purple-100",
  entregado: "bg-emerald-50 text-emerald-700 border-emerald-100",
  devuelto: "bg-red-50 text-red-700 border-red-100",
  cancelado: "bg-slate-100 text-slate-700 border-slate-200",
};

const estadosCancelables = [
  "creado",
  "pendiente_aprobacion_establecimiento",
  "confirmado",
  "en_transito",
];

function formatEstado(estado) {
  return estado
    ?.replaceAll("_", " ")
    ?.replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tamanoFiltro, setTamanoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    if (!userId) return;

    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        producto,
        tamano,
        estado,
        codigo_vendedor,
        created_at
      `)
      .eq("vendedor_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando pedidos:", error);
      return;
    }

    setPedidos(data || []);
    setFiltered(data || []);
  }

  async function descargarEtiqueta(folio, codigo) {
    try {
      const res = await fetch("http://localhost:4000/generar-etiqueta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folio,
          codigo_vendedor: codigo,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${folio}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando etiqueta:", error);
    }
  }

  function abrirCancelacion(event, pedido) {
    event.stopPropagation();
    setPedidoACancelar(pedido);
  }

async function cancelarPedido() {
  if (!pedidoACancelar) return;

  try {
    setCancelando(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/orders/cancelar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        pedido_id: pedidoACancelar.id,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "No se pudo cancelar el pedido.");
      return;
    }

    alert("Pedido cancelado correctamente.");

    setPedidoACancelar(null);
    setPedidoSeleccionado(null);

    await cargarPedidos();
  } catch (error) {
    console.error(error);
    alert("Ocurrió un error.");
  } finally {
    setCancelando(false);
  }
}
  
  useEffect(() => {
    let pedidosFiltrados = [...pedidos];

    if (busqueda) {
      pedidosFiltrados = pedidosFiltrados.filter(
        (pedido) =>
          pedido.folio
            ?.toLowerCase()
            .includes(busqueda.toLowerCase()) ||
          pedido.producto
            ?.toLowerCase()
            .includes(busqueda.toLowerCase())
      );
    }

    if (tamanoFiltro && tamanoFiltro !== "todos") {
      pedidosFiltrados = pedidosFiltrados.filter(
        (pedido) => pedido.tamano === tamanoFiltro
      );
    }

    if (estadoFiltro && estadoFiltro !== "todos") {
      pedidosFiltrados = pedidosFiltrados.filter(
        (pedido) => pedido.estado === estadoFiltro
      );
    }

    setFiltered(pedidosFiltrados);
  }, [busqueda, tamanoFiltro, estadoFiltro, pedidos]);

  const metricas = {
    total: pedidos.length,
    en_transito: pedidos.filter(
      (pedido) => pedido.estado === "en_transito"
    ).length,
    entregado: pedidos.filter(
      (pedido) => pedido.estado === "entregado"
    ).length,
    devuelto: pedidos.filter(
      (pedido) => pedido.estado === "devuelto"
    ).length,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12 pb-36">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <h1 className="text-4xl font-bold leading-tight text-[#1e3a8a] md:text-5xl">
            Mis pedidos <span className="inline-block">📦</span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Consulta el estado de todos tus envíos y da seguimiento a cada
            pedido desde un solo lugar.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            icon={<Package size={20} />}
            label="Total"
            value={metricas.total}
            tone="blue"
          />

          <MetricCard
            icon={<Truck size={20} />}
            label="En tránsito"
            value={metricas.en_transito}
            tone="purple"
          />

          <MetricCard
            icon={<CheckCircle size={20} />}
            label="Entregados"
            value={metricas.entregado}
            tone="emerald"
          />

          <MetricCard
            icon={<RotateCcw size={20} />}
            label="Devueltos"
            value={metricas.devuelto}
            tone="red"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Filtros
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#1e3a8a]">
              Encuentra rápidamente un pedido
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                placeholder="Buscar por folio o producto..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                className="h-12 rounded-xl border-slate-300 bg-white pl-11 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Select
              onValueChange={setTamanoFiltro}
              value={tamanoFiltro}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white">
                <SelectValue placeholder="Tamaño" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="todos">
                  Todos los tamaños
                </SelectItem>

                <SelectItem value="small">
                  Paquete mediano
                </SelectItem>

                <SelectItem value="medium">
                  Paquete grande
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={setEstadoFiltro}
              value={estadoFiltro}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="todos">
                  Todos los estados
                </SelectItem>

                <SelectItem value="creado">Creado</SelectItem>

                <SelectItem value="pendiente_aprobacion_establecimiento">
                  Pendiente aprobación
                </SelectItem>

                <SelectItem value="confirmado">
                  Confirmado
                </SelectItem>

                <SelectItem value="pendiente_recoleccion">
                  Pendiente recolección
                </SelectItem>

                <SelectItem value="en_transito">
                  En tránsito
                </SelectItem>

                <SelectItem value="entregado">
                  Entregado
                </SelectItem>

                <SelectItem value="devuelto">
                  Devuelto
                </SelectItem>

                <SelectItem value="cancelado">
                  Cancelado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="space-y-4 md:hidden">
          {filtered.length === 0 && <EmptyState />}

          {filtered.map((pedido) => {
            const puedeCancelar = estadosCancelables.includes(
              pedido.estado
            );

            return (
              <div
                key={pedido.id}
                role="button"
                tabIndex={0}
                onClick={() => setPedidoSeleccionado(pedido)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    setPedidoSeleccionado(pedido);
                  }
                }}
                className="cursor-pointer space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-lg font-bold text-[#1e3a8a]">
                      {pedido.folio}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {pedido.producto}
                    </p>
                  </div>

                  <EstadoBadge estado={pedido.estado} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBox
                    label="Tamaño"
                    value={
                      pedido.tamano === "small"
                        ? "Paquete mediano"
                        : "Paquete grande"
                    }
                  />

                  <InfoBox
                    label="Fecha"
                    value={new Date(
                      pedido.created_at
                    ).toLocaleDateString()}
                  />
                </div>

                <div
                  className={
                    puedeCancelar
                      ? "grid grid-cols-2 gap-2"
                      : "grid grid-cols-1"
                  }
                >
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={(event) => {
                      event.stopPropagation();

                      descargarEtiqueta(
                        pedido.folio,
                        pedido.codigo_vendedor
                      );
                    }}
                    disabled={!pedido.codigo_vendedor}
                  >
                    <Download size={16} className="mr-2" />
                    Etiqueta
                  </Button>

                  {puedeCancelar && (
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={(event) =>
                        abrirCancelacion(event, pedido)
                      }
                    >
                      <XCircle size={16} className="mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>

                <p className="text-center text-xs text-slate-400">
                  Toca la tarjeta para ver el detalle
                </p>
              </div>
            );
          })}
        </div>

        <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-5 text-left">Folio</th>
                <th className="p-5 text-left">Producto</th>
                <th className="p-5 text-left">Tamaño</th>
                <th className="p-5 text-left">Estado</th>
                <th className="p-5 text-left">Fecha</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((pedido) => {
                const puedeCancelar =
                  estadosCancelables.includes(pedido.estado);

                return (
                  <tr
                    key={pedido.id}
                    onClick={() =>
                      setPedidoSeleccionado(pedido)
                    }
                    className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/50"
                  >
                    <td className="p-5 font-bold text-[#1e3a8a]">
                      {pedido.folio}
                    </td>

                    <td className="p-5 font-medium text-slate-900">
                      {pedido.producto}
                    </td>

                    <td className="p-5 text-slate-600">
                      {pedido.tamano === "small"
                        ? "Paquete mediano"
                        : "Paquete grande"}
                    </td>

                    <td className="p-5">
                      <EstadoBadge estado={pedido.estado} />
                    </td>

                    <td className="p-5 text-slate-500">
                      {new Date(
                        pedido.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="p-5">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={(event) => {
                            event.stopPropagation();

                            descargarEtiqueta(
                              pedido.folio,
                              pedido.codigo_vendedor
                            );
                          }}
                          disabled={!pedido.codigo_vendedor}
                        >
                          <Download
                            size={15}
                            className="mr-1"
                          />
                          Etiqueta
                        </Button>

                        {puedeCancelar && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(event) =>
                              abrirCancelacion(event, pedido)
                            }
                          >
                            <XCircle
                              size={15}
                              className="mr-1"
                            />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <Drawer
          open={!!pedidoSeleccionado}
          onOpenChange={(open) => {
            if (!open) {
              setPedidoSeleccionado(null);
            }
          }}
        >
          <DrawerContent className="p-6">
            <DrawerHeader>
              <DrawerTitle className="text-2xl font-bold text-[#1e3a8a]">
                Detalle del pedido 📦
              </DrawerTitle>

              <DrawerDescription>
                Información básica del pedido seleccionado.
              </DrawerDescription>
            </DrawerHeader>

            {pedidoSeleccionado && (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Folio
                  </p>

                  <p className="text-xl font-bold text-[#1e3a8a]">
                    {pedidoSeleccionado.folio}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoBox
                    label="Producto"
                    value={pedidoSeleccionado.producto}
                  />

                  <InfoBox
                    label="Tamaño"
                    value={
                      pedidoSeleccionado.tamano === "small"
                        ? "Paquete mediano"
                        : "Paquete grande"
                    }
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Estado
                  </p>

                  <EstadoBadge
                    estado={pedidoSeleccionado.estado}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Fecha de creación
                  </p>

                  <p className="font-semibold text-slate-900">
                    {new Date(
                      pedidoSeleccionado.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
                  onClick={() =>
                    descargarEtiqueta(
                      pedidoSeleccionado.folio,
                      pedidoSeleccionado.codigo_vendedor
                    )
                  }
                  disabled={
                    !pedidoSeleccionado.codigo_vendedor
                  }
                >
                  <Download size={16} className="mr-2" />
                  Descargar etiqueta
                </Button>

                {estadosCancelables.includes(
                  pedidoSeleccionado.estado
                ) && (
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() =>
                      setPedidoACancelar(pedidoSeleccionado)
                    }
                  >
                    <XCircle size={16} className="mr-2" />
                    Cancelar pedido
                  </Button>
                )}
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>

      {pedidoACancelar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-5"
          onClick={() => setPedidoACancelar(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                Cancelación
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#1e3a8a]">
                ¿Deseas cancelar este pedido?
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Pedido {pedidoACancelar.folio}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Motivo
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                Solicitud del cliente
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <ul className="space-y-2 text-sm text-amber-900">
                <li>• Se liberará el espacio reservado.</li>
                <li>• La Coin será reintegrada.</li>
                <li>• La cancelación será definitiva.</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={() => setPedidoACancelar(null)}
              >
                Volver
              </Button>

              <Button
  disabled={cancelando}
  className="h-12 flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700"
  onClick={cancelarPedido}
>
  {cancelando ? "Cancelando..." : "Cancelar pedido"}
</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, tone }) {
  const toneClass =
    tone === "purple"
      ? "bg-purple-50 text-purple-600 border-purple-100"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : tone === "red"
      ? "bg-red-50 text-red-600 border-red-100"
      : "bg-blue-50 text-[#2563eb] border-blue-100";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-slate-500">
          {label}
        </span>
      </div>

      <p className="text-3xl font-bold text-[#1e3a8a]">
        {value}
      </p>
    </div>
  );
}

function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        estadoBadge[estado] ||
        "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatEstado(estado)}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
      <p className="mb-2 text-3xl">📦</p>

      <p className="font-semibold text-[#1e3a8a]">
        No se encontraron pedidos.
      </p>

      <p className="mt-1 text-sm">
        Ajusta los filtros o crea un nuevo pedido para comenzar.
      </p>
    </div>
  );
}