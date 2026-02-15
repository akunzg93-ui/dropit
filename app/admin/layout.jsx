"use client";

import Link from "next/link";
import { Home, Building2, ClipboardList, Map, AlertTriangle, LogOut } from "lucide-react";
import "./admin.css";

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-blue-600 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold">
          entregas-web
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<Home />} text="Dashboard" href="/admin" />
          <SidebarItem icon={<Building2 />} text="Establecimientos" href="/admin/establecimientos" />
          <SidebarItem icon={<ClipboardList />} text="Pedidos" href="/admin/pedidos" />
          <SidebarItem icon={<Map />} text="Mapa" href="/admin/mapa" />
          <SidebarItem icon={<AlertTriangle />} text="Incidencias" href="/admin/incidencias" />
        </nav>

        <div className="p-4 border-t border-blue-500">
          <SidebarItem icon={<LogOut />} text="Salir" href="/logout" />
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b p-4 shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold">Panel de Administrador</h1>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, text, href }) {
  return (
    <Link href={href}>
      <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-blue-500 cursor-pointer transition">
        {icon}
        <span>{text}</span>
      </div>
    </Link>
  );
}
