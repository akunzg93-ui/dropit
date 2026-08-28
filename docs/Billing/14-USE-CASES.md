# Billing - Use Cases

> Última actualización: 27/08/2026

## UC-001 Solicitar factura

**Actor:** Vendedor.  
**Resultado:** `invoice_requests` con snapshot fiscal y factura pendiente del establecimiento.

## UC-002 Administrar perfiles fiscales

**Actor:** Vendedor/propietario de cuenta.  
Crear, seleccionar, actualizar y reutilizar perfiles fiscales. Un establecimiento solo puede asociar perfiles pertenecientes a su misma cuenta.

## UC-003 Consultar pendientes de facturación

**Actor:** Establecimiento.  
El panel consulta solicitudes de sus establecimientos y muestra `pending_count` y detalle por folio.

## UC-004 Cargar CFDI del establecimiento

**Actor:** Establecimiento.  
Carga XML + PDF emitidos externamente. Dropit verifica propiedad y almacena documentos privados.

## UC-005 Validar CFDI del establecimiento

**Actor:** Billing.  
Valida emisor, receptor, importe y vigencia fiscal PAC/SAT. Resultado válido: `emitida`. Resultado inválido: `error`.

## UC-006 Conciliar periodo mensual

**Actor:** Admin/Billing.  
**Estado:** pendiente de implementación. Revisa operaciones, requisitos fiscales y líneas bloqueadas antes del pago.

## UC-007 Emitir CFDI mensual de comisión Dropit

**Actor:** Billing.  
**Estado:** pendiente de implementación y validación fiscal final. Se plantea consolidado por establecimiento, no por pedido.
