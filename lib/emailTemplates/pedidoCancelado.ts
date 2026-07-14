export function emailPedidoCancelado({
  folio,
}: {
  folio: string;
}) {
  const link = `https://app.dropitt.net/track/${folio}`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Pedido cancelado · Dropit</title>
</head>

<body style="
margin:0;
padding:40px;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
">

<table
align="center"
width="700"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:24px;
overflow:hidden;
box-shadow:0 12px 40px rgba(0,0,0,.08);
">

<tr>
<td style="
background:linear-gradient(90deg,#dc2626,#ef4444);
padding:40px;
color:white;
">

<h1 style="
margin:0;
font-size:36px;
">
Pedido cancelado
</h1>

<p style="
margin-top:14px;
font-size:18px;
line-height:28px;
opacity:.95;
">
El vendedor confirmó la cancelación solicitada para este pedido.
</p>

</td>
</tr>

<tr>
<td style="padding:35px;">

<div style="
background:#fef2f2;
border:1px solid #fecaca;
border-radius:18px;
padding:25px;
text-align:center;
">

<div style="
font-size:13px;
font-weight:bold;
letter-spacing:2px;
color:#dc2626;
">
FOLIO DEL PEDIDO
</div>

<div style="
margin-top:12px;
font-size:42px;
font-weight:800;
color:#991b1b;
">
${folio}
</div>

</div>

<div style="
margin-top:30px;
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:18px;
padding:24px;
color:#475569;
font-size:16px;
line-height:26px;
">

<p style="margin-top:0;">
El pedido fue cancelado por el vendedor debido a una solicitud del cliente.
</p>

<p>
El paquete ya no continuará hacia el establecimiento y no estará disponible
para recolección.
</p>

<p style="margin-bottom:0;">
No necesitas realizar ninguna acción adicional.
</p>

</div>

<div style="
margin-top:30px;
background:#eef5ff;
padding:18px;
border-radius:16px;
text-align:center;
color:#1e40af;
font-size:15px;
line-height:24px;
">
Para cualquier aclaración sobre el producto o el pago,
contacta directamente al vendedor.
</div>

<div style="
margin-top:35px;
text-align:center;
">

<a
href="${link}"
style="
display:inline-block;
padding:18px 34px;
background:#2563eb;
color:white;
font-weight:bold;
text-decoration:none;
border-radius:14px;
"
>
Ver seguimiento
</a>

</div>

</td>
</tr>

<tr>
<td style="
background:#f8fafc;
padding:20px;
text-align:center;
font-size:12px;
color:#64748b;
">
<strong style="color:#2563eb;">DROPIT</strong><br />
Logística fácil y sin dramas
</td>
</tr>

</table>

</body>
</html>
`;
}