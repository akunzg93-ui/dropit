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
  const [socialUrl, setSocialUrl] = useState("");
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

    if (!nombre.trim() || !email.trim() || !password || !confirm) {
      setMensaje("Completa todos los campos obligatorios.");
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

    await supabase.auth.signOut();

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: "vendor",
          nombre_responsable: nombre.trim(),
          social_url: socialUrl.trim() || null,
        },
      },
    });

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    try {
      await fetch("/api/orders/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
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
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-6 shadow-xl space-y-3">
          <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            Modo Emprendedor
          </span>

          <h1 className="text-2xl font-bold">Crea tu cuenta</h1>

          <p className="text-sm text-white/90">
            Comienza a enviar paquetes, gestionar pedidos y hacer crecer tu negocio.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-5">
          <div>
            <label
              htmlFor="vendor-name"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Nombre completo
            </label>

            <Input
              id="vendor-name"
              name="name"
              type="text"
              autoComplete="name"
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
            <label
              htmlFor="vendor-email"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Correo electrónico
            </label>

            <Input
              id="vendor-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {["@gmail.com", "@hotmail.com", "@outlook.com"].map(
                (dominio) => (
                  <button
                    key={dominio}
                    type="button"
                    onClick={() => completarDominioCorreo(dominio)}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition"
                  >
                    {dominio}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="vendor-social-url"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Red social / sitio web{" "}
              <span className="text-slate-400 font-normal">(opcional)</span>
            </label>

            <Input
              id="vendor-social-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              placeholder="https://instagram.com/tu_tienda"
            />

            <p className="text-xs text-slate-500 mt-1">
              Es opcional. Nos ayuda a generar más confianza con establecimientos y compradores.
            </p>
          </div>

          <div>
            <label
              htmlFor="vendor-password"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Contraseña
            </label>

            <Input
              id="vendor-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              className="rounded-xl border-slate-300 focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label
              htmlFor="vendor-confirm-password"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Confirmar contraseña
            </label>

            <Input
              id="vendor-confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
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
              id="vendor-terms"
              name="terms"
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="mt-1"
            />

            <label htmlFor="vendor-terms" className="leading-relaxed">
              Acepto los{" "}
              <Link
                href="/terminos"
                className="text-indigo-600 underline hover:text-indigo-700 transition"
                target="_blank"
              >
                Términos
              </Link>{" "}
              y el{" "}
              <Link
                href="/privacidad"
                className="text-indigo-600 underline hover:text-indigo-700 transition"
                target="_blank"
              >
                Aviso de Privacidad
              </Link>
            </label>
          </div>

          <Button
            disabled={loading}
            onClick={handleRegister}
            className="w-full py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta de emprendedor"}
          </Button>
        </div>

        <p className="text-sm text-center text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <span
            onClick={() => router.push("/vendedor/login")}
            className="text-indigo-600 font-medium cursor-pointer hover:underline"
          >
            Inicia sesión
          </span>
        </p>

        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Al registrarte aceptas nuestros{" "}
          <Link href="/terminos" className="text-indigo-600 hover:underline">
            Términos
          </Link>{" "}
          y el{" "}
          <Link href="/privacidad" className="text-indigo-600 hover:underline">
            Aviso de Privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  );
}