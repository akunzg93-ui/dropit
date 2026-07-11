# Reglas de Negocio de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Este documento define las reglas oficiales del negocio de Dropit.

Toda funcionalidad implementada deberá respetar estas reglas.

Si una regla cambia, deberá actualizarse este documento antes de modificar el sistema.

---

# Regla 1
## Un pedido consume una coin

Cada pedido creado consume exactamente una coin del tamaño correspondiente.

- small → 1 coin small
- medium → 1 coin medium

---

# Regla 2
## El consumo ocurre al crear el pedido

La coin se consume en el momento de crear el pedido.

No se consume cuando el pedido es entregado.

---

# Regla 3
## Consumo FIFO

Las coins siempre se consumen utilizando el lote más antiguo disponible.

---

# Regla 4
## Un pedido pertenece a un vendedor

Cada pedido tiene un único vendedor responsable.

Nunca podrá cambiarse durante el flujo.

---

# Regla 5
## Un pedido tiene un único establecimiento final

Aunque el vendedor pueda proponer varios establecimientos, únicamente uno será seleccionado por el cliente.

Ese establecimiento será el responsable de la recepción y entrega.

---

# Regla 6
## El cliente elige el establecimiento

La decisión del establecimiento final pertenece al cliente.

El vendedor únicamente propone opciones disponibles.

---

# Regla 7
## Los códigos son de un solo uso

Los códigos utilizados para recepción y entrega únicamente son válidos para el pedido al que pertenecen.

---

# Regla 8
## El historial nunca se elimina

Toda transición importante deberá registrarse en `pedido_eventos`.

El historial constituye la fuente oficial del tracking.

---

# Regla 9
## El pedido solo puede tener un estado

Un pedido únicamente puede encontrarse en un estado a la vez.

---

# Regla 10
## El flujo no puede retroceder

Las transiciones oficiales únicamente avanzan hacia el siguiente estado.

No existen regresos de estado en la versión actual.

---

# Regla 11
## El servidor tiene la autoridad

Las reglas críticas se validan en servidor.

El frontend únicamente guía la experiencia del usuario.

---

# Regla 12
## Los establecimientos forman una red

Dropit opera sobre establecimientos independientes.

No existen centros de distribución propios.

---

# Regla 13
## El tracking proviene del historial

La línea de tiempo del pedido se construye utilizando `pedido_eventos`.

No debe depender únicamente del estado actual.

---

# Regla 14
## La documentación es oficial

Las reglas contenidas en este documento representan el comportamiento oficial del sistema.

Toda modificación requiere un RFC y la actualización de la documentación correspondiente.

---

# Reglas futuras

Las siguientes reglas serán definidas cuando la funcionalidad exista oficialmente:

- Cancelaciones.
- Expiraciones.
- Devoluciones.
- Promociones.
- Penalizaciones.
- Entrega manual.
- Recolección por tercero autorizado.