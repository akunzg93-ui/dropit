export function custodiaVencidaVendedor({
  folio,
}: {
  folio: string;
}) {
  const trackingUrl = `https://dropitt.net/track/${encodeURIComponent(folio)}`;
  const terminosUrl = "https://dropitt.net/terminos";

  return {
    subject: `Finalizó el periodo de custodia del pedido ${folio}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Custodia vencida</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background: #f3f4f6;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="padding: 32px 16px; background: #f3f4f6;"
          >
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    max-width: 600px;
                    background: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 12px 30px rgba(17, 24, 39, 0.12);
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 36px 28px;
                        background: linear-gradient(
                          135deg,
                          #111827 0%,
                          #27272a 55%,
                          #3f3f46 100%
                        );
                        color: #ffffff;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          font-size: 14px;
                          font-weight: 700;
                          letter-spacing: 2px;
                          text-transform: uppercase;
                          opacity: 0.85;
                          margin-bottom: 14px;
                        "
                      >
                        Dropit
                      </div>

                      <div style="font-size: 42px; margin-bottom: 12px;">
                        ⏳
                      </div>

                      <h1
                        style="
                          margin: 0;
                          font-size: 28px;
                          line-height: 1.25;
                        "
                      >
                        El periodo de custodia ha concluido
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 32px 28px;">
                      <p
                        style="
                          margin: 0 0 18px;
                          font-size: 16px;
                          line-height: 1.7;
                          color: #374151;
                        "
                      >
                        El plazo para recoger la devolución del pedido
                        <strong>${folio}</strong> ha finalizado.
                      </p>

                      <p
                        style="
                          margin: 0 0 24px;
                          font-size: 16px;
                          line-height: 1.7;
                          color: #374151;
                        "
                      >
                        El pedido cambió al estado
                        <strong>Custodia vencida</strong>.
                      </p>

                      <div
                        style="
                          padding: 20px;
                          border-radius: 16px;
                          background: #f4f4f5;
                          border: 1px solid #d4d4d8;
                          margin-bottom: 28px;
                        "
                      >
                        <div
                          style="
                            margin-bottom: 8px;
                            font-size: 16px;
                            font-weight: 700;
                            color: #18181b;
                          "
                        >
                          ¿Qué significa esto?
                        </div>

                        <p
                          style="
                            margin: 0;
                            font-size: 14px;
                            line-height: 1.65;
                            color: #52525b;
                          "
                        >
                          El establecimiento ya no está obligado a continuar
                          resguardando el paquete y podrá disponer de él
                          conforme a la legislación aplicable y a los Términos
                          y Condiciones de Dropit.
                        </p>
                      </div>

                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                      >
                        <tr>
                          <td align="center">
                            <a
                              href="${trackingUrl}"
                              style="
                                display: inline-block;
                                padding: 14px 26px;
                                border-radius: 12px;
                                background: #18181b;
                                color: #ffffff;
                                text-decoration: none;
                                font-size: 15px;
                                font-weight: 700;
                              "
                            >
                              Consultar seguimiento
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p
                        style="
                          margin: 28px 0 0;
                          padding-top: 22px;
                          border-top: 1px solid #e5e7eb;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #71717a;
                          text-align: center;
                        "
                      >
                        Para conocer el detalle del proceso de custodia,
                        devoluciones y paquetes no reclamados, consulta nuestros
                        <a
                          href="${terminosUrl}"
                          style="
                            color: #23247b;
                            font-weight: 700;
                            text-decoration: underline;
                          "
                        >
                          Términos y Condiciones
                        </a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}