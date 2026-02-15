"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, LogIn } from "lucide-react";

export default function LoginEstablecimiento() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    if (!email || !password) {
      setMensaje("Escribe tu correo y contraseña.");
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      setMensaje("No se pudo iniciar sesión: " + error.message);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (perfilError || !perfil) {
      setMensaje("No se pudo obtener el rol del usuario.");
      return;
    }

    if (perfil.role !== "establishment") {
      setMensaje("Esta cuenta no pertenece a un establecimiento.");
      return;
    }

    router.push("/establecimiento");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted/30">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        {/* Badge */}
        <div className="mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Modo Establecimiento
          </span>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Acceso Establecimiento
        </h1>

        {/* Subtítulo */}
        <p className="text-sm text-gray-600 mb-6">
          Inicia sesión para recibir y gestionar pedidos.
        </p>

        <form onSubmit={manejarLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 
                       focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 
                       focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={cargando}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-blue-600 text-white font-semibold rounded-lg 
                       hover:bg-blue-700 transition disabled:opacity-60"
          >
            {cargando ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        {mensaje && (
          <p className="mt-4 text-sm text-red-500 text-center">
            {mensaje}
          </p>
        )}

        <p className="text-sm text-center mt-6">
          ¿No tienes cuenta?{" "}
          <span
            className="text-blue-600 font-medium cursor-pointer hover:underline"
            onClick={() => router.push("/establecimiento/register")}
          >
            Registrar establecimiento
          </span>
        </p>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Al continuar aceptas nuestros Términos y Política de privacidad.
        </p>

      </div>
    </main>
  );
}
