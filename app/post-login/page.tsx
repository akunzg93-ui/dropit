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
        router.replace("/establecimiento");
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