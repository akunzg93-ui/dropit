"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Copy,
  Mail,
  MessageCircle,
  Link,
  PackageCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function SharePedidoCard({ folio, codigo, correo }) {
  const [feedback, setFeedback] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  const linkSeguimiento = `https://app.dropitt.net/track/${folio}`;
  const codigoDisponible = codigo && codigo !== "N/A";

  function mostrarFeedback(texto) {
    setFeedback(texto);
    setTimeout(() => setFeedback(""), 2500);
  }

  async function copiarCodigo() {
    if (!codigoDisponible) return;

    await navigator.clipboard.writeText(codigo);
    mostrarFeedback("Código copiado");
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(linkSeguimiento);
    mostrarFeedback("Link de seguimiento copiado");
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
    mostrarFeedback("Abriendo WhatsApp");
  }

  async function enviarCorreo() {
    if (!correo) {
      mostrarFeedback("No se encontró el correo del cliente");
      return;
    }

    try {
      setEnviandoCorreo(true);

      const res = await fetch("/api/orders/email/pedido-creado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo,
          folio,
        }),
      });

      if (!res.ok) {
        mostrarFeedback("No se pudo enviar el correo");
        return;
      }

      mostrarFeedback(`Correo enviado a ${correo}`);
    } catch (error) {
      console.error("Error enviando correo:", error);
      mostrarFeedback("No se pudo enviar el correo");
    } finally {
      setEnviandoCorreo(false);
    }
  }

  return (
    <Card className="mt-8 overflow-hidden rounded-3xl border border-indigo-100 shadow-xl bg-white">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-7 text-white">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <PackageCheck size={26} />
          </div>

          <div className="text-left">
            <h2 className="text-xl font-bold">Pedido creado correctamente</h2>
            <p className="text-sm text-white/80">
              El cliente recibirá el folio y el link de seguimiento.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            {feedback}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Folio del pedido
            </p>

            <p className="text-2xl font-bold text-slate-900 mt-1">{folio}</p>
          </div>

          <div className="pt-5 border-t border-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Correo del cliente
            </p>

            <p className="text-sm text-slate-700 mt-1 break-all">
              {correo || "No disponible"}
            </p>
          </div>

          <div className="pt-5 border-t border-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Código de entrega
            </p>

            {codigoDisponible ? (
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {codigo}
              </p>
            ) : (
              <p className="text-sm text-amber-600 mt-1">
                Se generará cuando el establecimiento confirme el pedido.
              </p>
            )}
          </div>

          <div className="pt-5 border-t border-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Link de seguimiento
            </p>

            <p className="text-sm text-slate-600 mt-1 break-all">
              {linkSeguimiento}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Button
            className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2"
            onClick={abrirWhatsApp}
          >
            <MessageCircle size={18} />
            WhatsApp
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-xl border-slate-200 flex items-center gap-2"
            onClick={enviarCorreo}
            disabled={enviandoCorreo}
          >
            {enviandoCorreo ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Mail size={18} />
            )}
            {enviandoCorreo ? "Enviando..." : "Reenviar correo"}
          </Button>

          {codigoDisponible && (
            <Button
              variant="outline"
              className="h-12 rounded-xl border-slate-200 flex items-center gap-2"
              onClick={copiarCodigo}
            >
              <Copy size={18} />
              Copiar código
            </Button>
          )}

          <Button
            variant="outline"
            className="h-12 rounded-xl border-slate-200 flex items-center gap-2"
            onClick={copiarLink}
          >
            <Link size={18} />
            Copiar link
          </Button>
        </div>

        <button
          type="button"
          onClick={() => window.open(linkSeguimiento, "_blank")}
          className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-2"
        >
          Ver página de seguimiento
          <ExternalLink size={15} />
        </button>
      </div>
    </Card>
  );
}