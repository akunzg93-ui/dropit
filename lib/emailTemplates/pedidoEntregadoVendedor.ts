import { baseEmailTemplate } from "./baseEmailTemplate";

export function emailPedidoEntregadoVendedor({
  folio,
}: {
  folio: string;
}) {
  const contenido = `
    <div style="
      padding:16px;
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
      <p style="
        margin:0;
        color:#374151;
        font-size:15px;
        line-height:24px;
      ">
        Te confirmamos que el paquete fue entregado correctamente al cliente.
      </p>

      <div style="
        height:1px;
        margin:12px 0;
        background:#e5e7eb;
      "></div>

      <p style="
        margin:0;
        color:#374151;
        font-size:15px;
        line-height:24px;
      ">
        El pedido se cerró exitosamente en Dropit.
      </p>
    </div>

    <div style="
      margin-top:18px;
      padding:14px 16px;
      background:#eef2ff;
      border:1px solid #c7d2fe;
      border-radius:12px;
      color:#1e40af;
      font-size:14px;
      line-height:22px;
    ">
      ✅ Ya no se requiere ninguna acción adicional de tu parte para este pedido.
    </div>
  `;

  return baseEmailTemplate({
    tipo: "informativo",
    titulo: "📦 Pedido entregado",
    subtitulo: "El paquete fue entregado correctamente al cliente.",
    contenido,
    footer:
      "Este correo es una confirmación automática de entrega.",
  });
}