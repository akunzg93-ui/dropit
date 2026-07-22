import {
  baseEmailTemplate,
  emailButton,
} from "./baseEmailTemplate";

export function emailPedidoCanceladoAutomatico({
  folio,
  destinatario,
}: {
  folio: string;
  destinatario: "cliente" | "vendedor";
}) {
  const link = `https://app.dropitt.net/track/${folio}`;

  const esVendedor = destinatario === "vendedor";

  const contenido = `
    <div style="
      background:#fef2f2;
      border:1px solid #fecaca;
      border-radius:14px;
      padding:22px 18px;
      text-align:center;
    ">
      <div style="
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

      ${
        esVendedor
          ? `
          <p style="margin:0;">
            El establecimiento aceptó el pedido, pero el paquete no fue entregado dentro del plazo máximo de <strong>24 horas</strong>.
          </p>

          <p style="margin:14px 0 0;">
            Para mantener la disponibilidad del establecimiento, el pedido fue cancelado automáticamente.
          </p>

          <p style="margin:14px 0 0;">
            <strong>La Coin utilizada fue reintegrada automáticamente a tu cuenta.</strong>
          </p>
        `
          : `
          <p style="margin:0;">
            El vendedor no entregó el paquete al establecimiento dentro del plazo máximo de <strong>24 horas</strong>.
          </p>

          <p style="margin:14px 0 0;">
            Por este motivo el pedido fue cancelado automáticamente y ya no continuará su proceso.
          </p>

          <p style="margin:14px 0 0;">
            El paquete no estará disponible para recolección.
          </p>
        `
      }

      <p style="
        margin:16px 0 0;
        color:#111827;
        font-weight:600;
      ">
        No necesitas realizar ninguna acción adicional.
      </p>

    </div>

    ${emailButton({
      texto: "Ver seguimiento",
      url: link,
      tipo: "cancelacion",
    })}
  `;

  return baseEmailTemplate({
    tipo: "cancelacion",
    titulo: "Pedido cancelado automáticamente",
    subtitulo: esVendedor
      ? "El plazo para entregar el paquete al establecimiento terminó."
      : "El vendedor no entregó el paquete dentro del plazo establecido.",
    contenido,
    footer: esVendedor
      ? "Puedes crear un nuevo pedido cuando lo desees."
      : "Gracias por confiar en Dropit.",
  });
}