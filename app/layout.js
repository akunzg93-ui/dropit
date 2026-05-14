"use client";

import "./globals.css";
import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("./components/Navbar"), {
  ssr: false,
});

import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-[100dvh]
          overflow-x-hidden
          bg-gradient-to-br
          from-blue-50/70
          via-white
          to-sky-100/60
          text-slate-900
          antialiased
        `}
      >
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
      </body>
    </html>
  );
}