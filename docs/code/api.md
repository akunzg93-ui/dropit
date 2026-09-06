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

# Retiros

> Actualización: 06/09/2026

## `POST /api/orders/retiros/solicitar`

Entrada: `{ balance_movimiento_ids: number[] }`. Requiere Bearer token. La API autentica al usuario y delega la operación financiera a `crear_retiro_desde_movimientos`. El RPC bloquea los movimientos seleccionados, valida propiedad, mes cerrado en `America/Mexico_City`, estados y ausencia de otra solicitud activa; calcula el total y crea `retiros`, `retiro_aplicaciones` y `retiro_detalles` atómicamente.

## `POST /api/orders/retiros/update`

Requiere Bearer token. La API autentica al usuario y delega a `actualizar_retiro_admin`, que exige `profiles.role = admin`. Transiciones válidas: `pending → approved`, `pending → reversed`, `approved → paid`. En pago se bloquean y actualizan exactamente los movimientos de `retiro_aplicaciones` junto con la cabecera del retiro en una sola transacción.

## `GET /api/orders/retiros/admin`

Lectura administrativa de solicitudes y detalle financiero. Requiere Bearer token y `profiles.role = admin`. La consulta se ejecuta server-side con Service Role después de validar al administrador, evitando abrir al navegador una política RLS amplia sobre `balance_movimientos`.

## Atomicidad

La creación y las transiciones críticas ya no usan secuencias de inserts/updates con limpieza compensatoria. Las RPC usan locks `FOR UPDATE` y semántica transaccional de PostgreSQL para impedir doble selección concurrente y estados parciales.
