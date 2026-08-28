# Billing - API Contracts

> Última actualización: 27/08/2026

Las rutas permanecen bajo `app/api/orders` conforme ADR-003.

## Solicitud del vendedor

### `POST /api/orders/billing/invoice-requests`

Body: `pedido_id`, `fiscal_profile_id`.

Valida usuario, propiedad del pedido, inicio del servicio, perfil fiscal, periodo permitido y duplicados. Crea `invoice_requests`, snapshot fiscal y factura pendiente del establecimiento.

### `GET /api/orders/billing/invoice-requests`

Consulta el estado persistente de facturación, opcionalmente por `pedido_id`.

## Establecimiento

### `GET /api/orders/billing/establishment-invoices`

Devuelve solicitudes asociadas a los establecimientos del usuario autenticado, importe esperado desde `balance_movimientos` y `pending_count` para el panel.

### `POST /api/orders/billing/establishment-invoices/upload`

Multipart: `invoice_request_id`, `xml`, `pdf`.

Valida propiedad, archivos y almacena documentos privados. Deja la factura en `procesando`.

### `POST /api/orders/billing/establishment-invoices/[id]/validate`

Ejecuta `validateEstablishmentCfdi` para la solicitud indicada. Valida operación, datos fiscales y estado fiscal PAC/SAT. Éxito: `emitida`. Error: `error` con mensaje.

## Onboarding fiscal de establecimiento

### `POST /api/orders/establishments/complete-onboarding`

Asocia un `fiscal_profile_id` al establecimiento después de verificar que ambos pertenecen al usuario autenticado.

## PAC

La integración no se invoca desde el frontend. Se ejecuta exclusivamente desde servicios de servidor.

## Seguridad

Todas las rutas sensibles deben validar sesión, propiedad del recurso y estado permitido. Los documentos se almacenan en bucket privado y las operaciones administrativas usan servidor/service role cuando corresponde.
