"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function EditarEstablecimiento({ params }) {

  const { id } = params;
  const [establecimiento, setEstablecimiento] = useState(null);
  const router = useRouter();

  useEffect(() => {
    cargar();
  }, []);

  // --------------------------------------------------------
  // Cargar establecimiento de Supabase
  // --------------------------------------------------------
  async function cargar() {
    console.log("Buscando establecimiento con id:", id);

    const { data, error } = await supabase
      .from("establecimientos")
      .select("*")
      .eq("id", id)
      .maybeSingle(); // ⬅ evita error cuando no existe

    if (error) {
      console.error("❌ ERROR SUPABASE:", error);
    }

    if (!data) {
      console.warn("⚠ No se encontró establecimiento con id:", id);
    }

    setEstablecimiento(data);
  }

  // --------------------------------------------------------
  // Actualizar establecimiento
  // --------------------------------------------------------
  async function actualizar(e) {
    e.preventDefault();

    await supabase
      .from("establecimientos")
      .update({
        nombre: establecimiento.nombre,
        direccion: establecimiento.direccion,
        cp: establecimiento.cp,
      })
      .eq("id", id);

    router.push("/admin/establecimientos");
  }

  // --------------------------------------------------------
  // Desactivar establecimiento (ya no eliminar)
  // --------------------------------------------------------
  async function desactivar() {
    if (!confirm("¿Seguro que deseas desactivar este establecimiento?")) return;

    const { error } = await supabase
      .from("establecimientos")
      .update({ activo: false })
      .eq("id", id);

    if (error) {
      alert("Ocurrió un error al desactivar el establecimiento");
      console.error(error);
      return;
    }

    router.push("/admin/establecimientos");
  }

  // --------------------------------------------------------
  // Render: evitar loop infinito de "Cargando..."
  // --------------------------------------------------------
  if (establecimiento === null) {
    return (
      <p className="text-gray-500 text-lg p-6">
        Cargando información del establecimiento...
      </p>
    );
  }

  if (!establecimiento) {
    return (
      <p className="text-red-600 text-lg p-6">
        No se encontró este establecimiento.
      </p>
    );
  }

  // --------------------------------------------------------
  // Render principal
  // --------------------------------------------------------
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-6">Editar Establecimiento</h1>

      <Card className="p-6 shadow-card">
        <form className="space-y-4" onSubmit={actualizar}>
          <div>
            <Label>Nombre</Label>
            <Input
              value={establecimiento.nombre}
              onChange={(e) =>
                setEstablecimiento({ ...establecimiento, nombre: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={establecimiento.direccion}
              onChange={(e) =>
                setEstablecimiento({ ...establecimiento, direccion: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Código Postal</Label>
            <Input
              value={establecimiento.cp}
              onChange={(e) =>
                setEstablecimiento({ ...establecimiento, cp: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
              Guardar cambios
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={desactivar}
            >
              Desactivar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
