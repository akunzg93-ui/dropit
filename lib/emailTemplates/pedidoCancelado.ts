import {
  baseEmailTemplate,
  emailButton,
  emailNotice,
} from "./baseEmailTemplate";

export function emailPedidoCancelado({
  folio,
}: {
  folio: string;
}) {
  const link = `https://app.dropitt.net/track/${folio}`;

  const contenido = `
    <div style="
      background:#fef2f2;
      border:1px solid #fecaca;
      border-radius:14px;
      padding:22px 18px;
      text-align:center;
    ">
      <div style="
        margin:0;
        color:#dc2626;
        font-size:12px;
        line-height:18px;
        font-weight:700;
        letter-spacing:2px;
      ">
        FOLIO DEL PEDIDO
      </div>

      <div
        class="mobile-folio"
        style="
          margin-top:10px;
          color:#991b1b;
          font-size:34px;
          line-height:42px;
          font-weight:800;
          letter-spacing:1px;
          word-break:break-word;
        "
      >
        ${folio}
      </div>
    </div>

    <div style="
      margin-top:24px;
      padding:20px;
      background:#fcfcfd;
      border:1px solid #eceff3;
      border-radius:14px;
      color:#475569;
      font-size:14px;
      line-height:22px;
    ">
      <p style="margin:0;">
        El pedido fue cancelado por el vendedor debido a una solicitud del cliente.
      </p>

      <p style="margin:14px 0 0;">
        El paquete ya no continuará hacia el establecimiento y no estará disponible para recolección.
      </p>

      <p style="
        margin:14px 0 0;
        color:#111827;
        font-weight:600;
      ">
        No necesitas realizar ninguna acción adicional.
      </p>
    </div>

    ${emailNotice({
      tipo: "informativo",
      texto:
        "Para cualquier aclaración sobre el producto o el pago, contacta directamente al vendedor.",
    })}

    ${emailButton({
      texto: "Ver seguimiento",
      url: link,
      tipo: "cancelacion",
    })}
  `;

  return baseEmailTemplate({
    tipo: "cancelacion",
    titulo: "Pedido cancelado",
    subtitulo:
      "El vendedor confirmó la cancelación solicitada para este pedido.",
    contenido,
    footer: "Logística fácil y sin dramas.",
  });
}