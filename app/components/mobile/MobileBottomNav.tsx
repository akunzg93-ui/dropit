"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  Package,
  PlusCircle,
  Coins,
  User,
  QrCode,
  Wallet,
  Shield,
} from "lucide-react";

export default function MobileBottomNav({ role }) {
  const pathname = usePathname();

  const activeClass = (path: string) => {
    return pathname.startsWith(path)
      ? "text-[#2d6cdf]"
      : "text-slate-500";
  };

  let items = [];

  // VENDOR
  if (role === "vendor") {
    items = [
      {
        href: "/vendedor/dashboard",
        label: "Inicio",
        icon: Home,
      },
      {
        href: "/vendedor/pedidos",
        label: "Pedidos",
        icon: Package,
      },
      {
        href: "/vendedor/crear-pedido",
        label: "Crear",
        icon: PlusCircle,
      },
      {
        href: "/vendedor/coins",
        label: "Coins",
        icon: Coins,
      },
    ];
  }

  // ESTABLECIMIENTO
  else if (role === "establishment") {
    items = [
      {
        href: "/establecimiento/estado",
        label: "Inicio",
        icon: Home,
      },
      {
        href: "/establecimiento/recibir-pedido",
        label: "Recibir",
        icon: QrCode,
      },
      {
        href: "/establecimiento/entregar",
        label: "Entregar",
        icon: Package,
      },
      {
        href: "/establecimiento/balance",
        label: "Balance",
        icon: Wallet,
      },
    ];
  }

  // ADMIN
  else if (role === "admin") {
    items = [
      {
        href: "/admin",
        label: "Admin",
        icon: Shield,
      },
      {
        href: "/admin/retiros",
        label: "Retiros",
        icon: Wallet,
      },
      {
        href: "/admin/usuarios",
        label: "Usuarios",
        icon: User,
      },
    ];
  }

  // PUBLIC
else {
  return null;
}

  return (
    <div
      className="
        md:hidden
        fixed
        bottom-0
        left-0
        w-full
        z-50
        px-3
        pb-[max(env(safe-area-inset-bottom),12px)]
      "
    >
      <div
        className="
          mx-auto
          max-w-sm
          rounded-[24px]
          border
          border-white/50
          bg-white/92
          backdrop-blur-2xl
          shadow-2xl
          px-1
          py-1.5
        "
      >
        <div
          className={`
            grid
            gap-1
            ${items.length === 4 ? "grid-cols-4" : ""}
            ${items.length === 3 ? "grid-cols-3" : ""}
            ${items.length === 1 ? "grid-cols-1" : ""}
          `}
        >
          {items.map((item) => {
            const Icon = item.icon;

            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  rounded-2xl
                  py-2
                  min-h-[64px]
                  transition-all
                  duration-200
                  ${activeClass(item.href)}
                  ${
                    isActive
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }
                `}
              >
                <Icon
                  size={20}
                  strokeWidth={2.2}
                />

                <span
                  className="
                    text-[10px]
                    leading-none
                    font-medium
                  "
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}