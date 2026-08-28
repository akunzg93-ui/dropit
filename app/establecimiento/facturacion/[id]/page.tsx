"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ReceiptText,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

type InvoiceDetail = {
  invoice_request_id: string;
  pedido_id: number;
  folio: string | null;

  establecimiento_id: number | null;
  establecimiento_nombre: string | null;
  fiscal_profile_id: string | null;

  request_estado: string;

  receptor: {
    rfc?: string;
    razon_social?: string;
    email?: string;
  } | null;

  monto_esperado: number | null;

  invoice: {
    id: string;
    estado: string;
    xml_path?: string | null;
    pdf_path?: string | null;
    uuid_fiscal?: string | null;
    error_mensaje?: string | null;
  } | null;
};

export default function FacturaEstablecimientoDetallePage() {
  const router = useRouter();
  const params = useParams();

  const invoiceRequestId =
    String(params?.id || "");

  const [factura, setFactura] =
    useState<InvoiceDetail | null>(null);

  const [xml, setXml] =
    useState<File | null>(null);

  const [pdf, setPdf] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [subiendo, setSubiendo] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("UNAUTHORIZED");
    }

    return session.access_token;
  }

  async function cargarFactura() {
    try {
      setLoading(true);
      setError("");

      const token =
        await getSessionToken();

      const response = await fetch(
        "/api/orders/billing/establishment-invoices",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo cargar la factura"
        );
      }

      const encontrada =
        (data?.invoices || []).find(
          (item: InvoiceDetail) =>
            item.invoice_request_id ===
            invoiceRequestId
        );

      if (!encontrada) {
        throw new Error(
          "Factura no encontrada"
        );
      }

      setFactura(encontrada);
    } catch (err) {
      console.error(
        "Error cargando factura:",
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

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la factura"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!invoiceRequestId) return;

    cargarFactura();
  }, [invoiceRequestId]);

  async function subirFactura() {
    if (!factura) return;

    if (!xml || !pdf) {
      setError(
        "Selecciona el XML y el PDF de la factura."
      );
      return;
    }

    if (!factura.fiscal_profile_id) {
      setError(
        "Configura primero los datos fiscales del establecimiento."
      );
      return;
    }

    try {
      setSubiendo(true);
      setError("");
      setMensaje("");

      const token =
        await getSessionToken();

      // ===================================================
      // 1. Upload XML + PDF
      // ===================================================

      const formData =
        new FormData();

      formData.append(
        "invoice_request_id",
        factura.invoice_request_id
      );

      formData.append(
        "xml",
        xml
      );

      formData.append(
        "pdf",
        pdf
      );

      const uploadResponse =
        await fetch(
          "/api/orders/billing/establishment-invoices/upload",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            body: formData,
          }
        );

      const uploadData =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData?.error ||
            "No se pudieron subir los documentos"
        );
      }

      // ===================================================
      // 2. Validación local CFDI
      // ===================================================

      const validateResponse =
        await fetch(
          `/api/orders/billing/establishment-invoices/${factura.invoice_request_id}/validate`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const validateData =
        await validateResponse.json();

      if (!validateResponse.ok) {
        const validationErrors =
          Array.isArray(
            validateData?.errors
          )
            ? validateData.errors.join(
                " · "
              )
            : validateData?.error;

        throw new Error(
          validationErrors ||
            "La factura no pasó la validación"
        );
      }

      setMensaje(
        validateData
          ?.requires_sat_validation
          ? "Documentos recibidos. La factura pasó la validación inicial y quedó pendiente de validación fiscal."
          : "Factura validada correctamente."
      );

      setXml(null);
      setPdf(null);

      await cargarFactura();
    } catch (err) {
      console.error(
        "Error procesando factura:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar la factura"
      );
    } finally {
      setSubiendo(false);
    }
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
            Cargando factura...
          </p>
        </div>
      </main>
    );
  }

  if (!factura) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
          <AlertTriangle
            className="text-red-500"
            size={30}
          />

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            No se pudo cargar la factura
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error ||
              "La factura solicitada no está disponible."}
          </p>

          <Button
            className="mt-6"
            onClick={() =>
              router.push(
                "/establecimiento/facturacion"
              )
            }
          >
            Volver
          </Button>
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
            router.push(
              "/establecimiento/facturacion"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563eb]"
        >
          <ArrowLeft size={16} />
          Volver a facturación
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb]">
              <ReceiptText size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
                Factura solicitada
              </p>

              <h1 className="mt-2 text-3xl font-black text-[#1e3a8a]">
                {factura.folio ||
                  `Pedido ${factura.pedido_id}`}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {factura.establecimiento_nombre ||
                  "Establecimiento"}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <InfoItem
              label="Importe esperado"
              value={
                factura.monto_esperado != null
                  ? `$${factura.monto_esperado.toFixed(
                      2
                    )} MXN`
                  : "No disponible"
              }
            />

            <InfoItem
              label="Estado"
              value={
                factura.invoice?.estado ||
                "pendiente"
              }
            />

            <InfoItem
              label="RFC receptor"
              value={
                factura.receptor?.rfc ||
                "No disponible"
              }
            />

            <InfoItem
              label="Razón social"
              value={
                factura.receptor
                  ?.razon_social ||
                "No disponible"
              }
            />
          </div>
        </section>

        {!factura.fiscal_profile_id ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={22}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <h2 className="font-bold text-amber-900">
                  Configura tus datos fiscales
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Antes de subir una factura debes asociar un perfil fiscal a este establecimiento.
                </p>
              </div>
            </div>

            <Button
              className="mt-5 h-11 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                if (
                  factura.establecimiento_id
                ) {
                  router.push(
                    `/establecimiento/onboarding-fiscal?establecimiento_id=${factura.establecimiento_id}`
                  );
                }
              }}
            >
              Configurar datos fiscales
            </Button>
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1e3a8a]">
                Subir CFDI
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Carga el XML y PDF correspondientes a esta operación. Dropit verificará los datos antes de aceptar la factura.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                {mensaje}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FileSelector
                label="XML del CFDI"
                accept=".xml,text/xml,application/xml"
                file={xml}
                onChange={setXml}
              />

              <FileSelector
                label="PDF de la factura"
                accept=".pdf,application/pdf"
                file={pdf}
                onChange={setPdf}
              />
            </div>

            <Button
              disabled={
                subiendo ||
                !xml ||
                !pdf
              }
              className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-bold text-white"
              onClick={subirFactura}
            >
              {subiendo ? (
                <>
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload
                    size={18}
                    className="mr-2"
                  />
                  Subir y validar factura
                </>
              )}
            </Button>
          </section>
        )}
      </div>
    </main>
  );
}

function FileSelector({
  label,
  accept,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (
    file: File | null
  ) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50/40">
      <FileText
        size={24}
        className="text-[#2563eb]"
      />

      <p className="mt-3 font-semibold text-slate-800">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {file
          ? file.name
          : "Selecciona un archivo"}
      </p>

      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) =>
          onChange(
            event.target.files?.[0] ||
              null
          )
        }
      />
    </label>
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