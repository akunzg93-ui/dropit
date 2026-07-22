import {
  baseEmailTemplate,
  emailButton,
  emailNotice,
} from "./baseEmailTemplate";

export function emailRechazoEstablecimiento({
  folio,
}: {
  folio: string;
}) {
  const link = `https://app.dropitt.net/track/${folio}`;

  const contenido = `
    <div style="
      background:#eef2ff;
      border:1px solid #c7d2fe;
      border-radius:14px;
      padding:22px 18px;
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

    <h2
      class="mobile-section-title"
      style="
        margin:28px 0 0;
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
        margin-top:22px;
        border-collapse:collapse;
        table-layout:fixed;
      "
    >
      <tr>
        <td
          class="mobile-step"
          width="50%"
          valign="top"
          align="center"
          style="
            padding:0 8px 18px;
            text-align:center;
          "
        >
          <div style="font-size:34px;line-height:42px;">
            🏪
          </div>

          <div style="
            margin-top:8px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            Elige otro establecimiento
          </div>

          <div style="
            margin-top:6px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            Selecciona un nuevo punto disponible para continuar.
          </div>
        </td>

        <td
          class="mobile-step"
          width="50%"
          valign="top"
          align="center"
          style="
            padding:0 8px 18px;
            text-align:center;
          "
        >
          <div style="font-size:34px;line-height:42px;">
            📦
          </div>

          <div style="
            margin-top:8px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            Tu pedido sigue activo
          </div>

          <div style="
            margin-top:6px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            No necesitas crear un nuevo pedido.
          </div>
        </td>
      </tr>

      <tr>
        <td
          class="mobile-step"
          width="50%"
          valign="top"
          align="center"
          style="
            padding:0 8px;
            text-align:center;
          "
        >
          <div style="font-size:34px;line-height:42px;">
            📧
          </div>

          <div style="
            margin-top:8px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            Te avisaremos
          </div>

          <div style="
            margin-top:6px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            Recibirás una notificación cuando el nuevo establecimiento acepte.
          </div>
        </td>

        <td
          class="mobile-step"
          width="50%"
          valign="top"
          align="center"
          style="
            padding:0 8px;
            text-align:center;
          "
        >
          <div style="font-size:34px;line-height:42px;">
            📲
          </div>

          <div style="
            margin-top:8px;
            color:#1e3a8a;
            font-size:14px;
            line-height:20px;
            font-weight:700;
          ">
            Consulta el avance
          </div>

          <div style="
            margin-top:6px;
            color:#64748b;
            font-size:12px;
            line-height:18px;
          ">
            Puedes seguir el estado del pedido usando tu folio.
          </div>
        </td>
      </tr>
    </table>

    ${emailNotice({
      tipo: "informativo",
      texto:
        "💡 <strong>Tip:</strong> Cambiar el establecimiento toma menos de un minuto y el proceso continuará normalmente.",
    })}

    ${emailButton({
      texto: "Elegir otro establecimiento",
      url: link,
      tipo: "informativo",
    })}
  `;

  return baseEmailTemplate({
    tipo: "informativo",
    titulo: "Tu pedido sigue activo 👍",
    subtitulo:
      "El establecimiento seleccionado no pudo recibir tu paquete. Elige otro punto de entrega para continuar.",
    contenido,
    footer:
      "Tu pedido sigue activo y no necesitas crear uno nuevo.",
  });
}