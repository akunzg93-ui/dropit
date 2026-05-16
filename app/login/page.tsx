"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import LoginCard from "@/app/components/auth/LoginCard";

export default function LoginEstablecimiento() {
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
  }, []);

  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { role: "establishment" },
      },
    });
  }

  async function handleLogin(email: string, password: string) {
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

    const user = data.user;

    // bloquear acceso si no confirmó correo
    if (!user?.email_confirmed_at) {
      router.push("/verificar");
      return;
    }

    // usuario válido → continuar flujo
    router.push("/post-login");
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
        <div className="space-y-3">

          {/* 🔥 CAMBIO DE MODO */}
          <button
            onClick={() => router.push("/vendedor/login")}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2
              rounded-xl
              bg-gradient-to-r
              from-indigo-50
              to-blue-50
              text-indigo-600
              text-sm
              font-medium
              hover:from-indigo-100
              hover:to-blue-100
              transition
            "
          >
            Cambiar a modo emprendedor
          </button>

          {/* Google */}
          <button
            onClick={loginGoogle}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-3
              border
              border-slate-300
              rounded-xl
              py-3
              bg-white
              hover:bg-slate-50
              transition
            "
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
            />
            Continuar con Google
          </button>

        </div>
      }
    />
  );
}