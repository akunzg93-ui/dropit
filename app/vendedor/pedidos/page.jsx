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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Total", metricas.total],
          ["En tránsito", metricas.en_transito],
          ["Entregado", metricas.entregado],
          ["Devuelto", metricas.devuelto],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p>{label}</p>
              <p className="text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          placeholder="Buscar por folio o producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <Select onValueChange={setTamanoFiltro}>
          <SelectTrigger>
            <SelectValue placeholder="Tamaño" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeño</SelectItem>
            <SelectItem value="medium">Mediano</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setEstadoFiltro}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creado">Creado</SelectItem>
            <SelectItem value="en_transito">En tránsito</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
            <SelectItem value="devuelto">Devuelto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLA */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3 text-left">Folio</th>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-left">Tamaño</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Fecha</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-semibold">{p.folio}</td>
                <td className="p-3">{p.producto}</td>
                <td className="p-3 capitalize">{p.tamano}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${estadoBadge[p.estado]}`}
                  >
                    {p.estado.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>

                {/* 🔥 ACCIONES */}
                <td className="p-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        descargarEtiqueta(p.folio, p.codigo_vendedor)
                      }
                      disabled={!p.codigo_vendedor}
                    >
                      Etiqueta
                    </Button>

                    <Button
                      size="sm"
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
                <td colSpan="6" className="p-4 text-center text-gray-500">
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
        onOpenChange={() => setPedidoSeleccionado(null)}
      >
        <DrawerContent className="p-6">
          <DrawerHeader>
            <DrawerTitle>Detalle del Pedido</DrawerTitle>
            <DrawerDescription>
              Información básica del pedido
            </DrawerDescription>
          </DrawerHeader>

          {pedidoSeleccionado && (
            <div className="space-y-2">
              <p><strong>Folio:</strong> {pedidoSeleccionado.folio}</p>
              <p><strong>Producto:</strong> {pedidoSeleccionado.producto}</p>
              <p><strong>Tamaño:</strong> {pedidoSeleccionado.tamano}</p>
              <p><strong>Estado:</strong> {pedidoSeleccionado.estado}</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}