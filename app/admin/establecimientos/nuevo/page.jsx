"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function NuevoEstablecimiento() {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cp, setCp] = useState("");
  const router = useRouter();

  async function guardar(e) {
    e.preventDefault();
    if (!nombre || !direccion || !cp) return alert("Todos los campos son obligatorios");

    await supabase.from("establecimientos").insert({ nombre, direccion, cp });

    router.push("/admin/establecimientos");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-6">Nuevo Establecimiento</h1>

      <Card className="p-6 shadow-card">
        <form className="space-y-4" onSubmit={guardar}>
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div>
            <Label>Dirección</Label>
            <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>

          <div>
            <Label>Código Postal</Label>
            <Input value={cp} onChange={(e) => setCp(e.target.value)} />
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Guardar
          </Button>
        </form>
      </Card>
    </div>
  );
}
