"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  Menu,
  X,
  Package,
  User,
  LogOut,
  FileText,
  ChevronDown,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import RoleSwitcher from "@/app/components/RoleSwitcher";
import MobileBottomNav from "@/app/components/mobile/MobileBottomNav";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userMenu, setUserMenu] = useState(false);

  const pathname = usePathname();

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

        if (profile?.role) {
          setRole(profile.role);
        }
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

          if (profile?.role) {
            setRole(profile.role);
          }
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
      : "text-slate-700";

  const goHome = () => {
    if (!user) {
      window.location.href = "/";
      return;
    }

    if (role === "admin") {
      window.location.href = "/admin";
      return;
    }

    if (role === "establishment") {
      window.location.href = "/establecimiento/estado";
      return;
    }

    if (role === "vendor") {
      window.location.href = "/vendedor/dashboard";
      return;
    }

    if (role === "buyer") {
      window.location.href = "/comprador";
      return;
    }

    window.location.href = "/";
  };

  return (
    <>
      <nav
        className="
          fixed
          top-0
          left-0
          w-full
          z-50
          border-b
          border-slate-200/80
          bg-white/90
          backdrop-blur-xl
          shadow-sm
          safe-top
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            h-20
            flex
            items-center
            justify-between
          "
        >
          {/* LOGO */}
          <button
            onClick={goHome}
            className="flex items-center shrink-0"
          >
            <img
              src="/brand/logo-dropit.png"
              alt="DROPIT"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </button>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">

            {/* PUBLICO */}
            <Link
              href="/comprador/validar-pedido"
              className={`flex items-center gap-2 transition hover:text-[#2d6cdf] ${active(
                "/comprador/validar-pedido"
              )}`}
            >
              <Package size={16} />
              Rastrear pedido
            </Link>

            {user && <RoleSwitcher />}

            {/* ADMIN */}
            {role === "admin" && (
              <div className="relative group">
                <button
                  className={`
                    flex items-center gap-1 transition
                    hover:text-[#2d6cdf]
                    ${active("/admin")}
                  `}
                >
                  Admin
                  <ChevronDown size={14} />
                </button>

                <div
                  className="
                    absolute
                    top-full
                    left-0
                    mt-3
                    flex
                    flex-col
                    w-60
                    rounded-2xl
                    border
                    bg-white
                    shadow-2xl
                    overflow-hidden
                    z-50
                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    transition-all
                    duration-200
                  "
                >
                  <Link
                    href="/admin"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/admin/usuarios"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Usuarios
                  </Link>

                  <Link
                    href="/admin/retiros"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Retiros
                  </Link>
                </div>
              </div>
            )}

            {/* ESTABLECIMIENTO */}
            {role === "establishment" && (
              <div className="relative group">
                <button
                  className={`
                    flex items-center gap-1 transition
                    hover:text-[#2d6cdf]
                    ${active("/establecimiento")}
                  `}
                >
                  Establecimiento
                  <ChevronDown size={14} />
                </button>

                <div
                  className="
                    absolute
                    top-full
                    left-0
                    mt-3
                    flex
                    flex-col
                    w-64
                    rounded-2xl
                    border
                    bg-white
                    shadow-2xl
                    overflow-hidden
                    z-50
                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    transition-all
                    duration-200
                  "
                >
                  <Link
                    href="/establecimiento/estado"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Panel operativo
                  </Link>

                  <Link
                    href="/establecimiento/recibir-pedido"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Recibir pedido
                  </Link>

                  <Link
                    href="/establecimiento/entregar"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Entregar pedido
                  </Link>
<Link
  href="/establecimiento"
  className="px-4 py-3 hover:bg-slate-50"
>
  Registrar establecimiento
</Link>
                  <Link
                    href="/establecimiento/balance"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Balance
                  </Link>
                </div>
              </div>
            )}

            {/* VENDEDOR */}
            {role === "vendor" && (
              <div className="relative group">
                <button
                  className={`
                    flex items-center gap-1 transition
                    hover:text-[#2d6cdf]
                    ${active("/vendedor")}
                  `}
                >
                  Vendedor
                  <ChevronDown size={14} />
                </button>

                <div
                  className="
                    absolute
                    top-full
                    left-0
                    mt-3
                    flex
                    flex-col
                    w-64
                    rounded-2xl
                    border
                    bg-white
                    shadow-2xl
                    overflow-hidden
                    z-50
                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    transition-all
                    duration-200
                  "
                >
                  <Link
                    href="/vendedor/dashboard"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/vendedor/pedidos"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Pedidos
                  </Link>

                  <Link
                    href="/vendedor/crear-pedido"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Crear pedido
                  </Link>

                  <Link
                    href="/vendedor/coins"
                    className="px-4 py-3 hover:bg-slate-50"
                  >
                    Coins
                  </Link>
                </div>
              </div>
            )}

        {/* TERMINOS */}
<Link
  href="/terminos"
  className={`flex items-center gap-2 transition hover:text-[#2d6cdf] ${active(
    "/terminos"
  )}`}
>
  <FileText size={16} />
  Términos
</Link>

            {/* USER */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    px-3
                    py-2
                    hover:bg-slate-100
                    transition
                  "
                >
                  <User size={18} />

                  <span className="max-w-[180px] truncate">
                    {user.email}
                  </span>
                </button>

                {userMenu && (
                  <div
                    className="
                      absolute
                      right-0
                      mt-2
                      w-56
                      rounded-2xl
                      border
                      bg-white
                      shadow-xl
                      overflow-hidden
                    "
                  >
                    <button
                      onClick={handleLogout}
                      className="
                        flex
                        items-center
                        gap-2
                        w-full
                        px-4
                        py-3
                        text-left
                        hover:bg-slate-50
                      "
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
                className="
                  rounded-xl
                  bg-[#2d6cdf]
                  px-5
                  py-2.5
                  text-white
                  hover:bg-blue-700
                  transition
                "
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* MOBILE */}
          <button
            onClick={() => setOpen(!open)}
            className="
              md:hidden
              flex
              items-center
              justify-center
              h-11
              w-11
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-sm
            "
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div
            className="
              md:hidden
              border-t
              border-slate-200
              bg-white/95
              backdrop-blur-xl
              px-4
              pb-6
              pt-4
              space-y-3
              shadow-xl
            "
          >
            <Link
              href="/comprador/validar-pedido"
              onClick={() => setOpen(false)}
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                px-4
                py-4
                bg-slate-50
              "
            >
              <Package size={18} />
              Rastrear pedido
            </Link>

            <Link
              href="/terminos"
              onClick={() => setOpen(false)}
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                px-4
                py-4
                bg-slate-50
              "
            >
              <FileText size={18} />
              Términos y condiciones
            </Link>

            {user ? (
              <>
                <div className="px-2 pt-2 text-sm text-slate-500">
                  {user.email}
                </div>

                <button
                  onClick={handleLogout}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    px-4
                    py-4
                    w-full
                    bg-red-50
                    text-red-600
                  "
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="
                  flex
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#2d6cdf]
                  px-4
                  py-4
                  text-white
                  font-medium
                "
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        )}
      </nav>

      <MobileBottomNav role={role} />
    </>
  );
}