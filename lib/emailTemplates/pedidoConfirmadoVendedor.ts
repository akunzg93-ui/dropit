import { baseEmailTemplate } from "./baseEmailTemplate";

type EmailPedidoConfirmadoVendedorParams = {
  folio: string;
  establecimiento: string;
  direccion: string;
  codigoVendedor: string;
  qrUrl: string;
};

export function emailPedidoConfirmadoVendedor({
  folio,
  establecimiento,
  direccion,
  codigoVendedor,
  qrUrl,
}: EmailPedidoConfirmadoVendedorParams) {
  const contenido = `
    <div style="
      padding:16px 16px;
      background:#eef2ff;
      border:1px solid #c7d2fe;
      border-radius:14px;
      text-align:center;
    ">
      <div style="
        color:#2563eb;
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
          color:#1e40af;
          font-size:30px;
          line-height:36px;
          font-weight:800;
          letter-spacing:1px;
          word-break:break-word;
        "
      >
        ${folio}
      </div>
    </div>

    <div style="
      margin-top:16px;
      padding:14px 16px;
      background:#fcfcfd;
      border:1px solid #e5e7eb;
      border-radius:14px;
    ">
      <div style="
        color:#6b7280;
        font-size:12px;
        line-height:18px;
        font-weight:700;
        letter-spacing:1px;
        text-transform:uppercase;
      ">
        Establecimiento
      </div>

      <div style="
        margin-top:5px;
        color:#111827;
        font-size:15px;
        line-height:22px;
        font-weight:700;
        word-break:break-word;
      ">
        ${establecimiento}
      </div>

      <div style="
        height:1px;
        margin:12px 0;
        background:#e5e7eb;
      "></div>

      <div style="
        color:#6b7280;
        font-size:12px;
        line-height:18px;
        font-weight:700;
        letter-spacing:1px;
        text-transform:uppercase;
      ">
        Dirección
      </div>

      <div style="
        margin-top:5px;
        color:#374151;
        font-size:14px;
        line-height:22px;
        word-break:break-word;
      ">
        ${direccion}
      </div>
    </div>

    <div style="
      height:1px;
      margin:18px 0;
      background:#e5e7eb;
    "></div>

    <div style="text-align:center;">
      <p style="
        margin:0 0 12px;
        color:#6b7280;
        font-size:13px;
        line-height:20px;
      ">
        Código para entregar en el establecimiento
      </p>

      <div
        class="mobile-collection-code"
        style="
          display:inline-block;
          max-width:100%;
          box-sizing:border-box;
          padding:16px 22px;
          border-radius:12px;
          background:#eef2ff;
          color:#1e40af;
          font-size:36px;
          line-height:42px;
          font-weight:800;
          letter-spacing:6px;
          word-break:break-word;
        "
      >
        ${codigoVendedor}
      </div>

      <p style="
        margin:14px 0 12px;
        color:#374151;
        font-size:14px;
        line-height:21px;
      ">
        Presenta este código o escanea el QR al entregar el paquete.
      </p>

      <img
        class="mobile-qr"
        src="${qrUrl}"
        alt="Código QR del pedido"
        width="220"
        height="229"
        style="
          display:block;
          width:220px;
          max-width:100%;
          height:auto;
          margin:0 auto;
          border:8px solid #eef2ff;
          border-radius:16px;
          box-sizing:border-box;
        "
      />
    </div>

    <div style="
      margin-top:18px;
      padding:14px 16px;
      background:#fff7ed;
      border:1px solid #fed7aa;
      border-radius:12px;
      color:#9a3412;
      font-size:14px;
      line-height:21px;
    ">
      ⏱️ Lleva el paquete al establecimiento dentro de las próximas
      <strong>24 horas</strong> para evitar la cancelación automática.
    </div>
  `;

  return baseEmailTemplate({
    tipo: "informativo",
    titulo: "📦 Pedido confirmado",
    subtitulo: "Lleva tu paquete al establecimiento seleccionado",
    contenido,
    footer:
      "Este código se valida cuando el establecimiento recibe el paquete.",
  });
}