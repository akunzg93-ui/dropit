"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!email) {
      setMensaje("Escribe tu correo.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setCargando(false);

    if (error) {
      console.error(error);
      setMensaje("No se pudo enviar el correo: " + error.message);
      return;
    }

    setMensaje("Te enviamos un correo para restablecer tu contraseña.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Recuperar contraseña
        </h1>

        <form className="space-y-4" onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Tu correo"
            className="w-full px-4 py-2 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-60"
          >
            {cargando ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        {mensaje && (
          <p className="mt-4 text-center text-sm text-gray-700">{mensaje}</p>
        )}
      </div>
    </main>
  );
}
