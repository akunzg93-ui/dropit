# Billing - User Flow

## Objetivo

Permitir que el vendedor solicite sus facturas desde Dropit sin interactuar directamente con los establecimientos.

---

## Flujo

### 1. Compra de Coins

El vendedor compra Coins para utilizar los servicios de Dropit.

Las Coins quedan disponibles en su cuenta.

---

### 2. Creación del pedido

Al crear un pedido:

- se asigna una Coin al pedido;
- la Coin cambia a estado **Reservada**.

Todavía no existe consumo del servicio.

---

### 3. Inicio del servicio

Cuando el establecimiento recibe el paquete:

- el pedido cambia a **Pendiente Recolección**;
- inicia la prestación efectiva del servicio;
- la Coin cambia a **Consumida**;
- se habilita la opción **Solicitar factura**.

---

### 4. Solicitud de factura

El vendedor ingresa a **Mis pedidos** y selecciona:

**Solicitar factura**

Si es la primera solicitud:

- captura sus datos fiscales.

En solicitudes posteriores:

- los datos aparecen precargados y pueden editarse.

---

### 5. Procesamiento

Dropit recibe una única solicitud de factura.

Internamente gestiona:

- la factura correspondiente a Dropit;
- la factura correspondiente al establecimiento.

Todo el proceso es transparente para el vendedor.

---

### 6. Resultado

Cuando las facturas estén disponibles, el vendedor podrá descargarlas desde la plataforma.

Dropit notificará el avance del proceso cuando corresponda.

---

## Principio

Para el vendedor existe un único responsable del proceso de facturación: **Dropit**.