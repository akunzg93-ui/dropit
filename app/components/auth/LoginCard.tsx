"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  Zap,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginCardProps {
  badge: string;
  title: string;
  subtitle: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  footerText: string;
  footerLinkText: string;
  onFooterClick: () => void;
  extraButtons?: React.ReactNode; // ✅ NUEVO
}

export default function LoginCard({
  badge,
  subtitle,
  onSubmit,
  loading = false,
  error,
  footerText,
  footerLinkText,
  onFooterClick,
  extraButtons, // ✅ NUEVO
}: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(email, password);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-slate-50">
      <div className="w-full max-w-xl bg-white border border-slate-200 shadow-xl rounded-3xl p-10 transition-all duration-500 animate-fade-in-up">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/brand/logo-dropit.png"
            alt="Dropit"
            className="w-24 md:w-28 h-auto drop-shadow-sm"
          />
        </div>

        {/* Conversión */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold tracking-wide uppercase text-indigo-600">
            Impulsa tu negocio
          </p>

          <h1 className="text-4xl font-bold text-slate-900 mt-3 leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Tus envíos bajo control
            </span>
          </h1>
        </div>

        {/* Beneficios rápidos */}
        <div className="flex justify-center gap-8 text-xs font-medium mb-8">

          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={15} className="text-indigo-500" />
            <span>Rápido</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>Seguro</span>
          </div>

          <div className="flex items-center gap-2 text-sky-600">
            <Truck size={15} className="text-sky-500" />
            <span>Profesional</span>
          </div>

        </div>

        {/* Badge modo */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            {badge}
          </span>
        </div>

        <p className="text-sm text-muted-foreground text-center mb-8">
          {subtitle}
        </p>

        {/* 👇 BOTONES EXTRA (Google / Microsoft) */}
{extraButtons && (
  <div className="mb-6 space-y-3">
    {extraButtons}
    <div className="flex items-center gap-3">
      <div className="h-px bg-slate-200 flex-1"></div>
      <span className="text-xs text-slate-400">o</span>
      <div className="h-px bg-slate-200 flex-1"></div>
    </div>
  </div>
)}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email */}
          <div className="relative group">
            <Mail
              className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition"
              size={18}
            />
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock
              className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition"
              size={18}
            />
            <Input
              type={show ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 pr-11 h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-primary transition"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Botón */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="mr-2" size={18} />
                Iniciar sesión
              </>
            )}
          </Button>
        </form>

        {error && (
          <p className="mt-5 text-sm text-destructive text-center animate-in fade-in">
            {error}
          </p>
        )}

        <p className="text-sm text-center mt-8 text-slate-600">
          {footerText}{" "}
          <span
            onClick={onFooterClick}
            className="text-primary font-medium cursor-pointer hover:underline"
          >
            {footerLinkText}
          </span>
        </p>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Al continuar aceptas nuestros Términos y Política de privacidad.
        </p>

      </div>
    </main>
  );
}