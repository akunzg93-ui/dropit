# Billing - Overview

> Estado: Implementado parcialmente y validado en QA  
> Última actualización: 27/08/2026

## Objetivo

Billing administra el flujo económico y fiscal asociado a los servicios de Dropit, manteniéndolo separado del flujo logístico de Orders.

## Fuente económica

El movimiento financiero del servicio se crea por pedido usando el importe nominal vigente del tamaño: $60 MXN para `small` y $90 MXN para `medium`.

La función vigente `fn_crear_balance_movimiento_por_pedido` crea `balance_movimientos` con:

- `monto_bruto`: $60 MXN (`small`) o $90 MXN (`medium`);
- comisión Dropit: 10%;
- IVA sobre la comisión: 16%;
- `neto_establecimiento`;
- `status = available`.

Los movimientos históricos conservan las condiciones con las que fueron creados y no deben recalcularse por cambios posteriores de comisión.

`balance_movimientos` es la fuente financiera operativa vigente. `settlements` no participa en el flujo actual.

## Facturación al vendedor

El vendedor solicita factura desde Dropit y selecciona un perfil fiscal. La solicitud conserva un snapshot fiscal inmutable.

La solicitud crea actualmente un único registro `invoices` de tipo `establecimiento`. El establecimiento es responsable de emitir externamente el CFDI por el valor bruto real del servicio y cargar XML + PDF en Dropit.

Dropit valida:

1. estructura del XML;
2. RFC emisor contra el perfil fiscal asociado al establecimiento;
3. RFC receptor contra el snapshot de la solicitud;
4. total contra `balance_movimientos.monto_bruto`;
5. vigencia fiscal mediante PAC/SAT.

Una validación satisfactoria deja `invoices.estado = emitida`.

## Factura de comisión Dropit

Dropit no emite actualmente un CFDI de comisión por cada pedido. El modelo acordado es una factura consolidada mensual de comisión por establecimiento, posterior al cierre y conciliación del periodo. El disparador fiscal definitivo debe validarse con contador antes de implementarse.

## Liquidación

La validación de un CFDI no modifica por sí sola el estado financiero del movimiento. La elegibilidad para retiro y pago se rige por el flujo de settlement vigente y sus validaciones de cierre mensual.

Si el vendedor solicitó factura, la línea requiere CFDI válido del establecimiento para poder liquidarse. Si no se entrega en el plazo definido, la línea queda bloqueada y deberá aplicar la política de compensación/reembolso que se formalice.
