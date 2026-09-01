# API Routes

> Documento Oficial  
> Versión: 1.2  
> Estado: En construcción  
> Última actualización: 31/08/2026

---

# Organización actual

Las rutas permanecen bajo `app/api/orders/` por estabilidad. No se reorganizan sin RFC.

# Rutas principales por dominio

## Flujo

- `aceptar-establecimiento`
  - Requiere Bearer token y valida que el usuario autenticado sea propietario del establecimiento asignado al pedido antes de pasar a `en_transito`.
- `rechazar-establecimiento`
- `preview-vendedor`
- `recibido`
- `preview`
- `entregado`
- `notificar-vendedor`

## Cancelaciones

- `cancelaciones/automaticas`
- API de cancelación por vendedor, respaldada por `cancel_order_by_vendor`

## Jobs

### `GET /api/orders/jobs/iniciar-devoluciones`

Busca pedidos `pendiente_recoleccion` con 48 horas vencidas y ejecuta `start_order_return`.

### `GET /api/orders/jobs/custodia-vencida`

Busca pedidos `devolucion_pendiente` con 48 horas vencidas y ejecuta `expire_order_return_custody`.

### Seguridad

Los jobs validan `CRON_SECRET`, delegan la transición a RPC idempotentes y devuelven un resumen.

## Otros dominios

- Coins y movimientos
- Pagos y Stripe
- Evaluaciones y reviews
- Protección
- Retiros
- Usuarios
- Etiquetas

# Regla de mantenimiento

Las rutas estables no se mueven únicamente para mejorar la organización de carpetas.


# Billing - rutas vigentes (27/08/2026)

- `GET/POST /api/orders/billing/invoice-requests`
- `GET /api/orders/billing/establishment-invoices`
- `POST /api/orders/billing/establishment-invoices/upload`
- `POST /api/orders/billing/establishment-invoices/[id]/validate`
- `POST /api/orders/establishments/complete-onboarding`

La validación de factura no cambia el estado de `balance_movimientos`.
