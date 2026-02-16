"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterEstablecimiento() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function handleRegister() {
    setMensaje("");

    if (!email || !password || !confirm) {
      setMensaje("Completa todos los campos.");
      return;
    }

    if (password !== confirm) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    // 🔴 IMPORTANTE: cerrar sesión si hay usuario activo
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "establishment" },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    console.log("DATA SIGNUP:", data);

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      return;
    }

    router.push("/establecimiento/verificar");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted/30">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <div className="mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Modo Establecimiento
          </span>
        </div>

        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Registro Establecimiento
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Recibe paquetes de emprendedores y genera ingresos adicionales desde tu punto físico.
        </p>

        <label className="font-medium text-sm">
          Nombre del establecimiento
        </label>
        <Input
          className="mb-4"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label className="font-medium text-sm">
          Correo electrónico
        </label>
        <Input
          className="mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="font-medium text-sm">
          Contraseña
        </label>
        <Input
          className="mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="font-medium text-sm">
          Confirmar contraseña
        </label>
        <Input
          className="mb-4"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {mensaje && (
          <p className="text-red-500 text-sm mb-4">{mensaje}</p>
        )}

        <Button className="w-full" onClick={handleRegister}>
          Crear cuenta de establecimiento
        </Button>

      </div>
    </div>
  );
}
