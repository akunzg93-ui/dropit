"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function PostLogin() {

  const router = useRouter();

  useEffect(() => {

    async function checkRole() {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!user.email_confirmed_at) {
        router.replace("/verificar");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile?.role) {
        router.replace("/seleccionar-rol");
        return;
      }

      if (profile.role === "vendor") {
        router.replace("/vendedor/dashboard");
      }

      if (profile.role === "establishment") {
        router.replace("/establecimiento");
      }

      if (profile.role === "buyer") {
        router.replace("/comprador");
      }

      if (profile.role === "admin") {
        router.replace("/admin");
      }

    }

    checkRole();

  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      Cargando...
    </div>
  );
}