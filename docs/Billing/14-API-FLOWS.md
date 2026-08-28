# Billing - API Flows

## Objetivo

Documentar la secuencia entre frontend, APIs, servicios de Billing, Supabase y PAC para los flujos actualmente implementados.

---

# 1. Solicitud de factura del vendedor

```text
Vendedor
  ↓
POST /api/orders/billing/solicitar
  ↓
Validar usuario + pedido + perfil fiscal + elegibilidad
  ↓
create_billing_invoice_request
  ↓
invoice_requests
  ↓
invoices(tipo_emisor = establecimiento, estado = pendiente)
```

La solicitud no crea actualmente una factura Dropit por pedido.

---

# 2. Consulta de facturas pendientes del establecimiento

```text
Panel / Facturación establecimiento
  ↓
GET /api/orders/billing/establishment-invoices
  ↓
Resolver establecimientos del usuario
  ↓
invoice_requests + invoices + pedidos + balance_movimientos
  ↓
Pendientes y monto esperado
```

`balance_movimientos.monto_bruto` es la referencia económica del servicio que debe facturar el establecimiento.

---

# 3. Carga de XML y PDF

```text
Establecimiento
  ↓
POST /api/orders/billing/establishment-invoices/upload
  ↓
Validar autenticación y propiedad del establecimiento
  ↓
Validar archivos
  ↓
Storage privado: billing-documents
  ↓
invoices.xml_path / invoices.pdf_path
  ↓
invoices.estado = procesando
```

La carga documental por sí sola no significa que el CFDI sea fiscalmente válido.

---

# 4. Validación del CFDI del establecimiento

```text
Establecimiento
  ↓
POST /api/orders/billing/establishment-invoices/[id]/validate
  ↓
validateEstablishmentCfdi
  ↓
Descargar XML privado
  ↓
Parsear CFDI
  ↓
Validación local Dropit
  ├─ RFC emisor = perfil fiscal del establecimiento
  ├─ RFC receptor = snapshot fiscal del vendedor
  └─ Total = balance_movimientos.monto_bruto
  ↓
PAC SW /validate/cfdi
  ↓
Validación fiscal SAT
  ├─ status = success
  ├─ statusSat = Vigente
  └─ comprobante localizado satisfactoriamente
  ↓
invoices.estado = emitida
```

Si falla la validación local o fiscal, la factura queda en `error` con `error_mensaje`.

---

# 5. Efecto financiero

La validación exitosa del CFDI **no modifica ni libera automáticamente** `balance_movimientos`.

```text
CFDI emitida
  ↓
balance_movimientos.status permanece pending
  ↓
Cierre / conciliación mensual (pendiente de implementación)
  ↓
Liberación económica según reglas del periodo
```

La validación fiscal y la liquidación económica son procesos separados.

---

# 6. Integración PAC

El proveedor PAC se obtiene mediante `lib/billing/pac/factory`.

Para SW, el flujo implementado de validación usa autenticación Bearer y `/validate/cfdi`. Un HTTP exitoso no basta para aceptar el CFDI: Dropit exige el resultado fiscal esperado antes de marcarlo `emitida`.

---

# 7. Flujo no implementado todavía

La conciliación mensual, liberación de balances y CFDI consolidado de comisión Dropit forman parte de la siguiente etapa de Billing. No deben interpretarse como funcionalidad disponible actualmente.
