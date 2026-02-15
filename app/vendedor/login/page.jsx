"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function handleLogin() {
    setMensaje("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje("Correo o contraseña incorrectos.");
      return;
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      setMensaje("No se pudo obtener tu perfil.");
      return;
    }

    const role = profile.role;

    if (role === "vendor") {
      router.push("/vendedor/dashboard");
      return;
    }

    if (role === "buyer") {
      router.push("/comprador");
      return;
    }

    if (role === "establishment") {  // 🔥 corregido
      router.push("/establecimiento");
      return;
    }

    if (role === "admin") {
      router.push("/admin");
      return;
    }

    setMensaje("Tu rol no está configurado correctamente.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted/30">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <div className="mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Modo Emprendedor
          </span>
        </div>

        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Acceso Emprendedor
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Inicia sesión para crear envíos y gestionar tus pedidos.
        </p>

        <Input
          type="email"
          placeholder="Correo electrónico"
          className="mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Contraseña"
          className="mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button className="w-full" onClick={handleLogin}>
          Iniciar sesión
        </Button>

        {mensaje && (
          <p className="text-red-500 text-center mt-4">{mensaje}</p>
        )}

        <p className="text-sm text-center mt-6">
          ¿No tienes cuenta?{" "}
          <span
            onClick={() => router.push("/vendedor/register")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Regístrate como emprendedor
          </span>
        </p>

        <p className="text-xs text-gray-500 text-center mt-4">
          Al continuar aceptas nuestros Términos y Política de privacidad.
        </p>

      </div>
    </div>
  );
}
