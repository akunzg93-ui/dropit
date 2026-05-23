"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import PWAInstallPrompt from "./PWAInstallPrompt";

const Navbar = dynamic(() => import("./Navbar"), {
  ssr: false,
});

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  return (
    <>
      <Navbar />

      <main
        className="
          w-full
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          pt-24
          pb-10
        "
      >
        {children}
      </main>

      {(pathname === "/login" ||
        pathname === "/comprador/validar-pedido") && (
        <PWAInstallPrompt />
      )}
    </>
  );
}