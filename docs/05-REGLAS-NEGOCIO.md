# Reglas de Negocio de Dropit

> Documento Oficial  
> Versión: 1.1  
> Estado: Oficial  
> Última actualización: 18/07/2026

---

# Reglas generales

## Regla 1 — Un pedido consume una Coin

Cada pedido consume exactamente una Coin del tamaño correspondiente al momento de crearse.

## Regla 2 — Consumo FIFO

Las Coins se consumen desde el lote disponible más antiguo.

## Regla 3 — Un vendedor responsable

Cada pedido pertenece a un único vendedor y este no cambia durante el flujo.

## Regla 4 — Un establecimiento final

El vendedor propone opciones y el cliente elige un único establecimiento final.

## Regla 5 — Los códigos pertenecen al pedido

Los códigos de vendedor, entrega y devolución sólo son válidos para el pedido y etapa correspondientes.

## Regla 6 — El servidor tiene la autoridad

El frontend guía la experiencia; servidor y RPC validan estados, permisos, códigos y efectos económicos.

## Regla 7 — El historial no se elimina

Toda transición importante se registra en `pedido_eventos`. El tracking se construye con ese historial y el estado actual.

## Regla 8 — Una transición no se repite

Cancelaciones, devoluciones y vencimientos deben ser idempotentes.

---

# Plazos operativos

## Regla 9 — Aprobación del establecimiento

El cliente confirma el punto de entrega y el establecimiento debe aceptar antes de que el vendedor pueda entregar físicamente el paquete.

## Regla 10 — Entrega del vendedor: 24 horas

El plazo comienza en `establecimiento_aceptado_at`.

Si el vendedor no entrega dentro de 24 horas:

- el pedido puede cancelarse automáticamente;
- se libera la capacidad;
- se reintegra la Coin al lote original;
- se registra el evento;
- se notifica al cliente y al vendedor.

## Regla 11 — Recolección del cliente: 48 horas

El plazo comienza en `recibido_en`.

Si el cliente no recoge dentro de 48 horas, el sistema inicia automáticamente la devolución al vendedor.

## Regla 12 — Recolección de devolución: 48 horas

El plazo comienza en `devolucion_iniciada_at`.

Si el vendedor no recoge dentro de 48 horas, el pedido pasa a `custodia_vencida`.

## Regla 13 — Custodia vencida

Al vencer la custodia, el establecimiento deja de estar obligado al resguardo ordinario bajo el flujo Dropit. Esto no transfiere la propiedad del paquete ni autoriza por sí mismo su venta, uso o destrucción.

---

# Cancelaciones y reintegros

## Regla 14 — Cancelación por vendedor

El vendedor puede cancelar únicamente en los estados autorizados por `cancel_order_by_vendor`.

## Regla 15 — Reintegro único

`restore_coin_for_cancelation` identifica el consumo del pedido, restaura una Coin en el lote original y evita un segundo reintegro.

---

# Tracking

## Regla 16 — Los contadores son informativos

Los timers visibles no ejecutan transiciones. Los cambios reales se realizan por APIs, RPC y jobs automáticos.

## Regla 17 — Fuente temporal

Cada contador utiliza el timestamp persistido correspondiente y no una fecha calculada localmente por el navegador.

## Regla 18 — Terminología visible

En UX se usa **cliente**, no **comprador**. Los nombres técnicos históricos de rutas o columnas pueden conservarse mientras sean estables.

---

# Reglas pendientes

Requieren diseño funcional y, cuando afecten arquitectura, ADR:

- Entrega manual por contingencia.
- Recolección por tercero autorizado.
- Política operativa posterior a `custodia_vencida`.
- Promociones administrables.
