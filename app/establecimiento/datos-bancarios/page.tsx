"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  Loader2,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

type DatosBancarios = {
  titular_cuenta: string;
  clabe: string;
  banco: string | null;
  consentimiento_at: string;
  aviso_privacidad_version: string;
};

export default function DatosBancariosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);

  const [datos, setDatos] = useState<DatosBancarios | null>(null);

  const [titularCuenta, setTitularCuenta] = useState("");
  const [clabe, setClabe] = useState("");
  const [banco, setBanco] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("UNAUTHORIZED");
    }

    return session.access_token;
  }

  async function cargarDatos() {
    try {
      setLoading(true);
      setError("");

      const token = await getSessionToken();

      const response = await fetch(
        "/api/orders/retiros/datos-bancarios",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar tus datos bancarios"
        );
      }

      const bancarios =
        (data?.datos_bancarios as DatosBancarios | null) || null;

      setDatos(bancarios);

      if (bancarios) {
        cargarFormulario(bancarios);
        setEditando(false);
      } else {
        setEditando(true);
      }
    } catch (err) {
      console.error("Error cargando datos bancarios:", err);

      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        router.replace("/establecimiento/login");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar tus datos bancarios"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function cargarFormulario(bancarios: DatosBancarios) {
    setTitularCuenta(bancarios.titular_cuenta || "");
    setClabe(bancarios.clabe || "");
    setBanco(bancarios.banco || "");
    setConsentimiento(false);
  }

  function comenzarEdicion() {
    if (datos) {
      cargarFormulario(datos);
    }

    setError("");
    setMensaje("");
    setEditando(true);
  }

  function cancelarEdicion() {
    if (!datos) return;

    cargarFormulario(datos);
    setError("");
    setMensaje("");
    setEditando(false);
  }

  function handleClabe(value: string) {
    setClabe(
      value
        .replace(/\D/g, "")
        .slice(0, 18)
    );
  }

  async function guardarDatos(event: FormEvent) {
    event.preventDefault();

    if (guardando) return;

    setError("");
    setMensaje("");

    const titular = titularCuenta.trim();
    const clabeLimpia = clabe.replace(/\D/g, "");

    if (titular.length < 3) {
      setError("Ingresa el nombre del titular de la cuenta");
      return;
    }

    if (clabeLimpia.length !== 18) {
      setError("La CLABE debe contener 18 dígitos");
      return;
    }

    if (!consentimiento) {
      setError(
        "Debes autorizar el tratamiento de tus datos financieros"
      );
      return;
    }

    try {
      setGuardando(true);

      const token = await getSessionToken();

      const response = await fetch(
        "/api/orders/retiros/datos-bancarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titular_cuenta: titular,
            clabe: clabeLimpia,
            banco: banco.trim(),
            consentimiento,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No fue posible guardar tus datos bancarios"
        );
      }

      await cargarDatos();

      setMensaje(
        datos
          ? "Tus datos bancarios fueron actualizados correctamente."
          : "Tu cuenta bancaria fue registrada correctamente."
      );

      setEditando(false);
    } catch (err) {
      console.error("Error guardando datos bancarios:", err);

      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        router.replace("/establecimiento/login");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar tus datos bancarios"
      );
    } finally {
      setGuardando(false);
    }
  }

  function ocultarClabe(value: string) {
    if (!value) return "No disponible";

    const ultimos4 = value.slice(-4);

    return `•••• •••• •••• ••${ultimos4}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-[#2563eb]"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Cargando datos bancarios...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 pb-32 lg:py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">

        <button
          type="button"
          onClick={() =>
            router.push("/establecimiento/balance")
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563eb]"
        >
          <ArrowLeft size={16} />
          Volver a Balance
        </button>

        {/* HEADER */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb]">
              <Landmark size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
                Liquidaciones
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e3a8a]">
                Cuenta para recibir tus pagos
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Esta cuenta se utilizará para recibir las
                liquidaciones generadas por todos tus establecimientos.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />
            {mensaje}
          </div>
        )}

        {/* CUENTA REGISTRADA */}

        {datos && !editando && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-500"
              />

              <div>
                <h2 className="text-xl font-bold text-[#1e3a8a]">
                  Cuenta bancaria registrada
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tus próximos retiros se enviarán a esta cuenta.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Titular"
                value={datos.titular_cuenta}
              />

              <InfoItem
                label="Banco"
                value={datos.banco || "No especificado"}
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="CLABE"
                  value={ocultarClabe(datos.clabe)}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#2563eb]"
                />

                <p className="text-sm leading-6 text-slate-600">
                  Si cambias esta cuenta, la modificación aplicará
                  únicamente a futuros retiros. Las solicitudes ya
                  creadas conservarán la cuenta registrada al momento
                  de solicitarlas.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={comenzarEdicion}
              className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
            >
              <Pencil size={17} className="mr-2" />
              Editar cuenta bancaria
            </Button>
          </section>
        )}

        {/* REGISTRO / EDICIÓN */}

        {editando && (
          <form
            onSubmit={guardarDatos}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div>
              <h2 className="text-xl font-bold text-[#1e3a8a]">
                {datos
                  ? "Editar cuenta bancaria"
                  : "Registrar cuenta bancaria"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {datos
                  ? "Actualiza la cuenta donde quieres recibir tus próximos retiros."
                  : "Registra la cuenta donde quieres recibir las liquidaciones de tus establecimientos."}
              </p>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Titular de la cuenta
                </label>

                <input
                  type="text"
                  value={titularCuenta}
                  onChange={(event) =>
                    setTitularCuenta(event.target.value)
                  }
                  placeholder="Nombre completo o razón social"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CLABE interbancaria
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={clabe}
                  onChange={(event) =>
                    handleClabe(event.target.value)
                  }
                  placeholder="18 dígitos"
                  maxLength={18}
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 font-mono tracking-wider outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>
                    Utilizaremos esta CLABE para tus retiros.
                  </span>
                  <span>{clabe.length}/18</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Banco
                </label>

                <input
                  type="text"
                  value={banco}
                  onChange={(event) =>
                    setBanco(event.target.value)
                  }
                  placeholder="Ej. BBVA, Santander, Banorte"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(event) =>
                      setConsentimiento(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0"
                  />

                  <span className="text-sm leading-6 text-slate-700">
  Autorizo expresamente a Dropit el tratamiento de mis
  datos financieros y bancarios, incluyendo titular de
  la cuenta, CLABE e institución bancaria, para gestionar
  y realizar mis retiros y liquidaciones, conforme al{" "}
  <a
    href="/privacidad"
    target="_blank"
    rel="noopener noreferrer"
    className="font-semibold text-[#2563eb] hover:underline"
  >
    Aviso de Privacidad
  </a>
  .
</span>
                </label>
              </div>
            </div>

            <div
              className={`mt-6 grid gap-3 ${
                datos ? "sm:grid-cols-2" : ""
              }`}
            >
              {datos && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={guardando}
                  onClick={cancelarEdicion}
                  className="h-12 rounded-xl"
                >
                  Cancelar
                </Button>
              )}

              <Button
                type="submit"
                disabled={guardando}
                className="h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-bold text-white"
              >
                {guardando ? (
                  <>
                    <Loader2
                      size={18}
                      className="mr-2 animate-spin"
                    />
                    Guardando...
                  </>
                ) : datos ? (
                  "Guardar cambios"
                ) : (
                  "Registrar cuenta bancaria"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}   