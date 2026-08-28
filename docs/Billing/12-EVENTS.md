# Billing - Events

> Última actualización: 27/08/2026

## OrderReceivedByEstablishment

El establecimiento recibe físicamente el paquete. Se reconoce el inicio económico del servicio y se crea `balance_movimientos` con el valor real de la Coin utilizada y `status = pending`.

## InvoiceRequested

El vendedor solicita factura. Se crea `invoice_requests`, snapshot fiscal y el invoice pendiente del establecimiento.

## EstablishmentInvoiceUploaded

El establecimiento carga XML/PDF. Los documentos se almacenan y la factura pasa a `procesando`.

## EstablishmentInvoiceValidated

El CFDI supera validaciones locales y PAC/SAT. La factura pasa a `emitida`. Este evento no libera el balance.

## EstablishmentInvoiceRejected

La validación falla. La factura pasa a `error` con motivo trazable.

## MonthlyReconciliationClosed

Evento futuro: cierre y conciliación mensual de líneas financieras antes del pago.

## EstablishmentPaid

Evento futuro: pago confirmado después de conciliación.

## DropitMonthlyCommissionInvoiceIssued

Evento futuro: CFDI consolidado mensual de comisión de Dropit al establecimiento, sujeto a validación fiscal definitiva.
