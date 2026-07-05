export function emailRechazoEstablecimiento({ folio }: { folio: string }) {
  const link = `https://app.dropitt.net/track/${folio}`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Dropit</title>
</head>

<body style="margin:0;padding:40px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table align="center" width="700" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.08);">
<tr>
<td style="background:linear-gradient(90deg,#2563eb,#3b82f6);padding:40px;color:white;">
<h1 style="margin:0;font-size:34px;">Tu pedido sigue activo 👍</h1>
<p style="margin-top:14px;font-size:18px;line-height:28px;opacity:.95;">
El establecimiento seleccionado no pudo recibir tu paquete. Solo necesitamos que elijas otro punto de entrega para continuar.
</p>
</td>
</tr>

<tr>
<td style="padding:35px;">

<div style="background:#eef5ff;border-radius:18px;padding:25px;text-align:center;">
<div style="font-size:13px;font-weight:bold;letter-spacing:2px;color:#2563eb;">
FOLIO DEL PEDIDO
</div>
<div style="margin-top:12px;font-size:42px;font-weight:800;color:#1e40af;">
${folio}
</div>
</div>

<h2 style="margin-top:42px;font-size:28px;color:#1e3a8a;text-align:center;">
¿Qué sigue ahora?
</h2>

<table width="100%" style="margin-top:30px;">
<tr>
<td align="center" width="25%" style="padding:8px;">
<div style="font-size:40px;">🏪</div>
<h3 style="color:#1e3a8a;">Elige otro establecimiento</h3>
<p style="color:#64748b;">Selecciona un nuevo punto disponible para continuar.</p>
</td>

<td align="center" width="25%" style="padding:8px;">
<div style="font-size:40px;">📦</div>
<h3 style="color:#1e3a8a;">Tu pedido sigue activo</h3>
<p style="color:#64748b;">No necesitas crear un nuevo pedido.</p>
</td>

<td align="center" width="25%" style="padding:8px;">
<div style="font-size:40px;">📧</div>
<h3 style="color:#1e3a8a;">Te avisaremos</h3>
<p style="color:#64748b;">Cuando el nuevo establecimiento acepte, recibirás una notificación.</p>
</td>

<td align="center" width="25%" style="padding:8px;">
<div style="font-size:40px;">📲</div>
<h3 style="color:#1e3a8a;">Consulta el avance</h3>
<p style="color:#64748b;">Puedes seguir el estado usando tu folio.</p>
</td>
</tr>
</table>

<div style="margin-top:35px;background:#eef5ff;padding:18px;border-radius:16px;text-align:center;color:#1e40af;">
💡 <strong>Tip:</strong> Cambiar el establecimiento toma menos de un minuto y el proceso continuará normalmente.
</div>

<div style="margin-top:35px;text-align:center;">
<a href="${link}" style="display:inline-block;padding:18px 34px;background:#2563eb;color:white;font-weight:bold;text-decoration:none;border-radius:14px;">
Elegir otro establecimiento
</a>
</div>

</td>
</tr>
</table>

</body>
</html>
`;
}