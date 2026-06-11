"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Escribe y confirma tu nueva contraseña.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

const {
  data: { session },
} = await supabase.auth.getSession();

console.log("SESSION:", session);

    try {
      const updatePromise = supabase.auth.updateUser({ password });

      const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
  setTimeout(() => resolve({ timeout: true }), 8000)
);

const result = (await Promise.race([
  updatePromise,
  timeoutPromise,
])) as any;

if (result.timeout) {
  setMensaje("Contraseña actualizada correctamente.");

 setTimeout(async () => {
  try {
    await supabase.auth.signOut();
  } catch {}

  router.push("/login");
}, 1200);
  return;
}

      if (result.error) {
        console.error("Error actualizando contraseña:", result.error);

        const msg = result.error.message?.toLowerCase() || "";

        if (
          msg.includes("same") ||
          msg.includes("different") ||
          msg.includes("new password")
        ) {
          setError("La nueva contraseña no puede ser igual a la anterior.");
          return;
        }

        setError("No se pudo actualizar la contraseña. Intenta con una contraseña diferente.");
        return;
      }

      setMensaje("Contraseña actualizada correctamente.");

      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      console.error("Error inesperado:", err);

      setError("Ocurrió un error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl p-8">
        <div className="flex justify-center mb-6">
          <img
            src="/brand/logo-dropit.png"
            alt="Dropit"
            className="w-24 h-auto drop-shadow-sm"
          />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide mb-4">
            <ShieldCheck size={14} />
            Seguridad Dropit
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Crear nueva contraseña
          </h1>

          <p className="text-sm text-slate-500 mt-3">
            Escribe una nueva contraseña para recuperar el acceso a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="relative group">
            <Lock
              className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition"
              size={18}
            />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="pl-11 pr-11 h-11 rounded-xl bg-white border-slate-200"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative group">
            <Lock
              className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition"
              size={18}
            />

            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="pl-11 pr-11 h-11 rounded-xl bg-white border-slate-200"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 text-center">
              {mensaje}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Guardando...
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/login")}
          disabled={loading}
          className="w-full mt-6 text-sm text-slate-500 hover:text-indigo-600 hover:underline transition disabled:opacity-50"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </main>
  );
}