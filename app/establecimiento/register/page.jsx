"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Lock,
  UserRound,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function RegisterEstablecimiento() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  function completarDominioCorreo(dominio) {
    const correoLimpio = email.trim();

    if (!correoLimpio) {
      setEmail(dominio.replace("@", ""));
      return;
    }

    const usuario = correoLimpio.includes("@")
      ? correoLimpio.split("@")[0]
      : correoLimpio;

    setEmail(`${usuario}${dominio}`);
  }

  async function handleRegister() {
    setMensaje("");

    if (!email || !password || !confirm || !nombre) {
      setMensaje("Completa todos los campos.");
      return;
    }

    if (password !== confirm) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    if (!aceptaTerminos) {
      setMensaje("Debes aceptar los Términos y el Aviso de Privacidad.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "establishment",
          nombre_responsable: nombre,
        },
      },
    });

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    if (error) {
      console.error(error);
      setMensaje("Hubo un error al registrarte: " + error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    try {
      await fetch("/api/orders/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Error enviando correo:", err);
    }

    setLoading(false);
    router.push("/verificar");
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-6 lg:px-6 lg:py-12 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 text-center lg:mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <img
              src="/brand/logo-dropit.png"
              alt="Dropit"
              className="h-12 w-12 object-contain"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
            Registro Dropit
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#1e3a8a]">
            Crea tu cuenta
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Recibe paquetes de emprendedores y genera ingresos adicionales desde
            tu punto físico.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
            <ShieldCheck size={16} className="text-[#2563eb]" />
            Modo establecimiento
          </div>

          <div className="grid gap-4">
            <Field icon={<UserRound size={18} />} label="Nombre del responsable">
              <Input
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Adolfo Kunz"
              />
            </Field>

            <Field icon={<Mail size={18} />} label="Correo electrónico">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {["@Gmail.com", "@hotmail.com", "@outlook.com"].map(
                  (dominio) => (
                    <button
                      key={dominio}
                      type="button"
                      onClick={() => completarDominioCorreo(dominio)}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2563eb] transition hover:bg-blue-100"
                    >
                      {dominio}
                    </button>
                  )
                )}
              </div>
            </Field>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field icon={<Lock size={18} />} label="Contraseña">
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </Field>

              <Field icon={<Lock size={18} />} label="Confirmar contraseña">
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite tu contraseña"
                />
              </Field>
            </div>

            {mensaje && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {mensaje}
              </div>
            )}

            <div className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-1"
              />

              <span className="leading-relaxed">
                Acepto los{" "}
                <Link
                  href="/terminos"
                  className="font-semibold text-[#2563eb] hover:underline"
                  target="_blank"
                >
                  Términos
                </Link>{" "}
                y el{" "}
                <Link
                  href="/privacidad"
                  className="font-semibold text-[#2563eb] hover:underline"
                  target="_blank"
                >
                  Aviso de Privacidad
                </Link>
              </span>
            </div>

            <Button
              disabled={loading}
              onClick={handleRegister}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-base font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight className="ml-2" size={18} />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-600">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-bold text-[#2563eb] hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-[#2563eb]" />
          Registro seguro y protegido por Dropit
        </div>
      </div>
    </main>
  );
}

function Field({ icon, label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative group">
        <div className="absolute left-4 top-3.5 text-slate-400 transition group-focus-within:text-[#2563eb]">
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}