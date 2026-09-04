# Billing - Conciliación y retiros

> Última actualización: 04/09/2026

## Modelo vigente

`balance_movimientos` es la fuente financiera operativa. `settlements` permanece como estructura histórica y no se utiliza para nueva lógica.

Cuando el establecimiento recibe el paquete se registra una línea financiera con el valor real del servicio, comisión, IVA de comisión y neto del establecimiento. La validación fiscal y la disponibilidad económica permanecen desacopladas.

## Cierre mensual y derecho de retiro

El cierre del mes habilita el derecho a solicitar retiro de los movimientos de ese periodo. La zona horaria oficial es `America/Mexico_City`. El establecimiento no está obligado a retirar el mes completo: puede elegir servicios individuales, combinar meses cerrados y combinar varios establecimientos de su cuenta en una sola solicitud.

El saldo ganado no expira. Los movimientos del mes corriente se muestran como generación del próximo cierre, pero no son elegibles todavía.

## Construcción de la solicitud

El establecimiento selecciona `balance_movimientos`; no captura un monto. El backend valida la propiedad y elegibilidad y calcula el total.

- `retiros`: cabecera global de la solicitud.
- `retiro_aplicaciones`: movimientos exactos seleccionados y `monto_aplicado` como snapshot.
- `retiro_detalles`: subtotal por establecimiento.

Un movimiento incluido en un retiro `pending` o `approved` no puede estar en otra solicitud activa. Un retiro `reversed` conserva el historial y vuelve a liberar sus movimientos.

## Administración y pago

Estados permitidos:

`pending → approved → paid`

`pending → reversed`

Al pagar, sólo se marcan `paid` los movimientos incluidos en `retiro_aplicaciones`. No se usa FIFO, no se hacen pagos parciales de un movimiento y no se crean líneas de sobrante.

## Regla documental

Si una operación requiere CFDI del establecimiento, la validación fiscal sigue siendo un control separado del estado financiero. Un CFDI válido no cambia automáticamente `balance_movimientos.status`. La conciliación fiscal definitiva y las reglas de bloqueo/reembolso siguen sujetas al flujo Billing y a validación fiscal.

## Estado técnico

El flujo funcional fue validado en QA con solicitud multi-establecimiento, pago exacto de los movimientos seleccionados y rechazo con liberación posterior. Antes de Producción queda pendiente endurecer la creación y el pago con transacciones/RPC atómicas para proteger concurrencia y fallos parciales.
