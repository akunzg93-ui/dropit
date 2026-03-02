"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoginCard from "@/app/components/auth/LoginCard";

export default function LoginEstablecimiento() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarLogin(email: string, password: string) {
    setMensaje("");

    if (!email || !password) {
      setMensaje("Escribe tu correo y contraseña.");
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      setMensaje("No se pudo iniciar sesión: " + error.message);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (perfilError || !perfil) {
      setMensaje("No se pudo obtener el rol del usuario.");
      return;
    }

    if (perfil.role !== "establishment") {
      setMensaje("Esta cuenta no pertenece a un establecimiento.");
      return;
    }

    router.push("/establecimiento");
  }

  return (
    <LoginCard
      badge="Modo Establecimiento"
      title="Acceso Establecimiento"
      subtitle="Inicia sesión para recibir y gestionar pedidos."
      onSubmit={manejarLogin}
      loading={cargando}
      error={mensaje}
      footerText="¿No tienes cuenta?"
      footerLinkText="Registrar establecimiento"
      onFooterClick={() => router.push("/establecimiento/register")}
    />
  );
}