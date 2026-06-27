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
  Eye,
} from "lucide-react";

const estadoBadge = {
  creado: "bg-blue-50 text-[#2563eb] border-blue-100",
  pendiente_aprobacion_establecimiento:
    "bg-amber-50 text-amber-700 border-amber-100",
  confirmado: "bg-sky-50 text-sky-700 border-sky-100",
  pendiente_recoleccion: "bg-indigo-50 text-indigo-700 border-indigo-100",
  en_transito: "bg-purple-50 text-purple-700 border-purple-100",
  entregado: "bg-emerald-50 text-emerald-700 border-emerald-100",
  devuelto: "bg-red-50 text-red-700 border-red-100",
};

function formatEstado(estado) {
  return estado?.replaceAll("_", " ")?.replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tamanoFiltro, setTamanoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

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
    } catch (err) {
      console.error("Error descargando etiqueta:", err);
    }
  }

  useEffect(() => {
    let f = [...pedidos];

    if (busqueda) {
      f = f.filter(
        (p) =>
          p.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.producto?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (tamanoFiltro && tamanoFiltro !== "todos") {
      f = f.filter((p) => p.tamano === tamanoFiltro);
    }

    if (estadoFiltro && estadoFiltro !== "todos") {
      f = f.filter((p) => p.estado === estadoFiltro);
    }

    setFiltered(f);
  }, [busqueda, tamanoFiltro, estadoFiltro, pedidos]);

  const metricas = {
    total: pedidos.length,
    en_transito: pedidos.filter((p) => p.estado === "en_transito").length,
    entregado: pedidos.filter((p) => p.estado === "entregado").length,
    devuelto: pedidos.filter((p) => p.estado === "devuelto").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12 pb-36">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] leading-tight">
              Mis pedidos <span className="inline-block">📦</span>
            </h1>

            <p className="text-slate-600 mt-4 max-w-2xl text-lg">
              Consulta el estado de todos tus envíos y da seguimiento a cada
              pedido desde un solo lugar.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <section className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Filtros
            </p>
            <h2 className="text-xl font-bold text-[#1e3a8a] mt-1">
              Encuentra rápidamente un pedido
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Buscar por folio o producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-12 rounded-xl pl-11 border-slate-300 bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Select onValueChange={setTamanoFiltro} value={tamanoFiltro}>
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white">
                <SelectValue placeholder="Tamaño" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="todos">Todos los tamaños</SelectItem>
                <SelectItem value="small">Paquete mediano</SelectItem>
                <SelectItem value="medium">Paquete grande</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setEstadoFiltro} value={estadoFiltro}>
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="creado">Creado</SelectItem>
                <SelectItem value="pendiente_aprobacion_establecimiento">
                  Pendiente aprobación
                </SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendiente_recoleccion">
                  Pendiente recolección
                </SelectItem>
                <SelectItem value="en_transito">En tránsito</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="md:hidden space-y-4">
          {filtered.length === 0 && (
            <EmptyState />
          )}

          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-lg text-[#1e3a8a] break-words">
                    {p.folio}
                  </p>

                  <p className="text-sm text-slate-600 mt-1">{p.producto}</p>
                </div>

                <EstadoBadge estado={p.estado} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoBox
                  label="Tamaño"
                  value={p.tamano === "small" ? "Paquete mediano" : "Paquete grande"}
                />

                <InfoBox
                  label="Fecha"
                  value={new Date(p.created_at).toLocaleDateString()}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => descargarEtiqueta(p.folio, p.codigo_vendedor)}
                  disabled={!p.codigo_vendedor}
                >
                  <Download size={16} className="mr-2" />
                  Etiqueta
                </Button>

                <Button
                  className="flex-1 h-11 rounded-xl bg-[#2563eb] hover:bg-[#1e40af]"
                  onClick={() => setPedidoSeleccionado(p)}
                >
                  <Eye size={16} className="mr-2" />
                  Ver
                </Button>
              </div>
            </div>
          ))}
        </div>

        <section className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
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
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-100 hover:bg-blue-50/40 transition"
                >
                  <td className="p-5 font-bold text-[#1e3a8a]">{p.folio}</td>

                  <td className="p-5 font-medium text-slate-900">
                    {p.producto}
                  </td>

                  <td className="p-5 text-slate-600">
                    {p.tamano === "small" ? "Paquete mediano" : "Paquete grande"}
                  </td>

                  <td className="p-5">
                    <EstadoBadge estado={p.estado} />
                  </td>

                  <td className="p-5 text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-5">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          descargarEtiqueta(p.folio, p.codigo_vendedor)
                        }
                        disabled={!p.codigo_vendedor}
                      >
                        <Download size={15} className="mr-1" />
                        Etiqueta
                      </Button>

                      <Button
                        size="sm"
                        className="rounded-xl bg-[#2563eb] hover:bg-[#1e40af]"
                        onClick={() => setPedidoSeleccionado(p)}
                      >
                        Ver
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

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
          onOpenChange={() => setPedidoSeleccionado(null)}
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
              <div className="space-y-4 mt-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Folio
                  </p>

                  <p className="font-bold text-xl text-[#1e3a8a]">
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

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                    Estado
                  </p>

                  <EstadoBadge estado={pedidoSeleccionado.estado} />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Fecha de creación
                  </p>

                  <p className="font-semibold text-slate-900">
                    {new Date(
                      pedidoSeleccionado.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold"
                  onClick={() =>
                    descargarEtiqueta(
                      pedidoSeleccionado.folio,
                      pedidoSeleccionado.codigo_vendedor
                    )
                  }
                  disabled={!pedidoSeleccionado.codigo_vendedor}
                >
                  <Download size={16} className="mr-2" />
                  Descargar etiqueta
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center border ${toneClass}`}
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>

      <p className="text-3xl font-bold text-[#1e3a8a]">{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
        estadoBadge[estado] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatEstado(estado)}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
      <p className="text-3xl mb-2">📦</p>
      <p className="font-semibold text-[#1e3a8a]">No se encontraron pedidos.</p>
      <p className="text-sm mt-1">
        Ajusta los filtros o crea un nuevo pedido para comenzar.
      </p>
    </div>
  );
}