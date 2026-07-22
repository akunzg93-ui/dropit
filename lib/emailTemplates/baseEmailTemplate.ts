export type EmailColor =
  | "informativo"
  | "cancelacion"
  | "pendiente"
  | "custodia_vencida";

type BaseEmailTemplateParams = {
  tipo: EmailColor;
  titulo: string;
  subtitulo?: string;
  contenido: string;
  footer?: string;
};

const colores: Record<
  EmailColor,
  {
    inicio: string;
    fin: string;
    principal: string;
    fondoSuave: string;
    boton: string;
  }
> = {
  informativo: {
    inicio: "#2563eb",
    fin: "#1e40af",
    principal: "#1e40af",
    fondoSuave: "#eef2ff",
    boton: "#2563eb",
  },

  cancelacion: {
    inicio: "#dc2626",
    fin: "#991b1b",
    principal: "#b91c1c",
    fondoSuave: "#fef2f2",
    boton: "#dc2626",
  },

 pendiente: {
  inicio: "#ffbf8a",
  fin: "#ff9d57",
  principal: "#c2410c",
  fondoSuave: "#fff7ed",
  boton: "#f97316",
},

  custodia_vencida: {
    inicio: "#64748b",
    fin: "#334155",
    principal: "#475569",
    fondoSuave: "#f1f5f9",
    boton: "#475569",
  },
};

export function baseEmailTemplate({
  tipo,
  titulo,
  subtitulo,
  contenido,
  footer = "Este correo fue enviado automáticamente por Dropit.",
}: BaseEmailTemplateParams) {
  const color = colores[tipo];

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1"
  />

  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />

  <title>${titulo} · Dropit</title>

  <style>
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f6f8 !important;
    }

    body,
    table,
    td,
    a,
    p,
    h1,
    h2,
    h3,
    div,
    span {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
    }

    table {
      border-spacing: 0;
      border-collapse: collapse;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }

    .email-wrapper {
      width: 100%;
      background-color: #f4f6f8;
    }

    .email-container {
      width: 100%;
      max-width: 560px;
    }

    .email-header-title,
    .email-header-subtitle {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    .email-content {
      padding: 28px;
    }

    .email-footer {
      padding: 18px 28px;
    }

    .email-button {
      display: inline-block;
    }

    @media only screen and (max-width: 600px) {
      .email-wrapper-cell {
        padding: 16px 10px !important;
      }

      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .email-header {
        padding: 20px 18px !important;
      }

      .email-header-text {
        padding-right: 12px !important;
      }

      .email-header-title {
        font-size: 20px !important;
        line-height: 27px !important;
      }

      .email-header-subtitle {
        margin-top: 5px !important;
        font-size: 13px !important;
        line-height: 19px !important;
      }

    .email-logo-cell {
  width: 86px !important;
}

.email-logo {
  width: 76px !important;
  max-width: 76px !important;
}

      .email-content {
        padding: 22px 18px !important;
      }

      .email-footer {
        padding: 16px 18px !important;
      }

      .email-button {
        box-sizing: border-box !important;
        max-width: 100% !important;
        padding-left: 22px !important;
        padding-right: 22px !important;
      }

      .mobile-full-width {
        width: 100% !important;
        max-width: 100% !important;
      }

      .mobile-block,
      .mobile-block tbody,
      .mobile-block tr,
      .mobile-block td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .mobile-step {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 0 0 22px !important;
      }

      .mobile-step:last-child {
        padding-bottom: 0 !important;
      }

      .mobile-folio {
        font-size: 28px !important;
        line-height: 36px !important;
        letter-spacing: 0 !important;
        word-break: break-word !important;
      }

      .mobile-section-title {
        font-size: 20px !important;
        line-height: 28px !important;
      }
        .mobile-collection-code {
  padding:16px 18px !important;
  font-size:26px !important;
  line-height:32px !important;
  letter-spacing:4px !important;
}

.mobile-qr {
  width:150px !important;
  max-width:150px !important;
  height:auto !important;
}
    }

    [data-ogsc] .email-header-title,
    [data-ogsc] .email-header-subtitle {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    [data-ogsb] .email-wrapper,
    [data-ogsb] .email-wrapper-cell {
      background-color: #f4f6f8 !important;
    }
  </style>
</head>

<body style="
  margin:0;
  padding:0;
  width:100%;
  background-color:#f4f6f8;
">

  <table
    class="email-wrapper"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="
      width:100%;
      background-color:#f4f6f8;
    "
  >
    <tr>
      <td
        class="email-wrapper-cell"
        align="center"
        style="
          padding:40px 16px;
        "
      >
        <table
          class="email-container"
          width="560"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            width:100%;
            max-width:560px;
            background-color:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 12px 32px rgba(15,23,42,0.08);
          "
        >
          <tr>
            <td
              class="email-header"
              style="
                padding:24px 28px;
                background-color:${color.inicio};
                background-image:linear-gradient(
                  135deg,
                  ${color.inicio},
                  ${color.fin}
                );
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  width:100%;
                  border-collapse:collapse;
                "
              >
                <tr>
                  <td
                    class="email-header-text"
                    valign="middle"
                    style="
                      padding-right:18px;
                      text-align:left;
                    "
                  >
                    <h1
                      class="email-header-title"
                      style="
                        margin:0;
                        color:#ffffff !important;
                        -webkit-text-fill-color:#ffffff !important;
                        font-size:22px;
                        line-height:30px;
                        font-weight:700;
                      "
                    >
                      ${titulo}
                    </h1>

                    ${
                      subtitulo
                        ? `
                          <p
                            class="email-header-subtitle"
                            style="
                              margin:6px 0 0;
                              color:#ffffff !important;
                              -webkit-text-fill-color:#ffffff !important;
                              font-size:14px;
                              line-height:20px;
                              font-weight:400;
                            "
                          >
                            ${subtitulo}
                          </p>
                        `
                        : ""
                    }
                  </td>

                  <td
                    class="email-logo-cell"
                    width="78"
                    valign="middle"
                    align="right"
                    style="
                      width:78px;
                      text-align:right;
                    "
                  >
                    <img
                      class="email-logo"
                      src="https://app.dropitt.net/brand/logo-dropit2.png?v=2"
                      alt="Dropit"
                      width="92"
                      style="
                        display:block;
                        width:92px;
                        max-width:92px;
                        height:auto;
                        margin-left:auto;
                        border:0;
                        outline:none;
                        text-decoration:none;
                      "
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              class="email-content"
              style="
                padding:28px;
                background-color:#ffffff;
                color:#111827;
              "
            >
              ${contenido}
            </td>
          </tr>

          <tr>
            <td
              class="email-footer"
              style="
                padding:18px 28px;
                background-color:#f9fafb;
                border-top:1px solid #e5e7eb;
                text-align:center;
                color:#6b7280;
                font-size:12px;
                line-height:18px;
              "
            >
              ${footer}

              <br />

              <span style="color:#9ca3af;">
                © ${new Date().getFullYear()} Dropit
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function emailInfoRow({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return `
    <tr>
      <td style="
        padding:5px 12px 5px 0;
        color:#6b7280;
        font-size:14px;
        line-height:21px;
        vertical-align:top;
      ">
        ${etiqueta}
      </td>

      <td style="
        padding:5px 0;
        color:#111827;
        font-size:14px;
        line-height:21px;
        font-weight:500;
        text-align:right;
        vertical-align:top;
        word-break:break-word;
      ">
        ${valor}
      </td>
    </tr>
  `;
}

export function emailButton({
  texto,
  url,
  tipo = "informativo",
}: {
  texto: string;
  url: string;
  tipo?: EmailColor;
}) {
  const color = colores[tipo];

  return `
    <div style="
      margin-top:22px;
      text-align:center;
    ">
      <a
        class="email-button"
        href="${url}"
        style="
          display:inline-block;
          padding:14px 26px;
          border-radius:10px;
          background-color:${color.boton};
          color:#ffffff !important;
          -webkit-text-fill-color:#ffffff !important;
          font-size:14px;
          line-height:20px;
          font-weight:600;
          text-align:center;
          text-decoration:none;
        "
      >
        ${texto}
      </a>
    </div>
  `;
}

export function emailNotice({
  texto,
  tipo,
}: {
  texto: string;
  tipo: EmailColor;
}) {
  const color = colores[tipo];

  return `
    <div style="
      margin-top:22px;
      padding:14px 16px;
      border-radius:12px;
      background-color:${color.fondoSuave};
      border:1px solid ${color.principal}33;
      color:${color.principal};
      font-size:14px;
      line-height:21px;
    ">
      ${texto}
    </div>
  `;
}