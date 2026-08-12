# Billing - Settlement

## Objetivo

Definir el flujo de liquidación económica entre Dropit, el vendedor y el establecimiento.

---

## Principios

- El vendedor paga por adelantado mediante una Coin.
- La Coin representa un prepago del servicio.
- El servicio inicia cuando el establecimiento recibe el paquete.
- Dropit administra todo el proceso de liquidación.

---

## Flujo

### 1. Compra de Coin

El vendedor compra una Coin.

La Coin queda disponible para utilizarse.

---

### 2. Reserva

Al crear un pedido:

- la Coin se asigna al pedido;
- cambia a estado **Reservada**.

---

### 3. Consumo

Cuando el establecimiento recibe el paquete:

- inicia la prestación del servicio;
- la Coin cambia a **Consumida**;
- Dropit reconoce el ingreso del servicio.

---

### 4. Comisión

Del importe del servicio:

- Dropit retiene su comisión.
- Se calcula el importe correspondiente al establecimiento.

---

### 5. Solicitud de factura

Si el vendedor solicita factura:

- Dropit emite su factura.
- Dropit solicita la factura correspondiente al establecimiento.

El vendedor interactúa únicamente con Dropit.

---

### 6. Liberación del pago

El pago al establecimiento se libera únicamente cuando se cumplen las condiciones definidas por la plataforma.

---

### 7. Incumplimiento

Si el establecimiento no cumple con las condiciones necesarias para liberar el pago:

- Dropit no libera la liquidación.
- Se notifica al establecimiento.
- Se aplican las políticas definidas en los Términos y Condiciones.

---

## Principio

La liquidación económica es independiente del flujo logístico del pedido.