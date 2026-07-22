import {
  baseEmailTemplate,
  emailButton,
} from "./baseEmailTemplate";

export function custodiaVencidaVendedor({
  folio,
}: {
  folio: string;
}) {
  const trackingUrl = `https://dropitt.net/track/${encodeURIComponent(folio)}`;
  const terminosUrl = "https://dropitt.net/terminos";

  const contenido = `
    <div style="
      padding:16px;
      background:#f1f5f9;
      border:1px solid #cbd5e1;
      border-radius:14px;
      text-align:center;
    ">
      <div style="
        color:#475569;
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
          color:#334155;
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
        El plazo para recoger la devolución del pedido ha finalizado.
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
        El pedido cambió al estado
        <strong>Custodia vencida</strong>.
      </p>
    </div>

    <div style="
      margin-top:18px;
      padding:14px 16px;
      background:#f1f5f9;
      border:1px solid #cbd5e1;
      border-radius:12px;
      color:#475569;
      font-size:14px;
      line-height:22px;
    ">
      <strong style="
        display:block;
        margin-bottom:6px;
        color:#334155;
      ">
        ¿Qué significa esto?
      </strong>

      El establecimiento ya no está obligado a continuar resguardando el
      paquete y podrá disponer de él conforme a la legislación aplicable y
      a los Términos y Condiciones de Dropit.
    </div>

    ${emailButton({
      texto: "Consultar seguimiento",
      url: trackingUrl,
      tipo: "custodia_vencida",
    })}

    <p style="
      margin:20px 0 0;
      padding-top:18px;
      border-top:1px solid #e5e7eb;
      color:#6b7280;
      font-size:12px;
      line-height:19px;
      text-align:center;
    ">
      Consulta el detalle del proceso de custodia, devoluciones y paquetes
      no reclamados en nuestros
      <a
        href="${terminosUrl}"
        style="
          color:#23247b;
          font-weight:700;
          text-decoration:underline;
        "
      >
        Términos y Condiciones
      </a>.
    </p>
  `;

  return {
    subject: `Finalizó el periodo de custodia del pedido ${folio}`,
    html: baseEmailTemplate({
      tipo: "custodia_vencida",
      titulo: "⏳ Custodia vencida",
      subtitulo:
        "El periodo de resguardo de la devolución ha concluido.",
      contenido,
      footer:
        "Este correo fue enviado automáticamente por Dropit.",
    }),
  };
}