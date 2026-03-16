"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import LoginCard from "@/app/components/auth/LoginCard";

export default function Login() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión → delega a /post-login
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) return;

      router.push("/post-login");
    }

    checkSession();
  }, [router]);

  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { role: "vendor" },
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
      setMensaje("Correo o contraseña incorrectos (verifica tu perfil).");
      return;
    }

    const user = data.user;

    // bloquear acceso si no confirmó correo
    if (!user?.email_confirmed_at) {
      await supabase.auth.signOut();
      router.push("/verificar");
      return;
    }

    // usuario válido → continuar flujo centralizado
    router.push("/post-login");
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