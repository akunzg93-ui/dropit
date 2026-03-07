"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Store,
  Package,
  User,
  LogOut,
  Shield,
  FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import RoleSwitcher from "@/app/components/RoleSwitcher";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userMenu, setUserMenu] = useState(false);

  const pathname = usePathname();
  const toggleMenu = () => setOpen(!open);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);

      if (u) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single();

        if (profile?.role) setRole(profile.role);
      }
    };

    cargar();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const u = session?.user || null;
        setUser(u);

        if (u) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", u.id)
            .single();

          if (profile?.role) setRole(profile.role);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    window.location.href = "/login";
  };

  const active = (path) =>
    pathname.startsWith(path)
      ? "text-[#2d6cdf] font-semibold"
      : "text-gray-700";

  return (
    <nav className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="flex items-center">
          <img
            src="/brand/logo-dropit.png"
            alt="DROPIT"
            className="h-16 w-auto"
          />
        </Link>

        {/* MENU DESKTOP */}
        <div className="hidden md:flex gap-8 text-sm font-medium items-center">
          {/* TERMINOS */}
<Link
  href="/terminos"
  className={`flex items-center gap-1 ${active("/terminos")}`}
>
  <FileText size={16} /> Términos y condiciones
</Link>
          {user && <RoleSwitcher />}

          {/* ADMIN */}
          {role === "admin" && (
            <div className="relative group">
              <button className={`flex items-center gap-1 ${active("/admin")}`}>
                <Shield size={16} /> Admin ▾
              </button>
              <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border shadow-xl rounded-md py-2 w-60 z-50">
                <Link href="/admin/usuarios" className="px-4 py-2 hover:bg-gray-100">
                  Gestión de usuarios
                </Link>
                <Link href="/admin/reportes" className="px-4 py-2 hover:bg-gray-100">
                  Reportes del sistema
                </Link>
              </div>
            </div>
          )}

          {/* ESTABLECIMIENTO */}
          {["establishment", "admin"].includes(role) && (
            <div className="relative group">
              <button className={`flex items-center gap-1 ${active("/establecimiento")}`}>
                <Store size={16} /> Establecimiento ▾
              </button>
              <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border shadow-xl rounded-md py-2 w-60 z-50">
                <Link href="/establecimiento" className="px-4 py-2 hover:bg-gray-100">
                  Registrar punto
                </Link>
                <Link href="/establecimiento/estado" className="px-4 py-2 hover:bg-gray-100">
                  Panel de operación
                </Link>
                <Link href="/establecimiento/recibir-pedido" className="px-4 py-2 hover:bg-gray-100">
                  Recepción de pedido
                </Link>
                <Link href="/establecimiento/entregar" className="px-4 py-2 hover:bg-gray-100">
                  Entregar pedido
                </Link>
                <Link href="/establecimiento/balance" className="px-4 py-2 hover:bg-gray-100">
                  Balance financiero
                </Link>
              </div>
            </div>
          )}

          {/* VENDEDOR SIMPLIFICADO */}
          {["vendor", "admin"].includes(role) && (
            <div className="relative group">
              <button className={`flex items-center gap-1 ${active("/vendedor")}`}>
                <User size={16} /> Vendedor ▾
              </button>
              <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border shadow-xl rounded-md py-2 w-60 z-50">
                <Link href="/vendedor/dashboard" className="px-4 py-2 hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link href="/vendedor/crear-pedido" className="px-4 py-2 hover:bg-gray-100">
                  Crear pedido
                </Link>
              </div>
            </div>
          )}

          {/* COMPRADOR */}
          {["buyer", "admin"].includes(role) && (
            <div className="relative group">
              <button className={`flex items-center gap-1 ${active("/comprador")}`}>
                <Package size={16} /> Comprador ▾
              </button>
              <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border shadow-xl rounded-md py-2 w-60 z-50">
                <Link
                  href="/comprador/validar-pedido"
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  Validar pedido
                </Link>
              </div>
            </div>
          )}

          {/* USUARIO */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100"
              >
                <User size={18} />
                {user.email}
              </button>
              {userMenu && (
                <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-md py-2 w-56 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-left"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-[#2d6cdf] text-white rounded-md hover:bg-blue-700"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={toggleMenu}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </nav>
  );
}