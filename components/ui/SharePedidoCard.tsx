"use client";

import { useState } from "react";
import {
  Copy,
  Mail,
  MessageCircle,
  Link,
  ExternalLink,
  Loader2,
} from "lucide-react";
import FlowGuideModal from "@/components/ui/FlowGuideModal";

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

  async function copiarFolio() {
    await navigator.clipboard.writeText(folio);
    mostrarFeedback("Folio copiado");
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

  if (!visible) return null;

  return (
    <FlowGuideModal
      title="¡Pedido creado correctamente!"
      subtitle="Tu cliente ya puede iniciar el proceso. Solo comparte el folio y listo 🚀"
      heroLabel="Folio del pedido"
      heroValue={folio}
      feedback={feedback}
      onClose={() => setVisible(false)}
      onCopyHeroValue={copiarFolio}
      tip="Guarda este folio. Es la llave para consultar el estado del pedido cuando quieras."
      steps={[
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
      ]}
      actions={[
        {
          label: "WhatsApp",
          icon: <MessageCircle size={19} />,
          onClick: abrirWhatsApp,
          variant: "success",
        },
        {
          label: enviandoCorreo ? "Enviando..." : "Enviar correo",
          icon: enviandoCorreo ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Mail size={18} />
          ),
          onClick: enviarCorreo,
          disabled: enviandoCorreo,
          variant: "outline",
        },
        {
          label: "Copiar link",
          icon: <Link size={18} />,
          onClick: copiarLink,
          variant: "outline",
        },
        {
          label: "Ver seguimiento",
          icon: <ExternalLink size={18} />,
          onClick: () => window.open(linkSeguimiento, "_blank"),
          variant: "primary",
        },
      ]}
    />
  );
}