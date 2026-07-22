import {
  baseEmailTemplate,
  emailButton,
  emailNotice,
} from "./baseEmailTemplate";

export function emailPuntoEntregaConfirmado({
  folio,
  establecimientoNombre,
}: {
  folio: string;
  establecimientoNombre?: string;
}) {
  const link = `https://app.dropitt.net/track/${folio}`;

  const contenido = `
    <div style="
      background:#eef2ff;
      border-radius:14px;
      padding:22px 18px;
      text-align:center;
    ">
      <div style="
        margin:0;
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

    ${
      establecimientoNombre
        ? `
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              margin-top:22px;
              border-collapse:collapse;
            "
          >
            <tr>
              <td style="
                padding:0;
                color:#6b7280;
                font-size:14px;
                line-height:21px;
                vertical-align:top;
              ">
                Establecimiento
              </td>

              <td style="
                padding:0 0 0 16px;
                color:#111827;
                font-size:14px;
                line-height:21px;
                font-weight:600;
                text-align:right;
                vertical-align:top;
                word-break:break-word;
              ">
                ${establecimientoNombre}
              </td>
            </tr>
          </table>
        `
        : ""
    }

    <div style="
      height:1px;
      margin:26px 0;
      background:#e5e7eb;
    "></div>

    <h2
      class="mobile-section-title"
      style="
        margin:0;
        color:#1e3a8a;
        font-size:22px;
        line-height:30px;
        font-weight:700;
        text-align:center;
      "
    >
      ¿Qué sigue ahora?
    </h2>

    <table
      class="mobile-block"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        margin-top:24px;
        border-collapse:collapse;
        table-layout:fixed;
      "
    >
      <tr>
        <td
          class="mobile-step"
          width="33.33%"
          valign="top"
          align="center"
          style="
            padding:0 8px;
            text-align:center;
          "
        >
          <div style="
            font-size:34px;
            line-height:42px;
          ">
            🚚
          </div>

          <div style="
            margin-top:10px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            El vendedor llevará el paquete
          </div>

          <div style="
            margin-top:8px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            Una vez aprobado por el establecimiento, el vendedor realizará la entrega.
          </div>
        </td>

        <td
          class="mobile-step"
          width="33.33%"
          valign="top"
          align="center"
          style="
            padding:0 8px;
            text-align:center;
          "
        >
          <div style="
            font-size:34px;
            line-height:42px;
          ">
            📧
          </div>

          <div style="
            margin-top:10px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            Te avisaremos
          </div>

          <div style="
            margin-top:8px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            Recibirás un correo cuando tu paquete esté listo para recoger.
          </div>
        </td>

        <td
          class="mobile-step"
          width="33.33%"
          valign="top"
          align="center"
          style="
            padding:0 8px;
            text-align:center;
          "
        >
          <div style="
            font-size:34px;
            line-height:42px;
          ">
            📲
          </div>

          <div style="
            margin-top:10px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            Sigue tu pedido
          </div>

          <div style="
            margin-top:8px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            Consulta el estado cuando quieras usando tu folio.
          </div>
        </td>
      </tr>
    </table>

    ${emailNotice({
      tipo: "informativo",
      texto:
        "💡 <strong>Tip:</strong> Guarda este folio. Lo necesitarás para consultar el estado de tu pedido.",
    })}

    ${emailButton({
      texto: "Ver seguimiento",
      url: link,
      tipo: "informativo",
    })}
  `;

  return baseEmailTemplate({
    tipo: "informativo",
    titulo: "🎉 Punto de entrega confirmado",
    subtitulo:
      "Excelente elección. Tu establecimiento ya fue registrado correctamente.",
    contenido,
    footer:
      "Te avisaremos por correo cuando tu paquete esté listo para recoger.",
  });
}