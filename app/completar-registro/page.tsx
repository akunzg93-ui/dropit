"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

function CompletarRegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole = searchParams.get("role");

  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const roleValido =
    requestedRole === "vendor" ||
    requestedRole === "establishment";

  useEffect(() => {
    async function validarUsuario() {
      /*
       * Esta pantalla sólo puede utilizarse desde los
       * flujos OAuth públicos conocidos.
       */
      if (!roleValido) {
        router.replace("/login");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      /*
       * Si el usuario ya tiene un rol, no debe poder
       * utilizar esta pantalla para modificarlo.
       */
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Error revisando perfil:",
          error
        );

        setMensaje(
          "No pudimos verificar tu cuenta. Intenta nuevamente."
        );

        setChecking(false);
        return;
      }

      if (profile?.role) {
        router.replace("/post-login");
        return;
      }

      setChecking(false);
    }

    validarUsuario();
  }, [roleValido, router]);

  async function completarRegistro() {
    setMensaje("");

    if (!roleValido) {
      setMensaje("El tipo de cuenta no es válido.");
      return;
    }

    if (!aceptaTerminos) {
      setMensaje(
        "Debes aceptar los Términos y el Aviso de Privacidad."
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc(
      "completar_registro_oauth",
      {
        p_role: requestedRole,
        p_terminos_version: "2026-09",
        p_privacidad_version: "2026-09",
      }
    );

    if (error) {
      console.error(
        "Error completando registro OAuth:",
        error
      );

      setMensaje(
        "No pudimos completar tu registro. Intenta nuevamente."
      );

      setLoading(false);
      return;
    }

    /*
     * El rol y la aceptación legal ya quedaron
     * registrados de forma atómica en Supabase.
     */
    router.replace("/post-login");
  }

  if (checking) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={20}
            className="animate-spin text-[#2563eb]"
          />
          Verificando tu cuenta...
        </div>
      </main>
    );
  }

  const esEstablecimiento =
    requestedRole === "establishment";

  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/brand/logo-dropit.png"
                alt="Dropit"
                className="h-12 w-12 object-contain"
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              Último paso
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1e3a8a]">
              Completa tu registro
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Estás creando una cuenta como{" "}
              <span className="font-semibold text-slate-800">
                {esEstablecimiento
                  ? "establecimiento"
                  : "emprendedor"}
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#2563eb]"
              />

              <div>
                <p className="font-semibold text-slate-800">
                  Revisa y acepta para continuar
                </p>

                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Necesitamos tu aceptación antes de terminar
                  la configuración de tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3">
            <input
              id="oauth-terms"
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) =>
                setAceptaTerminos(e.target.checked)
              }
              className="mt-1"
            />

            <label
              htmlFor="oauth-terms"
              className="text-sm leading-relaxed text-slate-600"
            >
              Acepto los{" "}
              <Link
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#2563eb] hover:underline"
              >
                Términos
              </Link>{" "}
              y el{" "}
              <Link
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#2563eb] hover:underline"
              >
                Aviso de Privacidad
              </Link>
              .
            </label>
          </div>

          {mensaje && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {mensaje}
            </div>
          )}

          <Button
            type="button"
            disabled={loading || !aceptaTerminos}
            onClick={completarRegistro}
            className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-base font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  className="mr-2 animate-spin"
                  size={18}
                />
                Completando registro...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight
                  className="ml-2"
                  size={18}
                />
              </>
            )}
          </Button>

          <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
            Tu cuenta de Google ya fue autenticada.
            Al continuar terminaremos la configuración
            de tu cuenta Dropit.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CompletarRegistro() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2
              size={20}
              className="animate-spin text-[#2563eb]"
            />
            Verificando tu cuenta...
          </div>
        </main>
      }
    >
      <CompletarRegistroContent />
    </Suspense>
  );
}