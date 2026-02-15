"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

export default function EstablecimientosLista() {
  const [establecimientos, setEstablecimientos] = useState([]);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data, error } = await supabase.from("establecimientos").select("*");

    if (error) console.error("Error cargando establecimientos:", error);

    setEstablecimientos(data || []);
  }

  async function eliminar(id) {
    if (!confirm("¿Seguro que quieres eliminar este establecimiento?")) return;

    const { error } = await supabase.from("establecimientos").delete().eq("id", id);

    if (error) {
      alert("Error al eliminar");
      console.error(error);
      return;
    }

    cargar();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Establecimientos</h1>
        <Link href="/admin/establecimientos/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Nuevo establecimiento
          </Button>
        </Link>
      </div>

      <Card className="p-4 shadow-card">
        <table className="min-w-full text-left border">
          <thead className="bg-gray-100 border">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Dirección</th>
              <th className="p-2 border">CP</th>
              <th className="p-2 border w-32">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {establecimientos.map((e) => (
              <tr key={e.id}>
                <td className="p-2 border">{e.id}</td>
                <td className="p-2 border">{e.nombre}</td>
                <td className="p-2 border">{e.direccion}</td>
                <td className="p-2 border">{e.cp}</td>
                <td className="p-2 border flex gap-2">
                  <Link href={`/admin/establecimientos/${e.id}`}>
                    <Button size="sm" variant="outline">
                      <Pencil size={16} />
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => eliminar(e.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
