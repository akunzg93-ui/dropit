# Billing - Conciliación y retiros

> Última actualización: 19/09/2026

## Modelo vigente

`balance_movimientos` es la fuente financiera operativa. `settlements` permanece como estructura histórica y no se utiliza para nueva lógica.

Cuando el establecimiento recibe el paquete se registra una línea financiera con el valor real del servicio, comisión, IVA de comisión y neto del establecimiento. La validación fiscal y la disponibilidad económica permanecen desacopladas.

La creación del movimiento financiero y la transición del pedido a `pendiente_recoleccion` son atómicas mediante `recibir_pedido_con_balance`. Si el movimiento financiero no puede crearse, la recepción hace rollback.

El bruto corresponde al valor económico trazable del servicio. Para nuevos movimientos la comisión vigente es 10% y el IVA es 16% sobre la comisión. El movimiento se crea con `status = available`.

La recepción atómica fue validada end-to-end en QA y Producción el 18/09/2026.

## Cierre mensual y derecho de retiro

El cierre del mes habilita el derecho a solicitar retiro de los movimientos de ese periodo. La zona horaria oficial es `America/Mexico_City`. El establecimiento no está obligado a retirar el mes completo: puede elegir servicios individuales, combinar meses cerrados y combinar varios establecimientos de su cuenta en una sola solicitud.

El saldo ganado no expira. Los movimientos del mes corriente se muestran como generación del próximo cierre, pero no son elegibles todavía.

## Construcción de la solicitud

El establecimiento selecciona `balance_movimientos`; no captura un monto. El backend valida la propiedad y elegibilidad y calcula el total. Antes de crear la solicitud exige que el titular tenga una cuenta bancaria registrada.

- `retiros`: cabecera global de la solicitud.
- `retiro_aplicaciones`: movimientos exactos seleccionados y `monto_aplicado` como snapshot.
- `retiro_detalles`: subtotal por establecimiento.
- `titular_datos_bancarios`: cuenta única editable del titular, compartida por sus establecimientos.
- `retiros.titular_cuenta_destino`, `clabe_destino` y `banco_destino`: snapshot de la cuenta al momento de solicitar; editar la cuenta después sólo afecta retiros futuros.

Un movimiento incluido en un retiro `pending` o `approved` no puede estar en otra solicitud activa. Un retiro `reversed` conserva el historial y los movimientos vuelven a ser elegibles porque ya no están asociados a una solicitud activa; el rechazo no necesita cambiar el `status` del ledger.

## Administración y pago

Estados permitidos:

`pending → approved → paid`

`pending → reversed`

Al pagar, sólo se marcan `paid` los movimientos incluidos en `retiro_aplicaciones`. No se usa FIFO, no se hacen pagos parciales de un movimiento y no se crean líneas de sobrante. El Admin utiliza el snapshot bancario del retiro para la transferencia y debe registrar una referencia de pago no vacía.

## Regla documental

Si una operación requiere CFDI del establecimiento, la validación fiscal sigue siendo un control separado del estado financiero. Un CFDI válido no cambia automáticamente `balance_movimientos.status`. La conciliación fiscal definitiva y las reglas de bloqueo/reembolso siguen sujetas al flujo Billing y a validación fiscal.

## Estado técnico

El flujo funcional y el endurecimiento transaccional fueron validados en QA. `crear_retiro_desde_movimientos` bloquea los movimientos seleccionados y crea cabecera, aplicaciones y detalles atómicamente. `actualizar_retiro_admin` bloquea el retiro y los movimientos aplicados para ejecutar aprobación, rechazo o pago sin estados parciales. Se validaron solicitud, prevención de doble solicitud activa, rechazo/liberación, aprobación, pago exacto y sincronización entre `retiros`, `retiro_aplicaciones` y `balance_movimientos`.

El flujo fue migrado y validado en Producción el 08/09/2026. Se inspeccionó el esquema existente, se aplicaron únicamente las diferencias necesarias para Retiros y se validó el flujo transaccional completo pending → approved → paid mediante una prueba controlada con ROLLBACK, sin alterar datos productivos.

## Extensión bancaria - estado de despliegue

El 18/09/2026 se validó en QA el flujo completo: registro/edición de cuenta bancaria con consentimiento, bloqueo de retiro sin cuenta, snapshot bancario, solicitud multi-establecimiento, aprobación y pago con referencia, incluyendo sincronización de los movimientos asociados. Esta extensión permanece pendiente de migración y validación en Producción; no modifica el hecho de que el modelo base de retiros fue migrado a PROD el 08/09/2026.
