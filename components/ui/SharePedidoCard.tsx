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
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";

export default function SharePedidoCard({ folio, codigo, correo }) {
  const [feedback, setFeedback] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [visible, setVisible] = useState(true);

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
    mostrarFeedback("Link copiado");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, folio }),
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

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-[9999] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center px-4 py-8"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[32px] border border-blue-100 shadow-2xl bg-white"
      >
        <button
          onClick={() => setVisible(false)}
          className="absolute right-5 top-5 z-20 h-11 w-11 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
        >
          <X size={22} />
        </button>

        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-8 md:p-10 text-white">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 items-center pr-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/15 border-4 border-white/40 flex items-center justify-center shadow-lg animate-pulse">
                  <CheckCircle2 size={56} className="text-white" />
                </div>

              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-[#1e3a8a]">
                  ¡Pedido creado correctamente!
                </h2>

                <p className="mt-3 text-white/90">
                  Tu cliente ya puede iniciar el proceso. Solo comparte el folio
                  y listo 🚀
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/95 border border-white/40 p-6 text-center text-blue-700 shadow-xl">
              <p className="text-sm uppercase tracking-wide font-bold">
                Folio del pedido
              </p>

              <div className="mt-2 flex items-center justify-center gap-3">
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {folio}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(folio);
                    mostrarFeedback("Folio copiado");
                  }}
                  className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-7">
          {feedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              {feedback}
            </div>
          )}

          <div>
            <h3 className="text-2xl font-extrabold text-center text-[#1e3a8a]">
              ¿Qué sigue ahora? 
            </h3>

            <div className="mt-7 grid md:grid-cols-4 gap-5">
              {[
                {
                  emoji: "📲",
                  title: "Comparte el folio",
                  text: "Envíalo por WhatsApp o correo para que tu cliente elija dónde dejar el paquete.",
                },
                {
                  emoji: "🏪",
                  title: "Tu cliente elige",
                  text: "Seleccionará el establecimiento que más le convenga.",
                },
                {
                  emoji: "📦",
                  title: "Lleva el paquete",
                  text: "Entrégalo en el establecimiento elegido por tu cliente.",
                },
                {
                  emoji: "✅",
                  title: "¡Listo!",
                  text: "El establecimiento confirmará la recepción y tu cliente recibirá la actualización.",
                },
              ].map((step) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-4xl shadow-sm">
                    {step.emoji}
                  </div>
                  <p className="mt-3 font-bold text-[#1e3a8a]">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-5 grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#2563eb] font-bold">
                Correo del cliente
              </p>
              <p className="text-sm text-slate-700 mt-1 break-all">
                {correo || "No disponible"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-blue-700 font-bold">
                Código de entrega
              </p>

              {codigoDisponible ? (
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {codigo}
                </p>
              ) : (
                <p className="text-sm text-amber-600 mt-1">
                  Se generará cuando el establecimiento confirme.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-blue-700 font-bold">
                Link de seguimiento
              </p>
              <p className="text-sm text-blue-600 mt-1 break-all">
                {linkSeguimiento}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <Button
              className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2"
              onClick={abrirWhatsApp}
            >
              <MessageCircle size={19} />
              WhatsApp
            </Button>

            <Button
              variant="outline"
              className="h-14 rounded-2xl border-blue-100 flex items-center gap-2 font-bold"
              onClick={enviarCorreo}
              disabled={enviandoCorreo}
            >
              {enviandoCorreo ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Mail size={18} />
              )}
              {enviandoCorreo ? "Enviando..." : "Enviar correo"}
            </Button>

            <Button
              variant="outline"
              className="h-14 rounded-2xl border-blue-100 flex items-center gap-2 font-bold"
              onClick={copiarLink}
            >
              <Link size={18} />
              Copiar link
            </Button>

            <Button
              variant="outline"
              className="h-14 rounded-2xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2 font-bold"
              onClick={() => window.open(linkSeguimiento, "_blank")}
            >
              <ExternalLink size={18} />
              Ver seguimiento
            </Button>
          </div>

          <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 text-center text-sm text-blue-800">
            💡 <span className="font-bold">Tip:</span> Guarda este folio. Es la
            llave para consultar el estado del pedido cuando quieras.
          </div>
        </div>
      </Card>
    </div>
  );
}