# Base de Datos de Dropit

> Documento Oficial  
> Versión: 1.1  
> Estado: Oficial  
> Última actualización: 18/07/2026

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

# Coins y cancelaciones

La Coin se consume al crear el pedido mediante FIFO.

Las cancelaciones autorizadas reintegran la Coin al lote original usando el movimiento de consumo como referencia. La función debe evitar dobles reintegros y mantener la expiración original del lote.

RPC relacionadas:

- `consume_coin_for_order`
- `restore_coin_for_cancelation`
- `cancel_order_by_vendor`
- `cancel_order_automatic`

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

# Integridad y seguridad

- `pedido_eventos` no se usa como sustituto del estado actual; ambos se complementan.
- El frontend no modifica directamente transiciones críticas.
- Las API Routes usan Service Role o RPC controladas cuando corresponde.
- RLS permanece activa.
- QA y Producción conservan bases y variables separadas.
