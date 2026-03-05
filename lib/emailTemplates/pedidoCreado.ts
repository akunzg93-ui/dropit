export function emailPedidoCreado({ folio }: { folio: string }) {

  const trackUrl = `https://app.dropitt.net/track/${folio}`

  return `
  <div style="background:#f8fafc;padding:40px 0;font-family:Arial,Helvetica,sans-serif">

    <table align="center" width="600" style="
      background:white;
      border-radius:14px;
      padding:40px;
      border:1px solid #e2e8f0;
      box-shadow:0 4px 20px rgba(0,0,0,0.04);
    ">

      <tr>
        <td align="center">

          <img 
            src="https://app.dropitt.net/brand/logo-dropit.png"
            width="120"
            style="margin-bottom:20px"
          />

          <h2 style="
            color:#0f172a;
            margin-bottom:10px;
            font-size:22px;
          ">
            Tu pedido está listo
          </h2>

          <p style="
            color:#64748b;
            font-size:14px;
            margin-bottom:30px;
          ">
            Un vendedor creó un pedido para ti en Dropit.
          </p>

        </td>
      </tr>

      <tr>
        <td>

          <table width="100%" style="
            background:#f8fafc;
            border-radius:10px;
            padding:20px;
            border:1px solid #e2e8f0;
          ">

            <tr>
              <td style="font-size:13px;color:#64748b">
                Folio del pedido
              </td>
            </tr>

            <tr>
              <td style="
                font-size:18px;
                font-weight:600;
                color:#0f172a;
                padding-top:4px;
              ">
                ${folio}
              </td>
            </tr>

            <tr>
              <td style="
                padding-top:18px;
                font-size:13px;
                color:#64748b;
              ">
                Código de entrega
              </td>
            </tr>

            <tr>
              <td style="
                font-size:14px;
                color:#f59e0b;
                font-weight:500;
                padding-top:4px;
              ">
                Se generará cuando el establecimiento confirme el pedido
              </td>
            </tr>

          </table>

        </td>
      </tr>

      <tr>
        <td align="center" style="padding-top:30px">

          <a
            href="${trackUrl}"
            style="
            background:#2563eb;
            color:white;
            text-decoration:none;
            padding:14px 26px;
            border-radius:8px;
            font-weight:600;
            display:inline-block;
            font-size:14px;
            "
          >
            Ver seguimiento
          </a>

        </td>
      </tr>

      <tr>
        <td align="center" style="
          padding-top:25px;
          font-size:12px;
          color:#94a3b8;
          line-height:18px;
        ">

          Podrás ver el establecimiento asignado y el código de entrega
          cuando el pedido sea confirmado.

        </td>
      </tr>

      <tr>
        <td align="center" style="
          padding-top:25px;
          font-size:11px;
          color:#cbd5f5;
        ">

          © ${new Date().getFullYear()} Dropit

        </td>
      </tr>

    </table>

  </div>
  `
}