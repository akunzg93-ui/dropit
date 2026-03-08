"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import LoginCard from "@/app/components/auth/LoginCard";

export default function LoginEstablecimiento() {
  const router = useRouter();

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Si ya hay sesión, redirigir al panel de establecimiento
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) return;

      const userId = data.session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!profile) return;

      if (profile.role === "establishment") {
        router.push("/establecimiento");
      }
    }

    checkSession();
  }, []);

async function loginGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        role: "establishment",
      },
    },
  });
}
  async function handleLogin(email, password) {
    setMensaje("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

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

    if (profile.role !== "establishment") {
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
      onSubmit={handleLogin}
      loading={loading}
      error={mensaje}
      footerText="¿No tienes cuenta?"
      footerLinkText="Registrar establecimiento"
      onFooterClick={() => router.push("/establecimiento/register")}
      extraButtons={
        <button
          onClick={loginGoogle}
          className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-xl py-3 bg-white hover:bg-slate-50 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
          />
          Continuar con Google
        </button>
      }
    />
  );
}