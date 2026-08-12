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