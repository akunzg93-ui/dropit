# Billing - Overview

## Objetivo

El dominio Billing administra el flujo económico de Dropit.

Su responsabilidad es gestionar el ciclo de vida financiero de un servicio, desde la reserva de una Coin hasta la emisión de facturas y la liquidación a los establecimientos.

Billing es independiente del flujo logístico de los pedidos.

---

## Principios

- Una Coin representa un prepago del servicio, no el servicio en sí.
- La Coin se reserva al crear el pedido.
- La Coin se consume cuando el establecimiento recibe el paquete, momento en el que inicia la prestación efectiva del servicio.
- El vendedor interactúa únicamente con Dropit para cualquier proceso de facturación.
- Dropit coordina internamente la emisión de las facturas necesarias.
- La liberación del pago al establecimiento depende del cumplimiento de las condiciones definidas por la plataforma.

---

## Responsabilidades

Billing administra:

- Coins
- Facturación
- Datos fiscales
- Solicitudes de factura
- Liquidaciones
- Pagos a establecimientos
- Integración con PAC
- Historial financiero

Billing no administra:

- Estados del pedido
- Tracking logístico
- Establecimientos
- Entregas
- Recepciones

Estas responsabilidades pertenecen al dominio Orders.

---

## Relación con Orders

Billing no modifica el flujo de pedidos.

Billing únicamente reacciona a eventos generados por Orders.

El principal evento económico es:

Pendiente Recolección

Cuando el establecimiento recibe el paquete:

- inicia la prestación del servicio;
- la Coin cambia de Reservada a Consumida;
- se habilita la solicitud de factura;
- inicia el flujo de liquidación.