"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function PostLogin() {
  const router = useRouter();

  useEffect(() => {
    async function checkRole() {

      // esperar hydration auth
      await new Promise((resolve) => setTimeout(resolve, 500));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!user.email_confirmed_at) {
        router.replace("/verificar");
        return;
      }

      let profile = null;

      // retry pequeño por si profile tarda en crearse
      for (let i = 0; i < 5; i++) {

        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          profile = data;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      // sin rol todavía
      if (!profile?.role) {
        router.replace("/seleccionar-rol");
        return;
      }

      if (profile.role === "vendor") {
        router.replace("/vendedor/dashboard");
        return;
      }

     if (profile.role === "establishment") {
  const {
    data: establecimientos,
    error: establecimientoError,
  } = await supabase
    .from("establecimientos")
    .select(`
      id,
      activo,
      fiscal_profile_id,
      created_at
    `)
    .eq("usuario_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (establecimientoError) {
    console.error(
      "Error revisando onboarding del establecimiento:",
      establecimientoError
    );

    router.replace("/establecimiento");
    return;
  }

  // Nunca ha registrado una ubicación.
  if (
    !establecimientos ||
    establecimientos.length === 0
  ) {
    router.replace("/establecimiento");
    return;
  }

  const ultimoEstablecimiento =
    establecimientos[0];

  // Nuevo establecimiento creado pero
  // todavía sin completar onboarding fiscal.
  if (
    ultimoEstablecimiento.activo === false ||
    !ultimoEstablecimiento.fiscal_profile_id
  ) {
    router.replace(
      `/establecimiento/onboarding-fiscal?establecimiento_id=${ultimoEstablecimiento.id}`
    );
    return;
  }

  // Onboarding completo.
  router.replace(
    "/establecimiento/estado"
  );
  return;
}

      if (profile.role === "buyer") {
        router.replace("/comprador");
        return;
      }

      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      // fallback seguro
      router.replace("/seleccionar-rol");
    }

    checkRole();

  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      Configurando tu cuenta...
    </div>
  );
}