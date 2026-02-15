"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarLogin(e) {
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

    // Obtener el rol del usuario desde la tabla profiles
    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (perfilError) {
      setMensaje("No se pudo obtener el rol del usuario.");
      return;
    }

    setMensaje("Sesión iniciada correctamente ✅");

    // Redirección por rol
    setTimeout(() => {
      switch (perfil.role) {
        case "comprador":
          router.push("/comprador");
          break;
        case "vendedor":
          router.push("/vendedor");
          break;
        case "establecimiento":
          router.push("/establecimiento");
          break;
        case "admin":
          router.push("/admin");
          break;
        default:
          router.push("/");
      }
    }, 800);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-down">

        {/* TÍTULO */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Iniciar sesión
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Usa tu correo y contraseña.
        </p>

        {/* FORMULARIO */}
        <form onSubmit={manejarLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Correo"
            value={email}
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 
                       dark:border-gray-600 text-gray-900 dark:text-white 
                       focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 
                       dark:border-gray-600 text-gray-900 dark:text-white 
                       focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Forgot password link */}
          <p
            className="text-sm text-blue-600 dark:text-blue-300 cursor-pointer hover:underline text-right"
            onClick={() => router.push("/reset-password")}
          >
            ¿Olvidaste tu contraseña?
          </p>

          <button
            type="submit"
            disabled={cargando}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-[#2d6cdf] text-white font-semibold rounded-lg 
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

        {/* MENSAJE */}
        {mensaje && (
          <p className="mt-4 px-4 py-3 bg-blue-50 dark:bg-blue-900 border 
                        dark:border-blue-700 text-blue-700 dark:text-blue-200 
                        rounded-lg text-sm">
            {mensaje}
          </p>
        )}

        {/* Crear cuenta */}
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          ¿No tienes cuenta?{" "}
          <span
            className="text-blue-600 dark:text-blue-300 cursor-pointer hover:underline"
            onClick={() => router.push("/")}
          >
            Crear una cuenta
          </span>
        </p>

      </div>
    </main>
  );
}
