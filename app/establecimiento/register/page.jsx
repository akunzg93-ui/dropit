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

    if (password !== confirm) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "establishment" },
        emailRedirectTo: `${window.location.origin}/establecimiento/login`,
      },
    });

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted/30">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        {/* Badge de modo */}
        <div className="mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Modo Establecimiento
          </span>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Registro Establecimiento
        </h1>

        {/* Subtítulo */}
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

        {/* Legal */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          Al registrarte aceptas nuestros Términos y Política de privacidad.
        </p>

        {/* Login link */}
        <p className="text-sm text-center mt-4">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600 font-medium hover:underline">
            Inicia sesión
          </a>
        </p>

      </div>
    </div>
  );
}
