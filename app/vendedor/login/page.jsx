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

    // LOGIN
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje("Correo o contraseña incorrectos.");
      return;
    }

    const userId = data.user.id;

    // TRAER EL PERFIL
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

    // REDIRIGIR SEGÚN EL ROL
    if (role === "vendor") {
      router.push("/vendedor/dashboard");
      return;
    }

    if (role === "buyer") {
      router.push("/comprador");
      return;
    }

    if (role === "establecimiento") {
      router.push("/establecimiento");
      return;
    }

    if (role === "admin") {
      router.push("/admin");
      return;
    }

    setMensaje("Tu rol no está configurado.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-md">

        <h1 className="text-3xl font-bold text-center mb-6 text-primary">
          Iniciar sesión
        </h1>

        <Input
          type="email"
          placeholder="Correo"
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
      </div>
    </div>
  );
}
