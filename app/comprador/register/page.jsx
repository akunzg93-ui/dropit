"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterComprador() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(""); // NUEVO
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function handleRegister() {
    setMensaje("");

    // 🔒 Validación si las contraseñas no coinciden
    if (password !== confirm) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "buyer" },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      return;
    }

    // Redirigir al login
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Registro Comprador
        </h1>

        <label className="font-medium">Nombre completo</label>
        <Input
          className="mb-4"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label className="font-medium">Correo electrónico</label>
        <Input
          className="mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="font-medium">Contraseña</label>
        <Input
          className="mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="font-medium">Confirmar contraseña</label>
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
          Crear cuenta
        </Button>

        <p className="text-sm text-center mt-4">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600 font-medium">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
