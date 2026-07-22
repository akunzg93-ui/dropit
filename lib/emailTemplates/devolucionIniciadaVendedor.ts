import {
  baseEmailTemplate,
  emailButton,
} from "./baseEmailTemplate";

export function emailDevolucionIniciadaVendedor({
  folio,
  codigoDevolucion,
}: {
  folio: string;
  codigoDevolucion: string;
}) {
  const link = `https://app.dropitt.net/track/${folio}`;

  const contenido = `
    <div style="
      padding:16px 16px;
      background:#fff7ed;
      border:1px solid #fed7aa;
      border-radius:14px;
      text-align:center;
    ">
      <div style="
        color:#c2410c;
        font-size:12px;
        line-height:18px;
        font-weight:700;
        letter-spacing:2px;
      ">
        CÓDIGO DE DEVOLUCIÓN
      </div>

      <div
        class="mobile-collection-code"
        style="
          margin-top:10px;
          display:inline-block;
          max-width:100%;
          box-sizing:border-box;
          padding:16px 22px;
          border-radius:12px;
          background:#fff7ed;
          color:#9a3412;
          font-size:36px;
          line-height:42px;
          font-weight:800;
          letter-spacing:6px;
          word-break:break-word;
        "
      >
        ${codigoDevolucion}
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
        El proceso de devolución del pedido
        <strong>${folio}</strong>
        fue iniciado automáticamente.
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
        Tienes <strong>48 horas</strong> para acudir al establecimiento y recoger el paquete.
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
        Presenta este código al establecimiento para confirmar la entrega.
      </p>

    </div>

    <div style="
      margin-top:18px;
      padding:14px 16px;
      background:#fff7ed;
      border:1px solid #fed7aa;
      border-radius:12px;
      color:#9a3412;
      font-size:14px;
      line-height:22px;
    ">
      ⏱️ Si no recoges el paquete dentro del plazo establecido, el establecimiento podrá dejar de resguardarlo conforme a los Términos y Condiciones de Dropit.
    </div>

    ${emailButton({
      texto: "Ver seguimiento",
      url: link,
      tipo: "informativo",
    })}
  `;

  return baseEmailTemplate({
    tipo: "pendiente",
    titulo: "📦 Recoge tu devolución",
    subtitulo:
      "El cliente no recogió el paquete dentro del plazo establecido.",
    contenido,
    footer:
      "Este código se valida cuando el establecimiento entrega nuevamente el paquete al vendedor.",
  });
}