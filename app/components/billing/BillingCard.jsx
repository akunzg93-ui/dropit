"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  ReceiptText,
  CheckCircle,
} from "lucide-react";
import BillingTimeline from "./BillingTimeline";

export default function BillingCard({
  pedido,
  fechaLimite,
  cargandoPerfiles,
  cargandoEstadoFacturacion,
  solicitudFactura,
  onSolicitar,
}) {
  if (!pedido) return null;

  const solicitudEnviada =
    solicitudFactura?.estado === "solicitada";

    const invoices =
  solicitudFactura?.invoices || [];

const facturaDropit =
  invoices.find(
    (invoice) =>
      invoice.tipo_emisor === "dropit"
  );

const facturaEstablecimiento =
  invoices.find(
    (invoice) =>
      invoice.tipo_emisor === "establecimiento"
  );

const facturaDropitEmitida =
  facturaDropit?.estado === "emitida";

const facturaEstablecimientoEmitida =
  facturaEstablecimiento?.estado === "emitida";

const finalizado =
  facturaDropitEmitida &&
  facturaEstablecimientoEmitida;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#2563eb]">
          <ReceiptText size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
            Facturación
          </p>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Estado
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <p className="font-bold text-[#1e3a8a]">
                {solicitudEnviada
                  ? "Solicitud en proceso"
                  : "Disponible para solicitar"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {solicitudEnviada
              ? "Tu solicitud de facturación fue recibida correctamente. Aquí podrás consultar el avance del proceso."
              : "Puedes solicitar la factura de este servicio hasta el último día del mes en que inició."}
          </p>

          <div className="mt-4 rounded-xl border border-blue-100 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {solicitudEnviada
                ? "Fecha límite"
                : "Disponible hasta"}
            </p>

            <p className="mt-1 font-bold capitalize text-slate-900">
              {fechaLimite || "Por definir"}
            </p>
          </div>

          <BillingTimeline
  disponible={
    solicitudEnviada
      ? "completed"
      : "active"
  }
  solicitud={
    solicitudEnviada
      ? "completed"
      : "pending"
  }
  facturaDropit={
    facturaDropitEmitida
      ? "completed"
      : solicitudEnviada
      ? "active"
      : "pending"
  }
  facturaEstablecimiento={
    facturaEstablecimientoEmitida
      ? "completed"
      : facturaDropitEmitida
      ? "active"
      : "pending"
  }
  finalizado={
    finalizado
      ? "completed"
      : "pending"
  }
/>

{facturaDropitEmitida &&
  facturaDropit?.id && (
    <Button
      type="button"
      variant="outline"
      className="mt-4 h-12 w-full rounded-xl border-blue-200 font-semibold text-[#2563eb] hover:bg-blue-50"
      onClick={async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            alert(
              "No se pudo validar tu sesión."
            );
            return;
          }

          const res = await fetch(
            `/api/orders/billing/invoices/${facturaDropit.id}/download?format=xml`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          );

          if (!res.ok) {
            const json =
              await res.json();

            alert(
              json.error ||
                "No se pudo descargar el XML."
            );

            return;
          }

          const blob =
            await res.blob();

          const url =
            window.URL.createObjectURL(
              blob
            );

          const a =
            document.createElement("a");

          a.href = url;

          a.download =
            `factura-${pedido.folio}.xml`;

          document.body.appendChild(a);
          a.click();
          a.remove();

          window.URL.revokeObjectURL(
            url
          );
        } catch (error) {
          console.error(
            "Error descargando XML:",
            error
          );

          alert(
            "Ocurrió un error al descargar la factura."
          );
        }
      }}
    >
      Descargar XML Dropit
    </Button>
  )}

  {facturaDropitEmitida &&
  facturaDropit?.id &&
  facturaDropit?.pdf_path && (
    <Button
      type="button"
      variant="outline"
      className="mt-3 h-12 w-full rounded-xl border-blue-200 font-semibold text-[#2563eb] hover:bg-blue-50"
      onClick={async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            alert(
              "No se pudo validar tu sesión."
            );
            return;
          }

          const res = await fetch(
            `/api/orders/billing/invoices/${facturaDropit.id}/download?format=pdf`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (!res.ok) {
            const json =
              await res.json();

            alert(
              json.error ||
                "No se pudo descargar el PDF."
            );

            return;
          }

          const blob =
            await res.blob();

          const url =
            window.URL.createObjectURL(
              blob
            );

          const a =
            document.createElement("a");

          a.href = url;
          a.download =
            `factura-${pedido.folio}.pdf`;

          document.body.appendChild(a);
          a.click();
          a.remove();

          window.URL.revokeObjectURL(
            url
          );
        } catch (error) {
          console.error(
            "Error descargando PDF:",
            error
          );

          alert(
            "Ocurrió un error al descargar el PDF."
          );
        }
      }}
    >
      Descargar PDF Dropit
    </Button>
  )}

          {cargandoEstadoFacturacion ? (
            <Button
              disabled
              className="mt-5 h-12 w-full rounded-xl"
            >
              Consultando facturación...
            </Button>
          ) : solicitudEnviada ? (
            <Button
              disabled
              variant="outline"
              className="mt-5 h-12 w-full rounded-xl border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 opacity-100"
            >
              <CheckCircle
                size={17}
                className="mr-2"
              />

              Solicitud en proceso
            </Button>
          ) : (
            <Button
              disabled={cargandoPerfiles}
              className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
              onClick={onSolicitar}
            >
              <ReceiptText
                size={17}
                className="mr-2"
              />

              {cargandoPerfiles
                ? "Cargando..."
                : "Solicitar factura"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}