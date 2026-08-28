"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReceiptText,
  Loader2,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

type EstablishmentInvoiceItem = {
  invoice_request_id: string;
  pedido_id: number;
  folio: string | null;

  establecimiento_id: number | null;
  establecimiento_uuid: string | null;
  establecimiento_nombre: string | null;

  fiscal_profile_id: string | null;

  request_estado: string;
  fecha_solicitud: string | null;
  fecha_limite: string | null;

  receptor: {
    rfc?: string;
    razon_social?: string;
    email?: string;
  } | null;

  monto_esperado: number | null;

  invoice: {
    id: string;
    tipo_emisor: string;
    estado: string;
    uuid_fiscal?: string | null;
    xml_path?: string | null;
    pdf_path?: string | null;
    fecha_emision?: string | null;
    error_mensaje?: string | null;
  } | null;
};

export default function FacturacionEstablecimientoPage() {
  const router = useRouter();

  const [facturas, setFacturas] =
    useState<EstablishmentInvoiceItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function cargarFacturas() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(
          "/establecimiento/login"
        );
        return;
      }

      const response = await fetch(
        "/api/orders/billing/establishment-invoices",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar las facturas"
        );
      }

      setFacturas(
        data?.invoices || []
      );
    } catch (err) {
      console.error(
        "Error cargando facturas del establecimiento:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las facturas"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarFacturas();
  }, []);

  const pendientes =
    useMemo(() => {
      return facturas.filter(
        (item) =>
          item.invoice &&
          item.invoice.estado !==
            "emitida" &&
          item.invoice.estado !==
            "cancelada"
      );
    }, [facturas]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-[#2563eb]"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Cargando facturas...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 pb-32 lg:py-12">
      <div className="mx-auto w-full max-w-5xl space-y-7">

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb]">
              <ReceiptText size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
                Facturación
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e3a8a] md:text-4xl">
                Facturas pendientes
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Revisa las solicitudes de factura de tus establecimientos y completa las acciones necesarias.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <ResumenCard
            label="Pendientes"
            value={pendientes.length}
            icon={
              <AlertTriangle
                size={20}
              />
            }
          />

          <ResumenCard
            label="Total solicitudes"
            value={facturas.length}
            icon={
              <ReceiptText
                size={20}
              />
            }
          />
        </section>

        {pendientes.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CheckCircle2
              size={40}
              className="mx-auto text-emerald-500"
            />

            <h2 className="mt-4 text-xl font-bold text-[#1e3a8a]">
              No tienes facturas pendientes
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Cuando un vendedor solicite una factura, aparecerá aquí.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {pendientes.map(
              (item) => (
                <FacturaCard
                  key={
                    item.invoice_request_id
                  }
                  item={item}
                  onConfigurarFiscal={() => {
                    if (
                      !item.establecimiento_id
                    ) {
                      return;
                    }

                    router.push(
                      `/establecimiento/onboarding-fiscal?establecimiento_id=${item.establecimiento_id}`
                    );
                  }}
                  onSubirFactura={() => {
  if (!item.invoice_request_id) {
    return;
  }

  router.push(
    `/establecimiento/facturacion/${item.invoice_request_id}`
  );
}}
                />
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function FacturaCard({
  item,
  onConfigurarFiscal,
  onSubirFactura,
}: {
  item: EstablishmentInvoiceItem;
  onConfigurarFiscal: () => void;
  onSubirFactura: () => void;
}) {
  const necesitaPerfilFiscal =
    !item.fiscal_profile_id;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Store
              size={17}
              className="text-[#2563eb]"
            />

            <p className="text-sm font-semibold text-slate-500">
              {item.establecimiento_nombre ||
                "Establecimiento"}
            </p>
          </div>

          <h2 className="mt-2 text-xl font-black text-[#1e3a8a]">
            {item.folio ||
              `Pedido ${item.pedido_id}`}
          </h2>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">

            <InfoItem
              label="Importe esperado"
              value={
                item.monto_esperado != null
                  ? `$${item.monto_esperado.toFixed(
                      2
                    )} MXN`
                  : "No disponible"
              }
            />

            <InfoItem
              label="Estado"
              value={
                item.invoice?.estado ||
                "pendiente"
              }
            />

            <InfoItem
              label="RFC receptor"
              value={
                item.receptor?.rfc ||
                "No disponible"
              }
            />

            <InfoItem
              label="Razón social"
              value={
                item.receptor
                  ?.razon_social ||
                "No disponible"
              }
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          {necesitaPerfilFiscal ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="font-semibold text-amber-800">
                    Faltan datos fiscales
                  </p>

                  <p className="mt-1 text-sm leading-5 text-amber-700">
                    Configura los datos fiscales de este establecimiento antes de subir la factura.
                  </p>
                </div>
              </div>

              <Button
                className="mt-4 h-11 w-full rounded-xl bg-amber-600 font-semibold text-white hover:bg-amber-700"
                onClick={
                  onConfigurarFiscal
                }
              >
                Configurar datos fiscales
              </Button>
            </div>
          ) : (
            <Button
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
              onClick={
                onSubirFactura
              }
            >
              <Upload
                size={17}
                className="mr-2"
              />
              Subir factura
            </Button>
          )}
        </div>
      </div>
    </div>
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

function ResumenCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563eb]">
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="text-2xl font-black text-[#1e3a8a]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}