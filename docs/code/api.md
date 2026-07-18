# API Routes

> Documento Oficial  
> Versión: 1.1  
> Estado: En construcción  
> Última actualización: 18/07/2026

---

# Organización actual

Las rutas permanecen bajo `app/api/orders/` por estabilidad. No se reorganizan sin RFC.

# Rutas principales por dominio

## Flujo

- `aceptar-establecimiento`
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
