"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/");
        return;
      }

      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#2563eb]" />
          Cargando admin...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-[#1e3a8a]">
              Dropit
            </span>

            <span className="h-4 w-px bg-slate-200" />

            <span className="text-sm font-medium text-slate-500">
              Admin
            </span>
          </Link>

          <Link
            href="/logout"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-blue-50 hover:text-[#1e40af]"
          >
            <LogOut className="h-4 w-4" />
            <span>Salir</span>
          </Link>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}