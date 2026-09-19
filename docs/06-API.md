# APIs Oficiales de Dropit

> Documento Oficial  
> Versión: 1.2  
> Estado: Oficial  
> Última actualización: 18/09/2026

---

# Principios

- Las APIs implementan reglas de negocio.
- Nunca confían únicamente en datos enviados por el cliente web.
- Las operaciones críticas validan estado, actor y códigos.
- Los jobs automáticos se protegen con `CRON_SECRET`.
- Las rutas estables permanecen bajo `app/api/orders/*` hasta un refactor planificado.

---

# Flujo principal

| Ruta | Responsabilidad |
|---|---|
| `POST /api/orders/aceptar-establecimiento` | Aceptar el punto y pasar a `en_transito` |
| `POST /api/orders/rechazar-establecimiento` | Rechazar la solicitud |
| `POST /api/orders/recibido` | Confirmar recepción física |
| `POST /api/orders/entregado` | Confirmar entrega al cliente |
| `POST /api/orders/notificar-vendedor` | Enviar código e instrucciones al vendedor |

Las rutas históricas estables no se mueven sólo por organización.

---

## Recepción física

`POST /api/orders/recibido` requiere Bearer token.

El servidor autentica al usuario con Supabase Auth y valida que sea propietario del `establecimiento_uuid` asignado al pedido.

Antes de modificar el pedido obtiene el valor real del servicio mediante `getOrderServiceValue`. Después delega la operación crítica a `recibir_pedido_con_balance`, que crea el balance y registra la recepción atómicamente.

QR, Storage y correo se ejecutan después de la transacción crítica y no forman parte de la atomicidad financiera.

# Cancelaciones

## Cancelación automática

Ruta vigente documentada:

`GET /api/orders/cancelaciones/automaticas`

Responsabilidades:

- Validar `CRON_SECRET`.
- Buscar pedidos `en_transito` vencidos según `establecimiento_aceptado_at`.
- Ejecutar `cancel_order_automatic`.
- Liberar capacidad y reintegrar Coin mediante la RPC.
- Enviar correos al cliente y al vendedor.
- Devolver resumen de ejecución.

## Cancelación por vendedor

La API correspondiente ejecuta `cancel_order_by_vendor` y sólo permite estados autorizados.

---

# Devoluciones automáticas

## Inicio de devolución

`GET /api/orders/jobs/iniciar-devoluciones`

- Protegido con `CRON_SECRET`.
- Busca pedidos `pendiente_recoleccion` vencidos desde `recibido_en`.
- Ejecuta `start_order_return`.
- Registra el cambio a `devolucion_pendiente`.
- Envía notificaciones al cliente y al vendedor.

## Custodia vencida

`GET /api/orders/jobs/custodia-vencida`

- Protegido con `CRON_SECRET`.
- Busca devoluciones vencidas desde `devolucion_iniciada_at`.
- Ejecuta `expire_order_return_custody`.
- Cambia el estado a `custodia_vencida`.
- Notifica al vendedor.

## Devolución física al vendedor

La acción del establecimiento ejecuta `complete_order_return` después de validar el código de devolución.

---

# Pagos de Coins

`POST /api/orders/payments/create-intent` autentica al vendedor, calcula importes server-side, crea `pagos` en `pending` y genera el PaymentIntent con `pago_id` en metadata.

`POST /api/orders/stripe/webhook` verifica la firma Stripe. Para `payment_intent.succeeded` delega a `acreditar_compra_stripe`, que acredita lotes y movimientos de forma transaccional e idempotente. En desarrollo local se requiere Stripe CLI o un endpoint públicamente accesible para recibir el webhook.

# Protección

`POST /api/orders/proteccion/create-intent` exige Bearer token y vincula el PaymentIntent al `vendedor_id` autenticado mediante metadata.

`POST /api/orders/proteccion/refund` exige Bearer token, verifica propiedad del PaymentIntent y estado `succeeded`, y realiza el reembolso compensatorio con una idempotency key determinística por PaymentIntent.

La protección usa compensación y no atomicidad distribuida: si el cobro fue exitoso pero falla la creación del pedido, se reembolsa; si falla `pedido_protecciones` después de crear el pedido, se cancela por la API oficial, se reintegra la Coin y se reembolsa el pago.

# RPC críticas de pedidos

- `crear_pedido_con_coin`: ejecutable por `authenticated` y `service_role`; no por `anon`.
- `confirmar_establecimiento_pedido`: sólo `service_role`.
- `rechazar_establecimiento_pedido`: sólo `service_role`.
- `recibir_pedido_con_balance`: sólo `service_role`; registra recepción y movimiento financiero en una misma transacción.

Los permisos anteriores fueron alineados en QA y Producción durante el Go Live Audit.

# Tracking público

El frontend consulta `get_pedido_tracking` mediante Supabase RPC.

La respuesta incluye eventos y timestamps de los tres plazos. La RPC no expone información sensible innecesaria.

---

# Contrato de jobs

Todos los jobs deben:

1. Validar secreto.
2. Seleccionar sólo candidatos válidos.
3. Delegar la transición a una RPC idempotente.
4. Registrar resultado por pedido.
5. Enviar correos únicamente después de una transición exitosa.
6. Responder con resumen de revisados, actualizados y errores.


# Evaluaciones

Ruta:

POST /api/orders/evaluaciones/create

Responsabilidades:

- Validar el pedido.
- Resolver automáticamente los UUID del evaluador y del evaluado.
- Validar que la combinación de actores sea permitida.
- Evitar evaluaciones duplicadas por pedido y tipo de evaluación.
- Registrar la calificación y comentario.

---

# Retiros de establecimientos

## `GET /api/orders/retiros/datos-bancarios`

Requiere Bearer token. Devuelve la cuenta bancaria del usuario autenticado como `datos_bancarios` o `null` si todavía no existe.

## `POST /api/orders/retiros/datos-bancarios`

Requiere Bearer token. Registra o actualiza la cuenta bancaria única del titular. Valida nombre del titular, CLABE de 18 dígitos y consentimiento expreso. El servidor asigna `consentimiento_at`, `aviso_privacidad_version` y `updated_at`; el cliente no controla esos campos.

## `POST /api/orders/retiros/solicitar`

Requiere Bearer token. Recibe `{ balance_movimiento_ids: number[] }`, autentica al usuario y delega la operación a `crear_retiro_desde_movimientos`. La RPC valida propiedad, cierre mensual en `America/Mexico_City`, elegibilidad, ausencia de otro retiro activo y existencia de datos bancarios; bloquea los movimientos y crea cabecera, aplicaciones y subtotales atómicamente. La cabecera conserva un snapshot de titular, banco y CLABE. Si falta cuenta bancaria la API responde `DATOS_BANCARIOS_REQUIRED`.

## `POST /api/orders/retiros/update`

Requiere Bearer token y rol `admin`. Delega a `actualizar_retiro_admin`. Sólo permite `pending → approved`, `pending → reversed` y `approved → paid`. El pago actualiza únicamente los movimientos exactos de `retiro_aplicaciones` y la cabecera dentro de la misma transacción. Para `approved → paid`, `referencia_pago` es obligatoria; la RPC rechaza valores vacíos con `REFERENCIA_PAGO_REQUIRED`.

## `GET /api/orders/retiros/admin`

Requiere Bearer token y rol `admin`. Expone al módulo Admin el detalle de retiros mediante una consulta server-side con Service Role, incluyendo el snapshot de cuenta destino (`titular_cuenta_destino`, `banco_destino`, `clabe_destino`); no se amplía RLS de `balance_movimientos` para lectura financiera desde el navegador.
