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
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.push("/seleccionar-rol");
        return;
      }

      if (!profile.role) {
        router.push("/seleccionar-rol");
        return;
      }

      if (profile.role === "vendor") {
        router.push("/vendedor/dashboard");
        return;
      }

      if (profile.role === "establishment") {
        router.push("/establecimiento");
        return;
      }

      if (profile.role === "buyer") {
        router.push("/comprador");
        return;
      }

      if (profile.role === "admin") {
        router.push("/admin");
        return;
      }
    }

    checkRole();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-slate-500">Cargando...</p>
    </div>
  );
}