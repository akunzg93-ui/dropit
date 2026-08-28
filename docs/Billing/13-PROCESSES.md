# Billing - Processes

> Última actualización: 27/08/2026

## P-001 Valor económico del servicio

Al recibir el establecimiento el paquete, Billing identifica la Coin usada y calcula el importe efectivo. Crea `balance_movimientos` con comisión 20%, IVA 16% sobre comisión y estado `pending`.

## P-002 Solicitud de factura

1. Validar vendedor y pedido.
2. Validar inicio del servicio y plazo.
3. Validar perfil fiscal.
4. Crear `invoice_requests`.
5. Guardar snapshot fiscal.
6. Crear `invoice` del establecimiento en `pendiente`.

## P-003 Carga de CFDI

1. Autenticar establecimiento.
2. Verificar propiedad del pedido.
3. Recibir XML/PDF.
4. Guardar en `billing-documents`.
5. Cambiar invoice a `procesando`.

## P-004 Validación CFDI establecimiento

1. Descargar XML.
2. Parsear CFDI.
3. Validar RFC emisor contra perfil del establecimiento.
4. Validar RFC receptor contra snapshot.
5. Validar total contra `monto_bruto`.
6. Persistir UUID/subtotal/total/fecha.
7. Validar fiscalmente con PAC/SAT.
8. Si es vigente: `emitida`; si falla: `error`.

## P-005 Conciliación mensual (pendiente)

Revisar líneas del periodo, cumplimiento documental, excepciones y autorización de pago. No forma parte del proceso de validación del CFDI.

## P-006 CFDI mensual de comisión Dropit (pendiente)

Después de la conciliación/pago, Dropit emitirá un CFDI consolidado de comisión por establecimiento conforme al disparador fiscal que se valide con contador.
