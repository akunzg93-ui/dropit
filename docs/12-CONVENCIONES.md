# Convenciones de Desarrollo de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Definir las convenciones oficiales para el desarrollo de Dropit.

Todo código nuevo deberá seguir estas reglas.

---

# Idioma

## Código

Variables, funciones y clases deberán escribirse en inglés.

Ejemplos:

- createOrder
- establishment
- vendor
- buyer

---

## Interfaz

Todo texto mostrado al usuario deberá estar en español.

Ejemplos:

- Cliente
- Vendedor
- Establecimiento

No utilizar "Comprador" en la interfaz.

---

# Nombres

## Tablas

snake_case

Ejemplo:

pedido_eventos

---

## Columnas

snake_case

Ejemplo:

codigo_entrega

---

## Componentes React

PascalCase

Ejemplo:

MapaEstablecimientos

---

## Funciones

camelCase

Ejemplo:

consumeCoinForOrder()

---

## APIs

Las rutas deberán representar acciones del negocio.

Correcto:

/api/orders/recibido

Incorrecto:

/api/orders/updatePedido

---

# Base de datos

Los IDs de pedidos y establecimientos utilizan bigint.

No modificar sin RFC.

---

# Estados

Los estados oficiales únicamente podrán modificarse mediante una ADR.

---

# UX

Toda nueva pantalla deberá mantener:

- Colores oficiales.
- Espaciados consistentes.
- Componentes reutilizables.
- Iconografía Lucide.

---

# Git

Todo cambio deberá cumplir el siguiente flujo:

Desarrollo

↓

Pruebas

↓

GitHub

↓

Producción

No deberán realizarse cambios directos en producción.

---

# Documentación

Toda funcionalidad nueva deberá actualizar la documentación correspondiente.

Un cambio sin documentación se considera incompleto.

---

# Arquitectura

No mover carpetas únicamente por limpieza.

Todo refactor deberá justificarse mediante una decisión arquitectónica.