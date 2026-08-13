# Billing - Data Model

## Objetivo

Definir las entidades necesarias para soportar facturación, perfiles fiscales y liquidaciones sin duplicar responsabilidades existentes.

---

## Principios

- Reutilizar `coin_lotes` y `coin_movimientos`.
- No duplicar información logística de `pedidos`.
- Toda tabla nueva deberá utilizar RLS.
- Los documentos fiscales deben conservar trazabilidad.
- Una solicitud de factura puede generar más de un CFDI.

---

## Entidades existentes

### pedidos

Billing utiliza:

- `id`
- `folio`
- `vendedor_id`
- `establecimiento_uuid`
- `tamano`
- `estado`
- `recibido_en`

`recibido_en` representa el inicio del servicio económico.

---

### coin_lotes

Continúa siendo la fuente oficial del saldo de Coins.

No se reemplaza.

---

### coin_movimientos

Continúa siendo el historial económico de Coins.

Deberá evolucionar para distinguir:

- reserva;
- liberación de reserva;
- consumo.

---

## Nuevas entidades

### fiscal_profiles

Almacena los perfiles fiscales de cada vendedor.

Campos conceptuales:

- `id`
- `user_id`
- `rfc`
- `razon_social`
- `codigo_postal`
- `regimen_fiscal`
- `uso_cfdi`
- `email`
- `es_predeterminado`
- `activo`
- `created_at`
- `updated_at`

Un vendedor puede tener múltiples perfiles.

---

### invoice_requests

Representa la solicitud realizada por el vendedor.

Campos conceptuales:

- `id`
- `pedido_id`
- `vendedor_id`
- `fiscal_profile_id`
- `estado`
- `fecha_solicitud`
- `fecha_limite`
- `created_at`
- `updated_at`

Una solicitud pertenece a un pedido y utiliza un perfil fiscal específico.

---

### invoices

Representa cada CFDI asociado a una solicitud.

Campos conceptuales:

- `id`
- `invoice_request_id`
- `tipo_emisor`
- `emisor_id`
- `estado`
- `uuid_fiscal`
- `subtotal`
- `impuestos`
- `total`
- `xml_path`
- `pdf_path`
- `fecha_emision`
- `created_at`
- `updated_at`

`tipo_emisor` permitirá distinguir:

- `dropit`
- `establecimiento`

Una solicitud puede tener múltiples facturas.

---

### settlements

Representa el importe económico correspondiente al establecimiento.

Campos conceptuales:

- `id`
- `pedido_id`
- `establecimiento_id`
- `importe_servicio`
- `comision_dropit`
- `importe_establecimiento`
- `estado`
- `fecha_liberacion`
- `fecha_pago`
- `created_at`
- `updated_at`

---

## Relaciones

```text
profiles
   │
   └── fiscal_profiles

pedidos
   │
   ├── invoice_requests
   │       │
   │       └── invoices
   │
   └── settlements

coin_lotes
   │
   └── coin_movimientos
```

---

## Separación de responsabilidades

### Orders

Mantiene:

- pedido;
- estado logístico;
- timestamps operativos;
- participantes.

### Billing

Mantiene:

- perfiles fiscales;
- solicitudes de factura;
- CFDI;
- liquidaciones;
- movimientos económicos relacionados con Billing.

---

## Seguridad

Todas las tablas nuevas deberán mantener RLS activa.

El vendedor únicamente podrá acceder a:

- sus perfiles fiscales;
- sus solicitudes;
- sus facturas.

Los establecimientos únicamente podrán acceder a la información necesaria para cumplir sus obligaciones dentro del flujo de liquidación.

Las operaciones sensibles deberán ejecutarse desde servidor.

# Modelo de datos

El módulo de facturación está compuesto por dos entidades principales:

```
invoice_requests
        │
        ├──────────────┐
        │              │
        ▼              ▼
invoice(dropit)   invoice(establecimiento)
```

Cada solicitud genera exactamente dos facturas:

- una emitida por **Dropit**;
- una emitida por el **establecimiento**.

Ambas permanecen vinculadas a la misma solicitud durante todo su ciclo de vida.

## invoice_requests

Representa la solicitud realizada por el vendedor.

Campos principales:

| Campo | Descripción |
|--------|-------------|
| id | Identificador de la solicitud |
| pedido_id | Pedido asociado |
| vendedor_id | Usuario que solicita |
| fiscal_profile_id | Perfil fiscal utilizado |
| fiscal_data_snapshot | Snapshot de los datos fiscales utilizados |
| estado | Estado actual de la solicitud |
| fecha_solicitud | Fecha de creación |
| fecha_limite | Último día permitido para solicitar |
| fecha_completada | Fecha de finalización |
| motivo_rechazo | Motivo en caso de rechazo |

## Estados de invoice_requests

Actualmente el flujo contempla los siguientes estados:

| Estado | Descripción |
|---------|-------------|
| solicitada | El vendedor envió correctamente la solicitud |
| dropit_emitida | La factura de Dropit fue emitida |
| establecimiento_emitida | La factura del establecimiento fue emitida |
| completada | Ambas facturas fueron emitidas |
| cancelada | Solicitud cancelada |
| rechazada | Solicitud rechazada |

## invoices

Cada registro representa una factura individual.

Actualmente se generan automáticamente dos registros por cada solicitud.

Campos principales:

| Campo | Descripción |
|--------|-------------|
| invoice_request_id | Solicitud a la que pertenece |
| tipo_emisor | dropit / establecimiento |
| estado | Estado del CFDI |
| uuid_fiscal | UUID SAT |
| serie | Serie |
| folio | Folio |
| subtotal | Importe |
| impuestos | IVA |
| total | Total |
| xml_path | Ruta XML |
| pdf_path | Ruta PDF |
| fecha_emision | Fecha de timbrado |
| fecha_cancelacion | Fecha de cancelación |
| error_mensaje | Error devuelto por el PAC |

## Snapshot fiscal

Cuando el vendedor solicita una factura, los datos fiscales utilizados se almacenan dentro de `invoice_requests.fiscal_data_snapshot`.

Esto garantiza que futuras modificaciones al perfil fiscal del usuario no alteren la información utilizada para emitir el CFDI correspondiente.