"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReceiptText,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

import FiscalProfileForm from "@/app/components/billing/FiscalProfileForm";
import FiscalProfileCard from "@/app/components/billing/FiscalProfileCard";

const PERFIL_INICIAL = {
  nombre_perfil: "",
  rfc: "",
  razon_social: "",
  codigo_postal: "",
  regimen_fiscal: "",
  uso_cfdi: "G03",
  email: "",
};

function OnboardingFiscalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const establecimientoId =
    searchParams.get("establecimiento_id");

  const [perfiles, setPerfiles] = useState([]);
  const [perfilSeleccionado, setPerfilSeleccionado] =
    useState(null);

  const [nuevoPerfilFiscal, setNuevoPerfilFiscal] =
    useState(PERFIL_INICIAL);

  const [modo, setModo] = useState("cargando");

  const [guardandoPerfil, setGuardandoPerfil] =
    useState(false);

  const [activando, setActivando] =
    useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // Auth headers
  // =====================================================

  async function getAuthHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("UNAUTHORIZED");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

// =====================================================
// Validar establecimiento
// =====================================================

async function validarEstablecimiento() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const {
  data: profile,
  error: profileError,
} = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  throw new Error(
    "No se pudo validar el rol del usuario"
  );
}

if (profile?.role !== "establishment") {
  throw new Error(
    "INVALID_ROLE"
  );
}

  const { data, error } = await supabase
    .from("establecimientos")
    .select("id")
    .eq("id", Number(establecimientoId))
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Error validando establecimiento:",
      error
    );

    throw new Error(
      "No se pudo validar el establecimiento"
    );
  }

  if (!data) {
    throw new Error(
      "ESTABLISHMENT_NOT_FOUND"
    );
  }

  return data;
}

  // =====================================================
  // Cargar perfiles fiscales
  // =====================================================

  async function cargarPerfiles() {
    try {
      setError("");

      if (!establecimientoId) {
        setError(
          "No se encontró el establecimiento que deseas configurar."
        );
        setModo("error");
        return;
      }

      const headers =
        await getAuthHeaders();

        await validarEstablecimiento();

      const response = await fetch(
        "/api/orders/billing/fiscal-profiles",
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar los perfiles fiscales"
        );
      }

      const profiles =
        data?.profiles || [];

      setPerfiles(profiles);

      if (profiles.length === 0) {
        setModo("crear");
        return;
      }

      const predeterminado =
        profiles.find(
          (perfil) =>
            perfil.es_predeterminado
        ) || profiles[0];

      setPerfilSeleccionado(
        predeterminado.id
      );

      setModo("lista");
    } catch (err) {
      console.error(
        "Error cargando perfiles fiscales:",
        err
      );

      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        router.replace(
          "/establecimiento/login"
        );
        return;
      }

      if (
  err instanceof Error &&
  err.message ===
    "ESTABLISHMENT_NOT_FOUND"
) {
  setError(
    "No tienes acceso a este establecimiento."
  );
  setModo("error");
  return;
}

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los datos fiscales"
      );

      setModo("error");
    }
  }

  useEffect(() => {
    cargarPerfiles();
  }, [establecimientoId]);

  // =====================================================
  // Crear perfil fiscal
  // =====================================================

  async function crearPerfilFiscal() {
    try {
      setError("");
      setGuardandoPerfil(true);

      const headers =
        await getAuthHeaders();

      const response = await fetch(
        "/api/orders/billing/fiscal-profiles",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...nuevoPerfilFiscal,
            es_predeterminado:
              perfiles.length === 0,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo guardar el perfil fiscal"
        );
      }

      const perfilCreado =
        data.profile;

      setPerfiles((actuales) => [
        ...actuales,
        perfilCreado,
      ]);

      setPerfilSeleccionado(
        perfilCreado.id
      );

      setNuevoPerfilFiscal(
        PERFIL_INICIAL
      );

      setModo("lista");
    } catch (err) {
      console.error(
        "Error creando perfil fiscal:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el perfil fiscal"
      );
    } finally {
      setGuardandoPerfil(false);
    }
  }

  // =====================================================
  // Completar onboarding
  // =====================================================

  async function completarOnboarding() {
    if (!perfilSeleccionado) {
      setError(
        "Selecciona un perfil fiscal."
      );
      return;
    }

    try {
      setError("");
      setActivando(true);

      const headers =
        await getAuthHeaders();

      const response = await fetch(
        "/api/orders/establishments/complete-onboarding",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            establecimiento_id:
              establecimientoId,

            fiscal_profile_id:
              perfilSeleccionado,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo completar la configuración"
        );
      }

      router.replace(
        "/establecimiento"
      );
    } catch (err) {
      console.error(
        "Error completando onboarding:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la configuración"
      );
    } finally {
      setActivando(false);
    }
  }

  // =====================================================
  // Loading
  // =====================================================

  if (modo === "cargando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-[#2563eb]"
            size={32}
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Preparando tus datos fiscales...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 lg:py-12">
      <div className="mx-auto w-full max-w-2xl">

        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
            <ReceiptText
              size={26}
              className="text-[#2563eb]"
            />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-blue-500">
            CONFIGURACIÓN FISCAL
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e3a8a]">
            Datos fiscales
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
            Registra los datos fiscales que utilizarás para
            la facturación de los servicios de este establecimiento.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-[#2563eb]"
            />

            <div>
              <p className="font-semibold text-[#1e3a8a]">
                Información de facturación
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                Dropit utilizará estos datos para la
                facturación relacionada con los servicios
                de tu establecimiento.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {modo === "crear" ? (
            <FiscalProfileForm
              nuevoPerfilFiscal={
                nuevoPerfilFiscal
              }
              setNuevoPerfilFiscal={
                setNuevoPerfilFiscal
              }
              guardandoPerfilFiscal={
                guardandoPerfil
              }
              crearPerfilFiscal={
                crearPerfilFiscal
              }
              onVolver={() => {
                if (perfiles.length > 0) {
                  setModo("lista");
                } else {
                  router.back();
                }
              }}
            />
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Selecciona tus datos fiscales
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Puedes utilizar un perfil existente o
                  registrar uno nuevo.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {perfiles.map((perfil) => (
                  <FiscalProfileCard
                    key={perfil.id}
                    perfil={perfil}
                    seleccionado={
                      perfilSeleccionado ===
                      perfil.id
                    }
                    onSelect={() =>
                      setPerfilSeleccionado(
                        perfil.id
                      )
                    }
                  />
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-4 h-11 w-full rounded-xl border-dashed border-blue-200 font-semibold text-[#2563eb]"
                onClick={() =>
                  setModo("crear")
                }
              >
                + Nuevo perfil fiscal
              </Button>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <Button
                  disabled={
                    !perfilSeleccionado ||
                    activando
                  }
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-bold text-white"
                  onClick={
                    completarOnboarding
                  }
                >
                  {activando ? (
                    <>
                      <Loader2
                        size={18}
                        className="mr-2 animate-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={18}
                        className="mr-2"
                      />
                      Guardar datos fiscales
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function OnboardingFiscalEstablecimiento() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2
              className="mx-auto animate-spin text-[#2563eb]"
              size={32}
            />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Preparando tus datos fiscales...
            </p>
          </div>
        </main>
      }
    >
      <OnboardingFiscalContent />
    </Suspense>
  );
}