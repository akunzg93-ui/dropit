"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import Link from "next/link";
import {
  Home,
  Building2,
  ClipboardList,
  Map,
  AlertTriangle,
  LogOut,
  Wallet,
} from "lucide-react";

import "./admin.css";

export default function AdminLayout({ children }: any) {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando admin...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col">
        <div className="p-6">
          <p className="text-xs text-blue-200">Dropit</p>
          <p className="text-xl font-semibold">Admin</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<Home size={18} />} text="Dashboard" href="/admin" />
          <SidebarItem
            icon={<Wallet size={18} />}
            text="Finanzas"
            href="/admin/retiros"
          />
          <SidebarItem
            icon={<Building2 size={18} />}
            text="Establecimientos"
            href="/admin/establecimientos"
          />
          <SidebarItem
            icon={<ClipboardList size={18} />}
            text="Pedidos"
            href="/admin/pedidos"
          />
          <SidebarItem icon={<Map size={18} />} text="Mapa" href="/admin/mapa" />
          <SidebarItem
            icon={<AlertTriangle size={18} />}
            text="Incidencias"
            href="/admin/incidencias"
          />
        </nav>

        <div className="p-4 border-t border-blue-500">
          <SidebarItem icon={<LogOut size={18} />} text="Salir" href="/logout" />
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-5">
          <h1 className="text-xl font-semibold text-slate-900">
            Panel de Administrador
          </h1>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, text, href }: any) {
  return (
    <Link href={href}>
      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-500/90 cursor-pointer transition">
        {icon}
        <span>{text}</span>
      </div>
    </Link>
  );
}