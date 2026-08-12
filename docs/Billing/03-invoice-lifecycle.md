# Billing - Invoice Lifecycle

## Objetivo

Definir el ciclo de vida de una solicitud de factura dentro de Dropit.

---

## Estados

### Disponible

La solicitud puede realizarse.

Condiciones:

- La Coin fue consumida.
- El servicio inició.
- La solicitud se encuentra dentro del plazo permitido.
- No existe una solicitud previa.

---

### Solicitada

El vendedor envió la solicitud.

Dropit valida:

- datos fiscales;
- plazo para solicitar la factura.

---

### Procesando

Dropit inició el proceso interno de facturación.

Incluye:

- emisión de la factura correspondiente a Dropit;
- solicitud de factura al establecimiento.

---

### Parcial

Al menos una factura ya está disponible.

La otra continúa en proceso.

---

### Completada

Todas las facturas del servicio se encuentran disponibles para descarga.

---

### Rechazada

La solicitud no pudo procesarse.

Ejemplos:

- plazo vencido;
- datos fiscales inválidos;
- otra condición definida por la plataforma.

---

## Descarga

Las facturas emitidas podrán descargarse desde:

- Mis pedidos.
- Facturación.

---

## Principio

El vendedor realiza una única solicitud.

Dropit administra internamente todos los procesos necesarios hasta completar la facturación.