# Glosario Oficial de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Definir el significado oficial de los términos utilizados dentro de Dropit.

Este documento representa la terminología oficial del proyecto.

---

# Pedido

Entidad principal del sistema.

Representa el proceso completo desde que un vendedor registra un producto hasta que el cliente lo recibe.

---

# Cliente

Persona que recibirá el pedido.

En la interfaz nunca deberá utilizarse el término "Comprador".

---

# Vendedor

Persona o negocio que crea el pedido y entrega el paquete al establecimiento.

---

# Establecimiento

Negocio autorizado para recibir y entregar pedidos dentro de la red Dropit.

---

# Administrador

Usuario responsable de la operación y administración del sistema.

---

# Coin

Unidad utilizada para crear pedidos.

Cada pedido consume una coin del tamaño correspondiente.

---

# Lote de Coins

Conjunto de coins adquiridas en una misma compra o asignación.

Los lotes se consumen utilizando FIFO.

---

# Folio

Identificador público del pedido.

Permite localizar y consultar un pedido.

No autoriza por sí mismo ninguna acción.

---

# Código de recepción

Código utilizado por el establecimiento para validar que el vendedor autorizado entrega el paquete.

---

# Código de entrega

Código utilizado para validar la entrega del pedido al cliente.

Puede representarse mediante QR.

---

# Estado

Situación actual del pedido dentro del flujo.

Un pedido únicamente puede tener un estado a la vez.

---

# Transición

Cambio autorizado entre dos estados.

Toda transición ejecuta reglas de negocio.

---

# Evento

Registro histórico de una transición del pedido.

Los eventos conforman la línea de tiempo del tracking.

---

# Tracking

Consulta del historial y estado de un pedido.

Se construye utilizando los eventos registrados.

---

# API

Interfaz utilizada por el frontend para ejecutar reglas del negocio en el servidor.

---

# RPC

Función ejecutada directamente en la base de datos para realizar operaciones específicas.

---

# RLS

(Row Level Security)

Mecanismo utilizado por Supabase para controlar el acceso a los datos.

---

# ADR

Architecture Decision Record.

Documento que registra una decisión arquitectónica oficial.

---

# RFC

Request For Change.

Documento utilizado para evaluar cambios importantes antes de implementarlos.

---

# Arquitectura Actual

Implementación existente del sistema.

---

# Arquitectura Objetivo

Diseño al que deberá evolucionar el sistema sin comprometer la estabilidad del producto.