# Billing - API Contracts

## Objetivo

Definir los contratos de API necesarios para operar facturación, perfiles fiscales y liquidaciones sin mezclar responsabilidades con Orders.

---

## Principios

- Billing tendrá endpoints propios.
- Orders no generará facturas ni liquidaciones.
- Las operaciones sensibles se ejecutarán desde servidor.
- Los endpoints deberán validar que el usuario tenga acceso al recurso solicitado.

---

## Perfiles fiscales

### GET `/api/billing/fiscal-profiles`

Obtiene los perfiles fiscales del vendedor autenticado.

---

### POST `/api/billing/fiscal-profiles`

Crea un nuevo perfil fiscal.

Datos esperados:

- RFC
- Razón social
- Código postal fiscal
- Régimen fiscal
- Uso CFDI
- Correo
- Indicador de perfil predeterminado

---

### PATCH `/api/billing/fiscal-profiles/[id]`

Permite:

- editar datos fiscales;
- establecer como predeterminado;
- archivar o reactivar un perfil.

---

## Solicitudes de factura

### POST `/api/billing/invoices/request`

Crea una solicitud de factura para un pedido.

Datos esperados:

- `pedido_id`
- `fiscal_profile_id`

Validaciones:

- el pedido pertenece al vendedor;
- el servicio ya inició;
- la Coin fue consumida;
- la solicitud está dentro del plazo permitido;
- no existe una solicitud previa para ese pedido.

---

### GET `/api/billing/invoices`

Obtiene las solicitudes y facturas del vendedor autenticado.

Podrá utilizarse para:

- historial de facturación;
- estados;
- descargas.

---

### GET `/api/billing/invoices/[id]`

Obtiene el detalle de una solicitud de factura.

Incluye:

- estado general;
- factura de Dropit;
- factura del establecimiento;
- documentos disponibles.

---

## Facturación Dropit

### POST `/api/billing/invoices/[id]/issue-dropit`

Genera la factura correspondiente a la comisión de Dropit.

Este endpoint será utilizado internamente por el backend.

No estará expuesto directamente al frontend.

---

## Facturación del establecimiento

### POST `/api/billing/establishment-invoices/upload`

Permite al establecimiento entregar los documentos fiscales correspondientes.

Datos esperados:

- solicitud relacionada;
- XML;
- PDF.

Dropit validará que el establecimiento corresponda al pedido.

---

## Liquidaciones

### GET `/api/billing/settlements`

Obtiene las liquidaciones correspondientes al establecimiento autenticado.

---

### GET `/api/billing/settlements/[id]`

Obtiene el detalle de una liquidación.

Incluye:

- pedido;
- importe;
- estado;
- requisito de factura;
- estado del pago.

---

## Integraciones internas

Billing deberá reaccionar al evento:

`pedido → pendiente_recoleccion`

Este evento deberá activar:

- consumo definitivo de la Coin;
- creación o habilitación de la liquidación;
- habilitación de solicitud de factura.

---

## Seguridad

Las rutas de Billing deberán validar:

- sesión activa;
- rol;
- propiedad del recurso;
- estado permitido.

Las operaciones fiscales, pagos y cambios de estado económico deberán ejecutarse únicamente desde servidor.

# Invoice Requests API

## GET /api/orders/billing/invoice-requests

Obtiene el estado actual de las solicitudes de facturación del vendedor autenticado.

### Autenticación

Bearer Token requerido.

---

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| pedido_id | bigint | No | Si se envía, devuelve únicamente la solicitud correspondiente a ese pedido. |

---

### Respuesta (lista)

```json
{
  "ok": true,
  "invoice_requests": [
    {
      "...": "..."
    }
  ]
}
```

---

### Respuesta (pedido específico)

```json
{
  "ok": true,
  "invoice_request": {
    "...": "..."
  }
}
```

---

### Información incluida

Cada solicitud incluye:

- información del pedido;
- perfil fiscal utilizado;
- estado de la solicitud;
- fechas relevantes;
- ambas facturas relacionadas (Dropit y Establecimiento).

Este endpoint es utilizado por la pantalla de **Mis pedidos** para reconstruir el estado de facturación cada vez que el usuario abre un pedido.

## POST /api/orders/billing/invoice-requests

Crea una nueva solicitud de facturación.

### Autenticación

Bearer Token requerido.

---

### Body

```json
{
  "pedido_id": 51,
  "fiscal_profile_id": "uuid"
}
```

---

### Validaciones

Antes de crear la solicitud el sistema valida:

- el usuario autenticado;
- que el pedido pertenezca al vendedor;
- que el servicio ya haya iniciado (`recibido_en`);
- que la Coin correspondiente ya haya sido consumida;
- que el perfil fiscal exista y pertenezca al usuario;
- que no exista una solicitud previa para ese pedido;
- que el periodo para solicitar factura continúe vigente.

---

### Operaciones realizadas

El endpoint ejecuta la función transaccional:

```
create_billing_invoice_request()
```

La transacción:

1. crea la solicitud (`invoice_requests`);
2. crea la factura de Dropit;
3. crea la factura del establecimiento;
4. almacena un snapshot fiscal;
5. bloquea el settlement correspondiente cuando aplica.

---

### Respuesta exitosa

```json
{
  "ok": true,
  "invoice_request_id": "uuid"
}
```

## Errores posibles

| Código | Motivo |
|---------|--------|
| 400 | Datos obligatorios faltantes |
| 401 | Usuario no autenticado |
| 404 | Pedido no encontrado |
| 404 | Perfil fiscal inexistente |
| 409 | Servicio aún no iniciado |
| 409 | Coin no consumida |
| 409 | Solicitud ya existente |
| 409 | Periodo de facturación vencido |
| 500 | Error interno del servidor |

## Observaciones

Actualmente la API únicamente registra la solicitud y prepara ambas facturas.

La emisión del CFDI (timbrado SAT) se realizará posteriormente mediante la integración con SW Sapien utilizando JSON como formato de intercambio.