# Billing - Conciliación y liquidación

> Última actualización: 27/08/2026

## Modelo vigente

El modelo anterior de retiros/settlements por solicitud no es la arquitectura objetivo. La fuente financiera vigente es `balance_movimientos`.

Cuando el establecimiento recibe el paquete se registra una línea financiera con el valor real del servicio, comisión, IVA de comisión y neto del establecimiento. La línea nace con `status = pending`.

## Cierre mensual

El modelo acordado es:

1. cerrar el periodo mensual;
2. conciliar operaciones y solicitudes de factura;
3. verificar cumplimiento documental por línea;
4. bloquear líneas con factura requerida pero no validada;
5. aprobar las líneas conciliadas;
6. ejecutar pago al establecimiento;
7. posteriormente gestionar el CFDI consolidado mensual de comisión de Dropit al establecimiento, sujeto a validación fiscal final con contador.

## Regla documental

Si el vendedor solicitó factura, el establecimiento debe entregar un CFDI válido por el `monto_bruto` de esa operación antes de que la línea pueda liquidarse.

La validación del CFDI **no** cambia automáticamente el estado financiero. En la prueba QA del 27/08/2026, una factura quedó `emitida` mientras su `balance_movimientos.status` permaneció `pending`, comportamiento esperado.

## Incumplimiento

Una línea con factura requerida y no validada permanece bloqueada. La política definitiva de compensación/reembolso al vendedor y sus plazos debe formalizarse en reglas de negocio y Términos y Condiciones.
