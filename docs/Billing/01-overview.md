# Billing - Overview

> Estado: Implementado parcialmente y validado en QA  
> Última actualización: 27/08/2026

## Objetivo

Billing administra el flujo económico y fiscal asociado a los servicios de Dropit, manteniéndolo separado del flujo logístico de Orders.

## Fuente económica

El valor real del servicio se obtiene de la Coin efectivamente utilizada por el pedido. Cuando la Coin proviene de una compra, se usa el precio unitario efectivo después del descuento. Para Coins promocionales administrativas sin pago asociado se usa el precio nominal vigente por tipo. No se inventa un importe cuando no existe trazabilidad suficiente.

Al recibir el establecimiento el paquete (`pendiente_recoleccion`) se crea `balance_movimientos` con:

- `monto_bruto`: valor real del servicio;
- comisión Dropit: 20%;
- IVA sobre la comisión: 16%;
- `neto_establecimiento`;
- `status = pending`.

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

La validación de un CFDI no libera automáticamente el dinero. El balance permanece `pending` hasta el proceso mensual de conciliación y pago.

Si el vendedor solicitó factura, la línea requiere CFDI válido del establecimiento para poder liquidarse. Si no se entrega en el plazo definido, la línea queda bloqueada y deberá aplicar la política de compensación/reembolso que se formalice.
