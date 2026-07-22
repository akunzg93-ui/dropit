import {
  baseEmailTemplate,
  emailButton,
  emailNotice,
} from "./baseEmailTemplate";

export function emailPedidoCreado({ folio }: { folio: string }) {
  const trackUrl =
    `https://app.dropitt.net/comprador/validar-pedido?folio=${folio}`;

  const contenido = `
    <p style="
      margin:0 0 22px;
      color:#4b5563;
      font-size:14px;
      line-height:22px;
    ">
      Un vendedor creó un pedido para ti en Dropit.
      Valida el pedido y selecciona el establecimiento donde deseas recibirlo.
    </p>

    <div style="
      padding:20px 18px;
      background-color:#eef2ff;
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
      height:1px;
      margin:24px 0;
      background-color:#e5e7eb;
    "></div>

    ${emailNotice({
      tipo: "pendiente",
      texto:
        "El código de entrega se generará cuando el establecimiento reciba y confirme el pedido.",
    })}

    ${emailButton({
      texto: "Validar pedido",
      url: trackUrl,
      tipo: "informativo",
    })}
  `;

  return baseEmailTemplate({
    tipo: "informativo",
    titulo: "📦 Tu pedido fue creado",
    subtitulo: "Selecciona el punto donde deseas recibirlo",
    contenido,
    footer:
      "Después de validar el pedido podrás consultar su seguimiento.",
  });
}