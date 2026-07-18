import {
  baseEmailTemplate,
  emailInfoRow,
} from "./baseEmailTemplate";

type EmailPedidoListoParaRecogerParams = {
  folio: string;
  establecimiento: string;
  direccion: string;
  codigoEntrega: string;
  qrUrl: string;
};

export function emailPedidoListoParaRecoger({
  folio,
  establecimiento,
  direccion,
  codigoEntrega,
  qrUrl,
}: EmailPedidoListoParaRecogerParams) {
  const contenido = `
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="width:100%;border-collapse:collapse;"
    >
      ${emailInfoRow({
        etiqueta: "Pedido",
        valor: folio,
      })}

      ${emailInfoRow({
        etiqueta: "Establecimiento",
        valor: establecimiento,
      })}

      ${emailInfoRow({
        etiqueta: "Dirección",
        valor: direccion,
      })}
    </table>

    <hr style="
      margin:28px 0;
      border:0;
      border-top:1px solid #e5e7eb;
    " />

    <div style="text-align:center;">
      <p style="
        margin:0 0 12px;
        color:#6b7280;
        font-size:13px;
      ">
        Código de recolección
      </p>

      <div style="
        display:inline-block;
        padding:18px 24px;
        border-radius:12px;
        background:#eef2ff;
        color:#1e40af;
        font-size:32px;
        line-height:38px;
        font-weight:700;
        letter-spacing:6px;
      ">
        ${codigoEntrega}
      </div>

      <p style="
        margin:24px 0 14px;
        color:#374151;
        font-size:14px;
      ">
        Presenta este código o escanea el QR
      </p>

      <img
        src="${qrUrl}"
        alt="Código QR del pedido"
        width="160"
        height="160"
        style="
          display:block;
          width:160px;
          height:160px;
          margin:0 auto;
          border:8px solid #eef2ff;
          border-radius:16px;
        "
      />
    </div>
  `;

  return baseEmailTemplate({
    tipo: "informativo",
    titulo: "📦 Pedido listo para recoger",
    subtitulo: "Tu paquete ya llegó al establecimiento",
    contenido,
    footer:
      "Este código se valida al momento de la recolección.",
  });
}