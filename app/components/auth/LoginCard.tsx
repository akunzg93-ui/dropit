"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
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
  extraButtons?: React.ReactNode;
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
  extraButtons,
}: LoginCardProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const isEstablishment = badge?.toLowerCase().includes("establecimiento");
  const isEntrepreneur =
    badge?.toLowerCase().includes("emprendedor") ||
    badge?.toLowerCase().includes("vendedor");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(email, password);
  }

  function goToEstablishmentLogin() {
    if (!isEstablishment) {
      router.push("/login/establecimiento");
    }
  }

  function goToEntrepreneurLogin() {
    if (!isEntrepreneur) {
      router.push("/login");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <div
        id="login-form"
        className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl grid lg:grid-cols-[1fr_1fr]"
      >
        <section className="relative hidden lg:flex min-h-[720px] flex-col justify-between bg-gradient-to-br from-[#2563eb] to-[#1e40af] p-12 text-white overflow-hidden">
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/10" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2">
                <img
                  src="/brand/logo-dropit.png"
                  alt="Dropit"
                  className="h-full w-full object-contain"
                />
              </div>

              <p className="text-xl font-bold tracking-[0.18em]">DROPIT</p>
            </div>

            <div className="mt-40">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Logística sin drama
              </span>

              <h1 className="mt-8 text-5xl font-bold leading-tight">
                La entrega
                <br />
                más <span className="text-[#93c5fd]">fácil</span>
                <br />
                de tu vida.
              </h1>

              <p className="mt-8 max-w-md text-lg font-medium leading-relaxed text-white/70">
                Tus clientes recogen cuando quieran en la tiendita de la
                esquina.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4">
            <Benefit icon={<Zap size={16} />} label="Rápido" />
            <Benefit icon={<ShieldCheck size={16} />} label="Seguro" />
            <Benefit icon={<Sparkles size={16} />} label="Fácil" />
          </div>
        </section>

        <section className="bg-[#f1f5ff] p-7 md:p-12 flex flex-col justify-center">
          <div className="mb-8 lg:hidden">
            <img
              src="/brand/logo-dropit.png"
              alt="Dropit"
              className="w-24 h-auto"
            />
          </div>

          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-1.5 text-sm font-semibold text-[#1e3a8a] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Bienvenido de vuelta
            </span>

            <h2 className="mt-8 text-4xl font-bold leading-tight text-[#1e3a8a]">
              Entra a Dropit
            </h2>

            <p className="mt-3 text-lg font-medium text-slate-600">
              La logística sin drama empieza aquí.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-xl bg-blue-100 p-1">
            <button
              type="button"
              onClick={goToEstablishmentLogin}
              className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
                isEstablishment
                  ? "bg-white text-[#1e3a8a] shadow-sm"
                  : "text-[#2563eb] hover:bg-white/50"
              }`}
            >
              Establecimiento
            </button>

            <button
              type="button"
              onClick={goToEntrepreneurLogin}
              className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
                isEntrepreneur
                  ? "bg-white text-[#1e3a8a] shadow-sm"
                  : "text-[#2563eb] hover:bg-white/50"
              }`}
            >
              Emprendedor
            </button>
          </div>

          {extraButtons && (
            <div className="mb-6 space-y-3">
              {extraButtons}

              <div className="flex items-center gap-3">
                <div className="h-px bg-blue-100 flex-1"></div>
                <span className="text-sm font-semibold text-slate-500">
                  o con tu correo
                </span>
                <div className="h-px bg-blue-100 flex-1"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail
                className="absolute left-4 top-3.5 text-blue-200 group-focus-within:text-[#60a5fa] transition"
                size={18}
              />

              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-transparent bg-[#232323] pl-11 text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0"
              />
            </div>

            <div className="relative group">
              <Lock
                className="absolute left-4 top-3.5 text-blue-200 group-focus-within:text-[#60a5fa] transition"
                size={18}
              />

              <Input
                type={show ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-transparent bg-[#232323] pl-11 pr-11 text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0"
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-4 top-3.5 text-blue-200 hover:text-[#60a5fa] transition"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-sm font-semibold text-[#2563eb] hover:text-[#1e40af] hover:underline transition"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-bold hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-60"
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
                  <ArrowRight className="ml-2" size={18} />
                </>
              )}
            </Button>
          </form>

          {error && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <p className="text-sm text-center mt-7 text-slate-600">
            {footerText}{" "}
            <span
              onClick={onFooterClick}
              className="text-[#2563eb] font-bold cursor-pointer hover:underline"
            >
              {footerLinkText}
            </span>
          </p>

          <p className="text-xs text-slate-500 mt-5 text-center leading-relaxed">
            Al continuar aceptas nuestros{" "}
            <a
              href="/terminos"
              className="text-[#2563eb] hover:text-[#1e40af] hover:underline font-medium transition"
            >
              Términos
            </a>{" "}
            y{" "}
            <a
              href="/privacidad"
              className="text-[#2563eb] hover:text-[#1e40af] hover:underline font-medium transition"
            >
              Aviso de Privacidad
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white/80">
      {icon}
      {label}
    </div>
  );
}