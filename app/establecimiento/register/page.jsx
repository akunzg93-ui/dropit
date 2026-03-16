"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterEstablecimiento() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

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
      setMensaje("Debes aceptar los Términos y Condiciones.");
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

    // 🔴 Cerrar sesión para evitar login automático
    await supabase.auth.signOut();

    // 📧 Enviar correo de verificación con Resend
    try {
      await fetch("/api/orders/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Error enviando correo:", err);
    }

    setLoading(false);

    // 👉 enviar a pantalla de verificación
    router.push("/verificar");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-6 shadow-xl space-y-3">
          <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            Modo Establecimiento
          </span>

          <h1 className="text-2xl font-bold">
            Crea tu cuenta
          </h1>

          <p className="text-sm text-white/90">
            Recibe paquetes de emprendedores y genera ingresos adicionales desde tu punto físico.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Nombre del responsable
            </label>
            <Input
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Adolfo Kunz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Correo electrónico
            </label>
            <Input
              type="email"
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Contraseña
            </label>
            <Input
              type="password"
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Confirmar contraseña
            </label>
            <Input
              type="password"
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {mensaje && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              {mensaje}
            </div>
          )}

          <div className="flex items-start gap-2 text-sm text-slate-600 mt-2">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="mt-1"
            />

            <span>
              Acepto los{" "}
              <Link
                href="/terminos"
                className="text-indigo-600 underline"
                target="_blank"
              >
                Términos y Condiciones
              </Link>
            </span>
          </div>

          <Button
            disabled={loading}
            onClick={handleRegister}
            className="w-full py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta de establecimiento"}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500">
          Al registrarte aceptas nuestros términos y condiciones.
        </p>
      </div>
    </div>
  );
}