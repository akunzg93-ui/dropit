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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

// Badge por estado
const estadoBadge = {
  creado: "bg-gray-200 text-gray-700",
  en_transito: "bg-blue-200 text-blue-700",
  entregado: "bg-green-200 text-green-700",
  devuelto: "bg-red-200 text-red-700",
};

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

  // 🔥 DESCARGAR ETIQUETA
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

  // 🔹 Filtros
  useEffect(() => {
    let f = [...pedidos];

    if (busqueda) {
      f = f.filter(
        (p) =>
          p.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.producto?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (tamanoFiltro) f = f.filter((p) => p.tamano === tamanoFiltro);
    if (estadoFiltro) f = f.filter((p) => p.estado === estadoFiltro);

    setFiltered(f);
  }, [busqueda, tamanoFiltro, estadoFiltro, pedidos]);

  const metricas = {
    total: pedidos.length,
    en_transito: pedidos.filter((p) => p.estado === "en_transito").length,
    entregado: pedidos.filter((p) => p.estado === "entregado").length,
    devuelto: pedidos.filter((p) => p.estado === "devuelto").length,
  };

  return (
  <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-12 pb-36">
    <div className="max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Mis pedidos
          </h1>

          <p className="text-slate-500 mt-1">
            Gestiona y rastrea todos tus envíos.
          </p>
        </div>

        <div className="
          inline-flex
          items-center
          gap-2
          px-4
          py-2
          rounded-full
          bg-indigo-50
          text-indigo-600
          text-sm
          font-medium
          w-fit
        ">
          🚚 Dashboard operativo
        </div>

      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {[
          [
            "Total",
            metricas.total,
            "bg-white border-slate-200",
            "text-slate-900",
          ],

          [
            "En tránsito",
            metricas.en_transito,
            "bg-blue-50 border-blue-200",
            "text-blue-700",
          ],

          [
            "Entregado",
            metricas.entregado,
            "bg-emerald-50 border-emerald-200",
            "text-emerald-700",
          ],

          [
            "Devuelto",
            metricas.devuelto,
            "bg-red-50 border-red-200",
            "text-red-700",
          ],

        ].map(([label, value, bg, color]) => (
          <div
            key={label}
            className={`
              rounded-[28px]
              border
              p-5
              shadow-sm
              ${bg}
            `}
          >
            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className={`text-3xl font-bold mt-2 ${color}`}>
              {value}
            </p>
          </div>
        ))}

      </div>

      {/* FILTROS */}
      <div className="
        bg-white
        rounded-[28px]
        border
        border-slate-200
        shadow-sm
        p-4
        md:p-5
      ">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <Input
            placeholder="Buscar por folio o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-12 rounded-2xl"
          />

          <Select onValueChange={setTamanoFiltro}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Tamaño" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="small">
                Pequeño
              </SelectItem>

              <SelectItem value="medium">
                Mediano
              </SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setEstadoFiltro}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>

            <SelectContent>

              <SelectItem value="creado">
                Creado
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

            </SelectContent>
          </Select>

        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">

        {filtered.length === 0 && (
          <div className="
            bg-white
            rounded-[28px]
            border
            border-slate-200
            p-8
            text-center
            text-slate-500
          ">
            No se encontraron pedidos.
          </div>
        )}

        {filtered.map((p) => (
          <div
            key={p.id}
            className="
              bg-white
              rounded-[28px]
              border
              border-slate-200
              p-5
              shadow-sm
              space-y-4
            "
          >

            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">

                <p className="font-bold text-lg text-slate-900 break-words">
                  {p.folio}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {p.producto}
                </p>

              </div>

              <span
                className={`
                  px-3
                  py-1.5
                  rounded-full
                  text-xs
                  whitespace-nowrap
                  ${estadoBadge[p.estado]}
                `}
              >
                {p.estado.replace("_", " ")}
              </span>

            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">

              <div>
                <p className="text-slate-400 text-xs">
                  Tamaño
                </p>

                <p className="font-medium capitalize">
                  {p.tamano}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">
                  Fecha
                </p>

                <p className="font-medium">
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>

            </div>

            <div className="flex gap-2">

              <Button
                variant="outline"
                className="flex-1 h-11 rounded-2xl"
                onClick={() =>
                  descargarEtiqueta(
                    p.folio,
                    p.codigo_vendedor
                  )
                }
                disabled={!p.codigo_vendedor}
              >
                Etiqueta
              </Button>

              <Button
                className="
                  flex-1
                  h-11
                  rounded-2xl
                  bg-indigo-600
                  hover:bg-indigo-700
                "
                onClick={() =>
                  setPedidoSeleccionado(p)
                }
              >
                Ver pedido
              </Button>

            </div>

          </div>
        ))}

      </div>

      {/* TABLA DESKTOP */}
      <div className="
        hidden
        md:block
        bg-white
        border
        border-slate-200
        rounded-[28px]
        overflow-hidden
        shadow-sm
      ">

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
                className="
                  border-t
                  hover:bg-slate-50
                  transition
                "
              >

                <td className="p-5 font-semibold">
                  {p.folio}
                </td>

                <td className="p-5">
                  {p.producto}
                </td>

                <td className="p-5 capitalize">
                  {p.tamano}
                </td>

                <td className="p-5">
                  <span
                    className={`
                      px-3
                      py-1.5
                      rounded-full
                      text-xs
                      ${estadoBadge[p.estado]}
                    `}
                  >
                    {p.estado.replace("_", " ")}
                  </span>
                </td>

                <td className="p-5">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>

                <td className="p-5">

                  <div className="flex gap-2 justify-end">

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        descargarEtiqueta(
                          p.folio,
                          p.codigo_vendedor
                        )
                      }
                      disabled={!p.codigo_vendedor}
                    >
                      Etiqueta
                    </Button>

                    <Button
                      size="sm"
                      className="
                        rounded-xl
                        bg-indigo-600
                        hover:bg-indigo-700
                      "
                      onClick={() =>
                        setPedidoSeleccionado(p)
                      }
                    >
                      Ver
                    </Button>

                  </div>

                </td>

              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="
                    p-8
                    text-center
                    text-slate-500
                  "
                >
                  No se encontraron pedidos.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

      {/* DRAWER */}
      <Drawer
        open={!!pedidoSeleccionado}
        onOpenChange={() =>
          setPedidoSeleccionado(null)
        }
      >
        <DrawerContent className="p-6">

          <DrawerHeader>

            <DrawerTitle>
              Detalle del Pedido
            </DrawerTitle>

            <DrawerDescription>
              Información básica del pedido
            </DrawerDescription>

          </DrawerHeader>

          {pedidoSeleccionado && (
            <div className="space-y-4 mt-4">

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400">
                  Folio
                </p>

                <p className="font-semibold text-lg">
                  {pedidoSeleccionado.folio}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">
                    Producto
                  </p>

                  <p className="font-medium">
                    {pedidoSeleccionado.producto}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">
                    Tamaño
                  </p>

                  <p className="font-medium capitalize">
                    {pedidoSeleccionado.tamano}
                  </p>
                </div>

              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-2">
                  Estado
                </p>

                <span
                  className={`
                    px-3
                    py-1.5
                    rounded-full
                    text-xs
                    ${estadoBadge[pedidoSeleccionado.estado]}
                  `}
                >
                  {pedidoSeleccionado.estado.replace("_", " ")}
                </span>
              </div>

            </div>
          )}

        </DrawerContent>
      </Drawer>

    </div>
  </div>
);
}