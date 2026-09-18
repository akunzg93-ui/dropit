# Base de Datos de Dropit

> Documento Oficial  
> Versión: 1.1  
> Estado: Oficial  
> Última actualización: 04/09/2026

---

# Objetivo

Este documento describe el modelo de datos oficial de Dropit y las estructuras críticas del flujo logístico, cancelaciones, devoluciones, tracking, Coins y auditoría.

---

# Principios

- La información crítica debe persistirse.
- El flujo debe ser auditable.
- La lógica sensible se valida desde servidor o RPC.
- Los procesos automáticos deben ser idempotentes.
- Los IDs estables no se cambian sin RFC.
- Los timestamps de negocio son la fuente de los plazos operativos.

---

# Tablas principales

| Tabla | Responsabilidad |
|---|---|
| profiles | Perfil y rol |
| establecimientos | Puntos físicos de la red |
| pedidos | Entidad central y estado actual |
| pedido_establecimientos | Establecimientos candidatos |
| pedido_eventos | Historial oficial del tracking |
| coin_lotes | Saldo por lotes |
| coin_movimientos | Compra, consumo y reintegros |

---

# pedidos

Columnas relevantes del flujo:

| Columna | Tipo | Descripción |
|---|---|---|
| id | bigint | Identificador interno |
| folio | text | Identificador público |
| vendedor_id | uuid | Vendedor responsable |
| comprador_id | uuid | Campo técnico histórico del cliente; puede ser null |
| email_comprador | text | Campo técnico histórico con el correo del cliente |
| producto | text | Descripción del producto |
| tamano | text | `small` o `medium` |
| estado | text | Estado actual |
| establecimiento_uuid | uuid | Establecimiento final elegido |
| codigo_vendedor | text | Validación de recepción |
| codigo_entrega | text | Validación de entrega al cliente |
| codigo_devolucion | text | Validación de devolución al vendedor |
| created_at | timestamptz | Creación del pedido |
| establecimiento_notificado_at | timestamptz | Inicio de espera de aprobación |
| establecimiento_aceptado_at | timestamptz | Inicio del plazo de entrega del vendedor |
| recibido_en | timestamptz | Inicio del plazo de recolección del cliente |
| devolucion_iniciada_at | timestamptz | Inicio del plazo de devolución al vendedor |
| devuelto_at | timestamptz | Devolución completada |
| custodia_vencida_at | timestamptz | Fin de custodia ordinaria |

Los nombres `comprador_id` y `email_comprador` se conservan por compatibilidad técnica. En UX y documentación funcional se utiliza **cliente**.

---

# Estados oficiales

- `creado`
- `pendiente_aprobacion_establecimiento`
- `en_transito`
- `pendiente_recoleccion`
- `entregado`
- `cancelado`
- `devolucion_pendiente`
- `devuelto`
- `custodia_vencida`

`validando_establecimiento` es un término histórico y no debe usarse en nuevas implementaciones.

---

# pedido_eventos

Fuente oficial del historial público y operativo.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid o bigint según implementación estable | Identificador |
| pedido_id | bigint | Pedido relacionado |
| estado | text | Estado alcanzado |
| descripcion | text | Descripción visible del evento |
| created_at | timestamptz | Fecha del evento |

Los eventos deben conservarse y ordenarse por `created_at`.

---

# evaluaciones

La tabla `evaluaciones` almacena la reputación generada al finalizar un pedido.

| Columna | Tipo | Descripción |
|---|---|---|
| pedido_id | bigint | Pedido que originó la evaluación |
| evaluador_id | uuid | UUID del actor que realiza la evaluación. Puede ser `NULL` únicamente para evaluaciones públicas del comprador. |
| evaluado_id | uuid | UUID del usuario evaluado |
| tipo_evaluador | text | `comprador`, `vendedor` o `establecimiento` |
| tipo_evaluado | text | `vendedor` o `establecimiento` |
| rating | integer | Calificación de 1 a 5 estrellas |
| comentario | text | Comentario opcional |
| created_at | timestamptz | Fecha de registro |

## Relaciones oficiales

- Establecimiento → Vendedor
- Vendedor → Establecimiento
- Comprador → Vendedor
- Comprador → Establecimiento

Los UUID de `evaluador_id` y `evaluado_id` se resuelven exclusivamente desde el servidor utilizando la información del pedido.

# Coins y cancelaciones

La Coin se consume al crear el pedido mediante FIFO.

Las cancelaciones autorizadas reintegran la Coin al lote original usando el movimiento de consumo como referencia. La función debe evitar dobles reintegros y mantener la expiración original del lote.

RPC relacionadas:

- `consume_coin_for_order`
- `restore_coin_for_cancelation`
- `cancel_order_by_vendor`
- `cancel_order_automatic`
- `expirar_coins_vencidas`

## Expiración de Coins

Los lotes con `fecha_expiracion <= now()` no son elegibles para consumo. Adicionalmente, `expirar_coins_vencidas()` cierra cualquier saldo remanente de un lote vencido: registra en `coin_movimientos` un movimiento `expiracion` con referencia `expiracion_automatica` y actualiza `coin_lotes.cantidad_disponible` a `0`.

La función se ejecuta automáticamente mediante `pg_cron` con el job `expirar-coins-vencidas`, diariamente a las `00:10 UTC` (`10 0 * * *`). La configuración está activa tanto en QA como en Producción.

---

# RPC del flujo y tracking

## get_pedido_tracking(text)

Expone únicamente la información necesaria para el seguimiento público:

- datos generales
- estado
- establecimiento
- `created_at`
- `establecimiento_aceptado_at`
- `recibido_en`
- `devolucion_iniciada_at`
- `devuelto_at`
- `custodia_vencida_at`
- arreglo JSON de eventos con `estado`, `descripcion` y `fecha`

Se concede ejecución a `anon` y `authenticated`, manteniendo el contrato de salida controlado.

## Devoluciones

- `start_order_return`
- `complete_order_return`
- `expire_order_return_custody`

Estas funciones validan el estado actual, actualizan timestamps, registran eventos y evitan ejecuciones repetidas.

---

# Saldos y retiros de establecimientos

`balance_movimientos` es la fuente financiera operativa de los servicios prestados por los establecimientos. Cada fila corresponde a un pedido y conserva el bruto, comisión, IVA sobre comisión y neto del establecimiento.

Tablas del retiro:

| Tabla | Responsabilidad |
|---|---|
| balance_movimientos | Ledger financiero por pedido |
| retiros | Cabecera global de una solicitud de retiro |
| retiro_aplicaciones | Movimientos exactos seleccionados y snapshot de `monto_aplicado` |
| retiro_detalles | Subtotal de la solicitud por establecimiento |

Reglas de integridad:

- Un retiro nuevo puede agrupar movimientos de varios establecimientos pertenecientes al mismo usuario.
- `retiros.establecimiento_id` queda nullable para compatibilidad con retiros históricos; los retiros multi-establecimiento usan `NULL`.
- `retiros.user_id` identifica al propietario de la solicitud global.
- `retiro_aplicaciones.retiro_id` referencia `retiros.id`.
- `retiro_aplicaciones.balance_movimiento_id` referencia `balance_movimientos.id`.
- `monto_aplicado` es un snapshot inmutable del neto seleccionado al crear la solicitud.
- `retiro_detalles` no sustituye a `retiro_aplicaciones`: resume por establecimiento; las aplicaciones determinan qué movimientos se pagan.
- Al pagar no se usa FIFO ni se fraccionan movimientos. Sólo pasan a `paid` los movimientos incluidos en la solicitud.
- Un movimiento `paid` o `reversed` no es elegible para una nueva solicitud.
- Un movimiento asociado a un retiro padre `pending` o `approved` no puede volver a seleccionarse. Si el retiro padre queda `reversed`, el movimiento vuelve a ser seleccionable.

La elegibilidad temporal se determina por mes cerrado usando `America/Mexico_City`: el mes corriente no puede retirarse. El saldo ganado de meses cerrados no expira.

## RPC transaccionales de retiros

### `crear_retiro_desde_movimientos(uuid, bigint[])`

Operación atómica para crear una solicitud. Bloquea con `FOR UPDATE` los `balance_movimientos` seleccionados, valida propiedad, mes cerrado en `America/Mexico_City`, estado y ausencia de otro retiro activo; después crea `retiros`, `retiro_aplicaciones` y `retiro_detalles` dentro de la misma transacción.

### `actualizar_retiro_admin(uuid, uuid, text, text)`

Operación atómica para las transiciones administrativas `pending → approved`, `pending → reversed` y `approved → paid`. Bloquea el retiro y, al pagar, los movimientos exactos de `retiro_aplicaciones`; valida integridad monetaria y actualiza ledger y cabecera en una sola transacción.

Ambas funciones son `SECURITY DEFINER`, tienen `search_path = public` y su ejecución está revocada para `PUBLIC`, `anon` y `authenticated`; sólo `service_role` tiene `EXECUTE`.

Estado al 08/09/2026: modelo, FKs y RPC transaccionales validados en QA y Producción. En PROD se verificó el esquema existente, se agregó retiros.fecha_pago y la restricción UNIQUE (retiro_id, balance_movimiento_id) de retiro_aplicaciones. El flujo transaccional completo fue validado mediante una prueba controlada con ROLLBACK

## Reserva de capacidad

`pedido_establecimientos` representa únicamente establecimientos candidatos y no reserva capacidad al crear el pedido.

La capacidad se reserva cuando el cliente selecciona un establecimiento concreto.

La selección se realiza mediante `confirmar_establecimiento_pedido`, que de forma transaccional:

- valida que el establecimiento sea candidato;
- valida disponibilidad;
- bloquea el establecimiento para evitar sobreasignación concurrente;
- descuenta una unidad de capacidad;
- asigna el establecimiento al pedido;
- cambia el estado a `pendiente_aprobacion_establecimiento`.

Si el establecimiento rechaza el pedido, `rechazar_establecimiento_pedido` libera la reserva y devuelve el pedido a `creado`.

Las cancelaciones liberan únicamente la capacidad del establecimiento efectivamente reservado.

# Recepción atómica y balance

La recepción física del pedido se ejecuta mediante `recibir_pedido_con_balance`.

La RPC bloquea el pedido con `FOR UPDATE` y valida:

- pedido existente;
- estado `en_transito`;
- `codigo_vendedor`;
- establecimiento definitivo asignado;
- monto bruto positivo.

Dentro de una misma transacción:

- genera y guarda `codigo_entrega`;
- crea el `balance_movimientos`;
- cambia el pedido a `pendiente_recoleccion`;
- registra `recibido_en`.

Para nuevos movimientos la comisión vigente es 10% y el IVA es 16% sobre la comisión. El movimiento nace con `status = available`.

El monto bruto se obtiene antes de ejecutar la RPC mediante la trazabilidad financiera de la Coin. Si el valor del servicio no puede determinarse de forma confiable, la recepción no debe modificar el pedido.

`recibir_pedido_con_balance` es `SECURITY DEFINER` y sólo `service_role` tiene permiso de ejecución.

# Integridad y seguridad

- `pedido_eventos` no se usa como sustituto del estado actual; ambos se complementan.
- El frontend no modifica directamente transiciones críticas.
- Las API Routes usan Service Role o RPC controladas cuando corresponde.
- RLS permanece activa.
- QA y Producción conservan bases y variables separadas.
