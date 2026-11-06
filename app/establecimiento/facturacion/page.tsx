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
  ChevronDown,
  ChevronUp,
  Eye,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mostrarEntregadas, setMostrarEntregadas] =
    useState(false);

  async function cargarFacturas() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/establecimiento/login");
        return;
      }

      const response = await fetch(
        "/api/orders/billing/establishment-invoices",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar las facturas"
        );
      }

      setFacturas(data?.invoices || []);
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

  const pendientes = useMemo(() => {
    return facturas.filter(
      (item) =>
        item.invoice &&
        item.invoice.estado !== "emitida" &&
        item.invoice.estado !== "cancelada"
    );
  }, [facturas]);

  const entregadas = useMemo(() => {
    return facturas.filter(
      (item) => item.invoice?.estado === "emitida"
    );
  }, [facturas]);

  function abrirFactura(item: EstablishmentInvoiceItem) {
    if (!item.invoice_request_id) return;

    router.push(
      `/establecimiento/facturacion/${item.invoice_request_id}`
    );
  }

  function configurarFiscal(item: EstablishmentInvoiceItem) {
    if (!item.establecimiento_id) return;

    router.push(
      `/establecimiento/onboarding-fiscal?establecimiento_id=${item.establecimiento_id}`
    );
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
            Cargando facturas...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 pb-32 lg:py-12">
      <div className="mx-auto w-full max-w-5xl space-y-7">

        {/* ENCABEZADO */}

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
                Facturación
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Consulta las solicitudes de factura de tus
                establecimientos y revisa las facturas
                entregadas y validadas.
              </p>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* INDICADORES */}

        <section className="grid gap-4 sm:grid-cols-3">
          <ResumenCard
            label="Pendientes"
            value={pendientes.length}
            icon={<AlertTriangle size={20} />}
          />

          <ResumenCard
            label="Entregadas"
            value={entregadas.length}
            icon={<CheckCircle2 size={20} />}
          />

          <ResumenCard
            label="Total solicitudes"
            value={facturas.length}
            icon={<ReceiptText size={20} />}
          />
        </section>

        {/* FACTURAS PENDIENTES */}

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={22}
              className="text-amber-500"
            />

            <h2 className="text-xl font-black text-[#1e3a8a]">
              Facturas pendientes
            </h2>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {pendientes.length}
            </span>
          </div>

          {pendientes.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <CheckCircle2
                size={40}
                className="mx-auto text-emerald-500"
              />

              <h3 className="mt-4 text-xl font-bold text-[#1e3a8a]">
                No tienes facturas pendientes
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Cuando un vendedor solicite una factura,
                aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendientes.map((item) => (
                <FacturaCard
                  key={item.invoice_request_id}
                  item={item}
                  entregada={false}
                  onConfigurarFiscal={() =>
                    configurarFiscal(item)
                  }
                  onAbrirFactura={() =>
                    abrirFactura(item)
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* FACTURAS ENTREGADAS */}

        <section className="space-y-4">
          <button
            type="button"
            onClick={() =>
              setMostrarEntregadas((prev) => !prev)
            }
            aria-expanded={mostrarEntregadas}
            className="flex w-full items-center justify-between rounded-3xl border border-emerald-200 bg-white p-5 text-left shadow-sm transition-colors hover:bg-emerald-50 md:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#1e3a8a]">
                  Facturas entregadas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {entregadas.length} factura
                  {entregadas.length === 1 ? "" : "s"} validada
                  {entregadas.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {mostrarEntregadas ? (
              <ChevronUp
                size={22}
                className="text-slate-500"
              />
            ) : (
              <ChevronDown
                size={22}
                className="text-slate-500"
              />
            )}
          </button>

          {mostrarEntregadas && (
            <div className="space-y-4">
              {entregadas.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <ReceiptText
                    size={32}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    Todavía no tienes facturas entregadas.
                  </p>
                </div>
              ) : (
                entregadas.map((item) => (
                  <FacturaCard
                    key={item.invoice_request_id}
                    item={item}
                    entregada={true}
                    onConfigurarFiscal={() =>
                      configurarFiscal(item)
                    }
                    onAbrirFactura={() =>
                      abrirFactura(item)
                    }
                  />
                ))
              )}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

/* =====================================================
   CARD DE FACTURA
===================================================== */

function FacturaCard({
  item,
  entregada,
  onConfigurarFiscal,
  onAbrirFactura,
}: {
  item: EstablishmentInvoiceItem;
  entregada: boolean;
  onConfigurarFiscal: () => void;
  onAbrirFactura: () => void;
}) {
  const necesitaPerfilFiscal =
    !item.fiscal_profile_id;

  const fechaEmision =
    item.invoice?.fecha_emision
      ? new Date(
          item.invoice.fecha_emision
        ).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <div
      className={`rounded-3xl border bg-white p-5 shadow-sm md:p-6 ${
        entregada
          ? "border-emerald-200"
          : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

        {/* INFORMACIÓN */}

        <div className="min-w-0 flex-1">
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

          <h3 className="mt-2 text-xl font-black text-[#1e3a8a]">
            {item.folio ||
              `Pedido ${item.pedido_id}`}
          </h3>

          {entregada && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={15} />
              Factura entregada y validada
            </div>
          )}

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem
              label="Importe esperado"
              value={
                item.monto_esperado != null
                  ? `$${item.monto_esperado.toFixed(2)} MXN`
                  : "No disponible"
              }
            />

            <InfoItem
              label="Estado"
              value={
                entregada
                  ? "Entregada y validada"
                  : item.invoice?.estado ||
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
                item.receptor?.razon_social ||
                "No disponible"
              }
            />

            {entregada &&
              item.invoice?.uuid_fiscal && (
                <div className="sm:col-span-2">
                  <InfoItem
                    label="UUID fiscal"
                    value={item.invoice.uuid_fiscal}
                  />
                </div>
              )}

            {entregada && fechaEmision && (
              <InfoItem
                label="Fecha de emisión"
                value={fechaEmision}
              />
            )}
          </div>
        </div>

        {/* ACCIONES */}

        <div className="w-full md:w-64">
          {entregada ? (
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl border-emerald-300 font-semibold text-emerald-700 hover:bg-emerald-50"
              onClick={onAbrirFactura}
            >
              <Eye
                size={17}
                className="mr-2"
              />
              Ver factura
            </Button>
          ) : necesitaPerfilFiscal ? (
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
                    Configura los datos fiscales de este
                    establecimiento antes de subir la factura.
                  </p>
                </div>
              </div>

              <Button
                className="mt-4 h-11 w-full rounded-xl bg-amber-600 font-semibold text-white hover:bg-amber-700"
                onClick={onConfigurarFiscal}
              >
                Configurar datos fiscales
              </Button>
            </div>
          ) : (
            <Button
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
              onClick={onAbrirFactura}
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

/* =====================================================
   COMPONENTES AUXILIARES
===================================================== */

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