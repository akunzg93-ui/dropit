"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RegisterVendedor() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [socialUrl, setSocialUrl] = useState(""); // ✅ NUEVO
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  async function handleRegister() {
    setMensaje("");

    if (!nombre || !email || !password || !confirm) {
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

    // evitar sesión previa
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "vendor",
          nombre_responsable: nombre,
          social_url: socialUrl, // ✅ NUEVO
        },
      },
    });

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    // enviar correo de verificación con tu API
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

    router.push("/verificar");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* HEADER PREMIUM */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-6 shadow-xl space-y-3">
          <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            Modo Emprendedor
          </span>

          <h1 className="text-2xl font-bold">
            Crea tu cuenta
          </h1>

          <p className="text-sm text-white/90">
            Comienza a enviar paquetes, gestionar pedidos y hacer crecer tu negocio.
          </p>
        </div>

        {/* CARD FORM */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Nombre completo
            </label>
            <Input
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. María López"
            />
            <p className="text-xs text-slate-500 mt-1">
              Este será el titular de la cuenta.
            </p>
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

          {/* ✅ NUEVO CAMPO */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Red social / sitio web
            </label>
            <Input
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              placeholder="https://instagram/facebook.com/tu_tienda"
            />
            <p className="text-xs text-slate-500 mt-1">
              Esto ayudará a los establecimientos a confiar en ti.
            </p>
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

          {/* ACEPTACIÓN DE TÉRMINOS */}
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
            {loading ? "Creando cuenta..." : "Crear cuenta de emprendedor"}
          </Button>
        </div>

        {/* LOGIN LINK */}
        <p className="text-sm text-center text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <span
            onClick={() => router.push("/vendedor/login")}
            className="text-indigo-600 font-medium cursor-pointer hover:underline"
          >
            Inicia sesión
          </span>
        </p>

        {/* LEGAL */}
        <p className="text-xs text-slate-500 text-center">
          Al registrarte aceptas nuestros Términos y Política de privacidad.
        </p>

      </div>
    </div>
  );
}