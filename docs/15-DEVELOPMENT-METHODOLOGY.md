# Development Methodology

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Activo
>
> Última actualización: 07/08/2026

---

# Objetivo

Definir la metodología oficial para el diseño, desarrollo e implementación de nuevas funcionalidades dentro de Dropit.

El objetivo es garantizar que todas las decisiones de negocio, arquitectura y desarrollo sigan un proceso consistente, minimizando retrabajos y manteniendo la documentación como fuente oficial del proyecto.

---

# Principios

- La documentación oficial prevalece sobre el historial de conversaciones.
- El negocio se diseña antes que la implementación.
- Las decisiones arquitectónicas se documentan mediante ADR cuando corresponda.
- El código estable no se modifica sin una justificación funcional.
- Cada sesión deberá tener un único objetivo claramente definido.
- Toda funcionalidad termina únicamente cuando código, documentación y pruebas se encuentran alineados.

---

# Metodología

## 1. Descubrimiento del negocio

Objetivo:

Comprender completamente el problema antes de diseñar una solución.

Actividades:

- comprender el proceso de negocio;
- identificar actores;
- identificar reglas de negocio;
- identificar restricciones;
- validar el modelo con las partes involucradas.

Entregables:

- flujo funcional aprobado.

---

## 2. Diseño funcional

Objetivo:

Definir cómo funcionará la solución desde la perspectiva del negocio.

Actividades:

- flujos;
- reglas;
- excepciones;
- responsabilidades.

Entregables:

- documentación funcional.

---

## 3. Documentación del dominio

Objetivo:

Construir la documentación oficial del nuevo dominio.

Ejemplos:

- Billing
- Coins
- Analytics
- Administración

Entregables:

- documentación completa del dominio.

---

## 4. Architecture Decision Records (ADR)

Objetivo:

Registrar decisiones arquitectónicas permanentes.

Se crea una ADR cuando una decisión:

- modifica la arquitectura;
- cambia reglas permanentes;
- afecta múltiples módulos.

Entregables:

- ADR aprobada.

---

## 5. Modelo de datos

Objetivo:

Diseñar las entidades del dominio.

Actividades:

- tablas;
- relaciones;
- restricciones;
- RLS;
- índices.

Entregables:

- modelo de datos aprobado.

---

## 6. Máquinas de estado

Objetivo:

Definir todos los estados válidos y sus transiciones.

Entregables:

- State Machines.

---

## 7. Eventos

Objetivo:

Definir los eventos de negocio que activan procesos.

Los eventos representan hechos ocurridos dentro de la plataforma.

Entregables:

- catálogo de eventos.

---

## 8. Procesos

Objetivo:

Definir las acciones que ejecuta el sistema como respuesta a los eventos.

Cada proceso deberá indicar:

- evento origen;
- responsable;
- acciones;
- resultado esperado.

Entregables:

- procesos documentados.

---

## 9. APIs

Objetivo:

Diseñar los contratos de integración entre frontend y backend.

Incluye:

- endpoints;
- requests;
- responses;
- validaciones;
- errores.

Entregables:

- contratos de API.

---

## 10. UX/UI

Objetivo:

Diseñar la experiencia de usuario.

Incluye:

- pantallas;
- navegación;
- componentes;
- validaciones visuales;
- mensajes de error;
- estados vacíos;
- estados de carga.

Entregables:

- diseño funcional de la interfaz.

---

## 11. Implementación

Objetivo:

Traducir el diseño aprobado a código.

Principios:

- implementar únicamente lo documentado;
- evitar cambios funcionales durante el desarrollo;
- respetar la arquitectura definida.

Entregables:

- funcionalidad implementada.

---

## 12. Quality Assurance (QA)

Objetivo:

Validar que la implementación cumple con el comportamiento documentado.

Incluye:

- pruebas funcionales;
- pruebas de regresión;
- validaciones de seguridad;
- validaciones de negocio.

Entregables:

- funcionalidad aprobada.

---

## 13. Documentación final

Objetivo:

Mantener la documentación como representación oficial del sistema.

Actividades:

- actualizar docs;
- actualizar docs/code;
- agregar ADR cuando corresponda;
- actualizar Términos y Condiciones si aplica;
- actualizar documentación legal cuando corresponda.

Entregables:

- documentación sincronizada con producción.

---

# Principios generales

Durante todo el proceso deberán respetarse las siguientes reglas:

- trabajar un único objetivo por sesión;
- evitar implementar funcionalidades parcialmente;
- reutilizar componentes existentes siempre que sea posible;
- no duplicar responsabilidades entre dominios;
- mantener una única fuente de verdad para cada dato;
- documentar antes de implementar.

---

# Principio final

En Dropit, el código es la implementación de una decisión previamente documentada.

Nunca el origen de la decisión.