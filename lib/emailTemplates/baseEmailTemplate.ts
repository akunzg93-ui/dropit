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
  }
> = {
  informativo: {
    inicio: "#2563eb",
    fin: "#1e40af",
    principal: "#1e40af",
    fondoSuave: "#eef2ff",
  },

  cancelacion: {
    inicio: "#dc2626",
    fin: "#991b1b",
    principal: "#b91c1c",
    fondoSuave: "#fef2f2",
  },

  pendiente: {
    inicio: "#f97316",
    fin: "#c2410c",
    principal: "#c2410c",
    fondoSuave: "#fff7ed",
  },

  custodia_vencida: {
    inicio: "#64748b",
    fin: "#334155",
    principal: "#475569",
    fondoSuave: "#f1f5f9",
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
    <div style="
      margin:0;
      padding:40px 16px;
      background:#f4f6f8;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
      color:#111827;
    ">
      <div style="
        max-width:560px;
        margin:0 auto;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        border:1px solid #e5e7eb;
        box-shadow:0 12px 32px rgba(15,23,42,0.08);
      ">
      <div style="
  padding:24px 28px;
  background:linear-gradient(
    135deg,
    ${color.inicio},
    ${color.fin}
  );
">
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="border-collapse:collapse;"
  >
    <tr>
      <td
        valign="middle"
        style="
          text-align:left;
          padding-right:18px;
        "
      >
        <h1 style="
          margin:0;
          color:#ffffff;
          font-size:22px;
          line-height:30px;
          font-weight:700;
        ">
          ${titulo}
        </h1>

        ${
          subtitulo
            ? `
              <p style="
                margin:6px 0 0;
                color:#ffffff;
                font-size:14px;
                line-height:20px;
                opacity:0.92;
              ">
                ${subtitulo}
              </p>
            `
            : ""
        }
      </td>

      <td
        width="78"
        valign="middle"
        align="right"
        style="
          width:78px;
          text-align:right;
        "
      >
        <img
          src="https://dropitt.net/brand/logo-dropit-email.png"
          alt="Dropit"
          width="68"
          style="
            display:block;
            width:68px;
            max-width:68px;
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
</div>

        <div style="padding:28px;">
          ${contenido}
        </div>

        <div style="
          padding:18px 28px;
          background:#f9fafb;
          border-top:1px solid #e5e7eb;
          text-align:center;
          font-size:12px;
          line-height:18px;
          color:#6b7280;
        ">
          ${footer}

          <br />

          <span style="color:#9ca3af;">
            © ${new Date().getFullYear()} Dropit
          </span>
        </div>
      </div>
    </div>
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
        vertical-align:top;
      ">
        ${etiqueta}
      </td>

      <td style="
        padding:5px 0;
        color:#111827;
        font-size:14px;
        font-weight:500;
        text-align:right;
        vertical-align:top;
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
      text-align:center;
      margin-top:28px;
    ">
      <a
        href="${url}"
        style="
          display:inline-block;
          padding:14px 26px;
          border-radius:10px;
          background:${color.principal};
          color:#ffffff;
          font-size:14px;
          font-weight:600;
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
      padding:16px;
      border-radius:12px;
      background:${color.fondoSuave};
      border:1px solid ${color.principal}33;
      color:${color.principal};
      font-size:14px;
      line-height:21px;
    ">
      ${texto}
    </div>
  `;
}