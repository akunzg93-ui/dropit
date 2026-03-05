"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Mail, MessageCircle, Link } from "lucide-react";

export default function SharePedidoCard({ folio, codigo }) {
  const linkSeguimiento = `https://app.dropitt.net/track/${folio}`;

  const codigoDisponible = codigo && codigo !== "N/A";

  function copiarCodigo() {
    if (!codigoDisponible) return;
    navigator.clipboard.writeText(codigo);
  }

  function copiarLink() {
    navigator.clipboard.writeText(linkSeguimiento);
  }

  function abrirWhatsApp() {
    const texto = `
Hola 👋

Te comparto tu pedido Dropit.

Folio: ${folio}
${codigoDisponible ? `Código de entrega: ${codigo}` : ""}

Seguimiento:
${linkSeguimiento}
`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(url, "_blank");
  }

  function enviarCorreo() {
    const subject = `Tu pedido Dropit ${folio}`;
    const body = `
Hola,

Te comparto tu pedido Dropit.

Folio: ${folio}
${codigoDisponible ? `Código de entrega: ${codigo}` : ""}

Seguimiento:
${linkSeguimiento}
`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <Card className="mt-8 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">

      <div className="text-center space-y-2">

        <h2 className="text-xl font-semibold text-slate-900">
          Pedido creado correctamente
        </h2>

        <p className="text-sm text-slate-500">
          Comparte esta información con tu comprador
        </p>

      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">

        <p className="text-sm text-slate-500">
          Folio
        </p>

        <p className="text-lg font-semibold text-slate-900">
          {folio}
        </p>

        <div className="pt-3 border-t border-slate-200">

          <p className="text-sm text-slate-500">
            Código de entrega
          </p>

          {codigoDisponible ? (
            <p className="text-lg font-semibold text-slate-900">
              {codigo}
            </p>
          ) : (
            <p className="text-sm text-amber-600">
              Se generará cuando el establecimiento confirme el pedido
            </p>
          )}

        </div>

      </div>

      <div className="space-y-3">

        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          onClick={abrirWhatsApp}
        >
          <MessageCircle size={18} />
          Compartir por WhatsApp
        </Button>

        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={enviarCorreo}
        >
          <Mail size={18} />
          Enviar por correo
        </Button>

        {codigoDisponible && (
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={copiarCodigo}
          >
            <Copy size={18} />
            Copiar código
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={copiarLink}
        >
          <Link size={18} />
          Copiar link de seguimiento
        </Button>

      </div>

    </Card>
  );
}