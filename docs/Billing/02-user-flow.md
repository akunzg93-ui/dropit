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

- captura sus datos fiscales;
- crea un perfil fiscal.

En solicitudes posteriores:

- puede seleccionar cualquiera de sus perfiles fiscales;
- crear un nuevo perfil;
- continuar utilizando el perfil predeterminado.

Al confirmar:

- se crea la solicitud de facturación;
- se generan automáticamente los registros de facturación para Dropit y para el establecimiento;
- se muestra un mensaje confirmando que la solicitud fue recibida correctamente.

Después de cerrar el mensaje de confirmación:

- el pedido actualiza automáticamente el estado de facturación;
- el Timeline cambia a **Solicitud enviada**;
- el botón **Solicitar factura** deja de estar disponible.

### 5. Procesamiento

Dropit recibe una única solicitud de factura.

Internamente ejecuta una transacción que:

- registra la solicitud de facturación;
- crea la factura correspondiente a Dropit;
- crea la factura correspondiente al establecimiento;
- conserva un snapshot de los datos fiscales utilizados;
- deja el proceso listo para el timbrado posterior.

Todo el proceso es transparente para el vendedor.

### 6. Resultado

Cuando las facturas estén disponibles, el vendedor podrá descargarlas desde la plataforma.

Dropit notificará el avance del proceso cuando corresponda.

---

---

## Consulta del estado

Cada vez que el vendedor abre nuevamente el pedido, Dropit consulta el estado actual de la solicitud mediante:

`GET /api/orders/billing/invoice-requests`

Con esta información el Timeline refleja automáticamente el avance del proceso sin requerir acciones adicionales del usuario.

## Principio

Para el vendedor existe un único responsable del proceso de facturación: **Dropit**.