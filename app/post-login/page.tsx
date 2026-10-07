"use client";

import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

function PostLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole = searchParams.get("role");

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

    // Usuario nuevo proveniente de un flujo OAuth conocido.
if (!profile?.role) {
  if (
    requestedRole === "vendor" ||
    requestedRole === "establishment"
  ) {
    router.replace(
      `/completar-registro?role=${requestedRole}`
    );
    return;
  }

  // Perfil sin rol y sin un origen de registro válido.
  // No permitimos seleccionar el rol libremente.
  await supabase.auth.signOut();
  router.replace("/login");
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
    .select("id")
    .eq("usuario_id", user.id)
    .limit(1);

  if (establecimientoError) {
    console.error(
      "Error revisando establecimientos:",
      establecimientoError
    );

    router.replace("/establecimiento/estado");
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

  // Ya tiene al menos un establecimiento registrado.
  // La configuración fiscal se administra por separado
  // y no bloquea el acceso al panel.
  router.replace("/establecimiento/estado");
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

      // Rol desconocido o no soportado.
await supabase.auth.signOut();
router.replace("/login");
    }

    checkRole();

 }, [router, requestedRole]);

  return (
    <div className="flex items-center justify-center h-screen">
      Configurando tu cuenta...
    </div>
  );
}

export default function PostLogin() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Configurando tu cuenta...
        </div>
      }
    >
      <PostLoginContent />
    </Suspense>
  );
}