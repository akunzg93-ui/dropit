# Base de Datos de Dropit

> Documento Oficial  
> Versión: 1.0  
> Estado: Oficial  
> Última actualización: 08/07/2026

---

# Objetivo

Este documento describe el modelo de datos oficial de Dropit.

La base de datos debe soportar:

- Usuarios y roles.
- Establecimientos.
- Pedidos.
- Estados del flujo.
- Códigos de seguridad.
- Eventos de tracking.
- Coins.
- Historial de movimientos.

---

# Principios

La base de datos de Dropit sigue estos principios:

- La información crítica debe persistirse.
- El flujo del pedido debe ser auditable.
- Las relaciones deben ser explícitas.
- La lógica sensible debe validarse desde servidor o RPC.
- No se deben cambiar tipos de IDs en tablas estables sin RFC.

---

# Tablas principales

| Tabla | Responsabilidad |
|------|------------------|
| profiles | Perfil y rol del usuario |
| establecimientos | Puntos de entrega registrados |
| pedidos | Entidad principal del flujo |
| pedido_establecimientos | Establecimientos candidatos por pedido |
| pedido_eventos | Historial del pedido |
| coin_lotes | Lotes de coins compradas o asignadas |
| coin_movimientos | Historial de compra y consumo de coins |

---

# profiles

Guarda información extendida del usuario autenticado.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | uuid | ID del usuario en Supabase Auth |
| role | text | Rol del usuario |
| debug | boolean | Bandera auxiliar de pruebas |

## Roles oficiales

- buyer
- vendor
- establishment
- admin

---

# establecimientos

Representa un punto físico donde pueden recibirse y entregarse paquetes.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | bigint | Identificador del establecimiento |
| usuario_id | uuid | Usuario dueño del establecimiento |
| nombre | text | Nombre del establecimiento |
| direccion | text | Dirección |
| cp | text | Código postal |
| horario | text | Horario visible |
| lat | numeric | Latitud |
| lng | numeric | Longitud |
| capacidad_small | integer | Capacidad para pedidos small |
| capacidad_medium | integer | Capacidad para pedidos medium |
| activo | boolean | Indica si participa en la red |
| zona | text | Zona manual de operación |
| created_at | timestamp | Fecha de creación |

---

# pedidos

Entidad central del sistema.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | bigint | Identificador del pedido |
| vendedor_id | uuid | Usuario vendedor |
| comprador_id | uuid | Usuario cliente, puede ser null |
| email_comprador | text | Correo del cliente |
| producto | text | Descripción del producto |
| tamano | text | small o medium |
| estado | text | Estado actual del pedido |
| folio | text | Folio público del pedido |
| codigo_vendedor | text | Código para recepción en establecimiento |
| codigo_entrega | text | Código para entrega al cliente |
| establecimiento_id | bigint | Establecimiento final elegido |
| correo_vendedor_enviado | boolean | Evita duplicar correo al vendedor |
| correo_comprador_enviado | boolean | Evita duplicar correo al cliente |
| recibido_en | timestamp | Fecha de recepción en establecimiento |

---

# Estados oficiales de pedido

| Estado |
|--------|
| creado |
| validando_establecimiento |
| en_transito |
| pendiente_recoleccion |
| entregado |

Estados futuros como `cancelado`, `expirado` o `devuelto` requieren RFC.

---

# pedido_establecimientos

Relaciona un pedido con los establecimientos candidatos seleccionados por el vendedor.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | uuid | Identificador |
| pedido_id | bigint | Pedido relacionado |
| establecimiento_id | bigint | Establecimiento candidato |
| created_at | timestamp | Fecha de creación |

---

# pedido_eventos

Registra el historial del pedido.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | uuid | Identificador |
| pedido_id | bigint | Pedido relacionado |
| estado | text | Estado alcanzado |
| descripcion | text | Descripción del evento |
| created_at | timestamp | Fecha del evento |

---

# coin_lotes

Representa lotes de coins disponibles por usuario.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | uuid | Identificador |
| user_id | uuid | Usuario dueño |
| tipo | text | small o medium |
| cantidad | integer | Coins compradas/asignadas |
| cantidad_disponible | integer | Coins restantes |
| fecha_expiracion | timestamp | Fecha de expiración |
| created_at | timestamp | Fecha de creación |

---

# coin_movimientos

Historial de movimientos de coins.

## Columnas principales

| Columna | Tipo | Descripción |
|--------|------|-------------|
| id | uuid | Identificador |
| user_id | uuid | Usuario |
| tipo | text | compra o consumo |
| coin_tipo | text | small o medium |
| cantidad | integer | Cantidad movida |
| lote_id | uuid | Lote relacionado |
| referencia | text | Referencia del movimiento |
| created_at | timestamp | Fecha del movimiento |

---

# Reglas de integridad

- `pedidos.establecimiento_id` guarda el establecimiento final.
- `pedido_establecimientos` guarda candidatos posibles.
- `pedido_eventos` es la fuente del tracking.
- `coin_lotes` guarda disponibilidad.
- `coin_movimientos` guarda historial.
- Los IDs de `pedidos` y `establecimientos` se mantienen como `bigint`.

---

# Seguridad

La base utiliza RLS.

Las operaciones sensibles se ejecutan desde API Routes con Service Role o mediante RPC controladas.

El frontend no debe modificar directamente reglas críticas del flujo.

---

# Funciones y RPC

## consume_coin_for_order

Consume una coin del vendedor usando FIFO.

Parámetros:

- `p_user_id`
- `p_tamano`

Responsabilidades:

- Buscar el lote más antiguo disponible.
- Descontar una coin.
- Registrar el movimiento.
- Rechazar la operación si no hay disponibilidad.

---

# Decisiones importantes

## IDs bigint

Los IDs de `pedidos` y `establecimientos` permanecen como `bigint`.

No deben migrarse a `uuid` sin RFC, porque un intento previo rompió flujos existentes.

## Coins

Una coin se consume al crear el pedido.

Si el pedido se cancela en el futuro, la devolución de coins deberá definirse mediante RFC.

---

# Evoluciones futuras

Pendiente diseñar:

- Cancelaciones.
- Expiraciones.
- Devoluciones.
- Reposición automática de capacidad.
- Auditoría ampliada.
- Promociones administrables.