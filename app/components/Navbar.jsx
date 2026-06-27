"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  Menu,
  X,
  Package,
  User,
  LogOut,
  FileText,
  Home,
  PlusCircle,
  ClipboardList,
  Coins,
  Wallet,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import RoleSwitcher from "@/app/components/RoleSwitcher";
import MobileBottomNav from "@/app/components/mobile/MobileBottomNav";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef(null);

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

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user || null;

      setUser(u);

      if (!u) {
        setRole(null);
        return;
      }

      setTimeout(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .maybeSingle();

        if (profile?.role) {
          setRole(profile.role);
        }
      }, 0);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

useEffect(() => {
  function handleClickOutside(event) {
    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(event.target)
    ) {
      setUserMenu(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setRole(null);

    window.location.href = "/login";
  };

  const active = (path) =>
    pathname.startsWith(path)
      ? "bg-blue-50 text-[#2563eb] font-semibold"
      : "text-slate-700 hover:bg-blue-50 hover:text-[#2563eb]";

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

  const handleLoginClick = () => {
    if (pathname.includes("/login")) {
      document.getElementById("login-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    window.location.href = "/login";
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <button onClick={goHome} className="flex items-center shrink-0">
            <img
              src="/brand/logo-dropit.png"
              alt="DROPIT"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </button>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-2 text-sm font-medium">
            {/* ADMIN */}
            {role === "admin" && (
              <>
                <NavItem
                  href="/admin"
                  icon={<Home size={16} />}
                  label="Dashboard"
                  className={active("/admin")}
                />

                <NavItem
                  href="/admin/usuarios"
                  icon={<Users size={16} />}
                  label="Usuarios"
                  className={active("/admin/usuarios")}
                />

                <NavItem
                  href="/admin/retiros"
                  icon={<Wallet size={16} />}
                  label="Retiros"
                  className={active("/admin/retiros")}
                />
              </>
            )}

            {/* ESTABLECIMIENTO */}
            {role === "establishment" && (
              <>
                <NavItem
                  href="/establecimiento/estado"
                  icon={<Home size={16} />}
                  label="Panel"
                  className={active("/establecimiento/estado")}
                />

                <NavItem
                  href="/establecimiento/recibir-pedido"
                  icon={<Package size={16} />}
                  label="Recibir"
                  className={active("/establecimiento/recibir-pedido")}
                />

                <NavItem
                  href="/establecimiento/entregar"
                  icon={<Package size={16} />}
                  label="Entregar"
                  className={active("/establecimiento/entregar")}
                />

                <NavItem
                  href="/establecimiento"
                  icon={<PlusCircle size={16} />}
                  label="Registrar"
                  className={active("/establecimiento")}
                />

                <NavItem
                  href="/establecimiento/balance"
                  icon={<Wallet size={16} />}
                  label="Balance"
                  className={active("/establecimiento/balance")}
                />
              </>
            )}

            {/* VENDEDOR */}
            {role === "vendor" && (
              <>
                <NavItem
                  href="/vendedor/dashboard"
                  icon={<Home size={16} />}
                  label="Dashboard"
                  className={active("/vendedor/dashboard")}
                />

                <NavItem
                  href="/vendedor/crear-pedido"
                  icon={<PlusCircle size={16} />}
                  label="Crear pedido"
                  className={active("/vendedor/crear-pedido")}
                />

                <NavItem
                  href="/vendedor/pedidos"
                  icon={<ClipboardList size={16} />}
                  label="Pedidos"
                  className={active("/vendedor/pedidos")}
                />

                <NavItem
                  href="/vendedor/coins"
                  icon={<Coins size={16} />}
                  label="Coins"
                  className={active("/vendedor/coins")}
                />
              </>
            )}

            {/* BUYER */}
            {role === "buyer" && (
              <NavItem
                href="/comprador"
                icon={<Home size={16} />}
                label="Inicio"
                className={active("/comprador")}
              />
            )}

            {/* RASTREAR */}
            {!user && (
              <NavItem
                href="/comprador/validar-pedido"
                icon={<Package size={16} />}
                label="Rastrear pedido"
                className={active("/comprador/validar-pedido")}
              />
            )}

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* TERMINOS */}
            <NavItem
              href="/terminos"
              icon={<FileText size={16} />}
              label="Términos"
              className={active("/terminos")}
            />

            {/* ROLE SWITCHER */}
            {user && (
              <div className="rounded-xl px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#2563eb] transition">
                <RoleSwitcher />
              </div>
            )}

            {/* USER */}
            {user ? (
  <div
    className="relative"
    ref={userMenuRef}
  >
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-blue-50 hover:text-[#2563eb] transition text-slate-700"
                >
                  <User size={18} />
                  <span>Cuenta</span>
                </button>

                {userMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border bg-white shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                        Mi cuenta
                      </p>
                      <p className="text-sm text-slate-700 mt-1 truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-white hover:bg-[#1e40af] transition"
              >
                Iniciar sesión
              </button>
            )}
          </div>

          {/* MOBILE */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex items-center justify-center h-11 w-11 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pb-6 pt-4 space-y-3 shadow-xl">
            {!user && (
              <Link
                href="/comprador/validar-pedido"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-4 bg-slate-50"
              >
                <Package size={18} />
                Rastrear pedido
              </Link>
            )}

            <Link
              href="/terminos"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 bg-slate-50"
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
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 w-full bg-red-50 text-red-600"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);

                  if (pathname.includes("/login")) {
                    document.getElementById("login-form")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });

                    return;
                  }

                  window.location.href = "/login";
                }}
                className="flex items-center justify-center rounded-2xl bg-[#2563eb] px-4 py-4 text-white font-medium"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        )}
      </nav>

      <MobileBottomNav role={role} />
    </>
  );
}

function NavItem({ href, icon, label, className }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 transition ${className}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}