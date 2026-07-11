# Sistema de Correos

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Activo
>
> Última actualización: 11/07/2026

---

# Objetivo

Centralizar el envío de correos electrónicos automáticos de Dropit.

Todas las notificaciones enviadas a vendedores, clientes y establecimientos utilizan un único servicio de correo.

---

# Proveedor

Proveedor oficial:

- Resend

Remitente:

```
Dropit <no-reply@drop-itt.com>
```

---

# Servicio

Ubicación:

```
lib/email.ts
```

Responsabilidad:

- Crear el cliente de Resend.
- Enviar correos HTML.
- Centralizar el envío de emails.

---

# Variables de entorno

```
RESEND_API_KEY
```

---

# Plantillas

Actualmente existen las siguientes plantillas:

| Plantilla | Responsabilidad |
|-----------|-----------------|
| pedidoCreado | Confirmación inicial del pedido |
| puntoEntregaConfirmado | Confirmación del punto de entrega seleccionado |
| rechazoEstablecimiento | Notificación de rechazo del establecimiento |

---

# Principios

Todo correo deberá:

- utilizar una plantilla;
- enviarse desde `lib/email.ts`;
- contener únicamente información necesaria;
- mantener la identidad visual de Dropit.

No deberán construirse correos HTML directamente dentro de las API Routes.

---

# Flujo

API Route

↓

Plantilla

↓

lib/email.ts

↓

Resend

↓

Destinatario

---

# Evolución

Las nuevas notificaciones deberán implementarse creando primero una plantilla y posteriormente integrándola al servicio de envío.