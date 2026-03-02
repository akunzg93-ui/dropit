"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import LoginCard from "@/app/components/auth/LoginCard";

export default function Login() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(email, password) {
    setMensaje("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMensaje("Correo o contraseña incorrectos (verifica tu perfil).");
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

    if (role === "establishment") {
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
    <LoginCard
      badge="Modo Emprendedor"
      title="Acceso Emprendedor"
      subtitle="Inicia sesión para crear envíos y gestionar tus pedidos."
      onSubmit={handleLogin}
      loading={loading}
      error={mensaje}
      footerText="¿No tienes cuenta?"
      footerLinkText="Regístrate como emprendedor"
      onFooterClick={() => router.push("/vendedor/register")}
    />
  );
}