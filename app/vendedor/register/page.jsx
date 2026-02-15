"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RegisterVendedor() {
  const router = useRouter();

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
        data: { role: "vendor" },
        emailRedirectTo: `${window.location.origin}/vendedor/login`,
      },
    });

    console.log("DATA SIGNUP:", data);

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      return;
    }

    router.push("/login?msg=verifica");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted/30">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        {/* Badge */}
        <div className="mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Modo Emprendedor
          </span>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Registro Emprendedor
        </h1>

        {/* Subtítulo */}
        <p className="text-sm text-gray-600 mb-6">
          Crea tu cuenta para comenzar a enviar paquetes y gestionar tus pedidos.
        </p>

        <Input
          placeholder="Correo electrónico"
          type="email"
          className="mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          className="mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          placeholder="Confirmar contraseña"
          type="password"
          className="mb-4"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button className="w-full" onClick={handleRegister}>
          Crear cuenta de emprendedor
        </Button>

        {mensaje && (
          <p className="text-red-500 text-center mt-4">{mensaje}</p>
        )}

        {/* Login link */}
        <p className="text-sm text-center mt-6">
          ¿Ya tienes cuenta?{" "}
          <span
            onClick={() => router.push("/vendedor/login")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Inicia sesión
          </span>
        </p>

        {/* Legal */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Al registrarte aceptas nuestros Términos y Política de privacidad.
        </p>

      </div>
    </div>
  );
}
