import {
  baseEmailTemplate,
  emailButton,
  emailInfoRow,
  emailNotice,
} from "./baseEmailTemplate";

export function emailPedidoCreado({ folio }: { folio: string }) {
  const trackUrl =
    `https://app.dropitt.net/comprador/validar-pedido?folio=${folio}`;

  const contenido = `
    <p style="
      margin:0 0 24px;
      color:#4b5563;
      font-size:14px;
      line-height:22px;
    ">
      Un vendedor creó un pedido para ti en Dropit.
      Valida el pedido y selecciona el establecimiento donde deseas recibirlo.
    </p>

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
    </table>

    <hr style="
      margin:24px 0;
      border:0;
      border-top:1px solid #e5e7eb;
    " />

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