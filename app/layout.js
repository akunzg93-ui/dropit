"use client";

import "./globals.css";
import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("./components/Navbar"), {
  ssr: false
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
    <html lang="es">
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          min-h-screen 
          bg-gradient-to-br 
          from-blue-50/70 
          via-white 
          to-sky-100/60
        `}
      >
        <Navbar />

        <main className="pt-20 px-4 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
