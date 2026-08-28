# Billing - Invoice Lifecycle

> Última actualización: 27/08/2026

## Solicitud (`invoice_requests`)

La solicitud representa la intención del vendedor de obtener CFDI para un pedido elegible. Conserva el perfil seleccionado y un snapshot fiscal para impedir que cambios posteriores alteren el receptor esperado.

## Factura del establecimiento (`invoices`)

Estados operativos utilizados:

- `pendiente`: existe la obligación documental y todavía no se han validado documentos;
- `procesando`: XML/PDF recibidos y validación en curso;
- `emitida`: CFDI aceptado por validaciones locales y fiscal PAC/SAT;
- `error`: documento rechazado o validación fallida;
- `cancelada`: CFDI cancelado cuando aplique.

### Transición validada en QA

```text
pendiente
   ↓ carga XML/PDF
procesando
   ↓ validación local + PAC/SAT
emitida
```

En caso de error:

```text
pendiente/procesando → error
```

La factura puede reintentarse con documentos corregidos mientras el estado permita validación.

## Independencia del pago

`emitida` significa que el CFDI fue aceptado fiscalmente por Dropit. No significa que el saldo del establecimiento haya sido pagado ni liberado.
