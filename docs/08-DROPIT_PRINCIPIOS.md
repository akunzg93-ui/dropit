# Principios de Desarrollo de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Introducción

Este documento define los principios que guían el desarrollo de Dropit.

No son recomendaciones.

Son reglas de diseño utilizadas para tomar decisiones cuando existen varias alternativas posibles.

Cuando un cambio contradiga alguno de estos principios, deberá justificarse explícitamente.

Estos principios tienen prioridad sobre preferencias personales de desarrollo.

---

# Principio 0
## El flujo manda.

La prioridad absoluta del proyecto es mantener funcionando correctamente el flujo principal del producto.

Si una mejora rompe el flujo principal, la mejora debe descartarse o posponerse.

Siempre es preferible un flujo sencillo que funciona, a uno complejo con múltiples excepciones.

---

# Principio 1
## Definición de terminado.

Una funcionalidad únicamente se considera terminada cuando cumple con todas las siguientes condiciones:

- Implementación completa.
- Probada funcionalmente.
- Integrada con el flujo existente.
- Sin romper funcionalidades anteriores.
- Documentación actualizada.
- Publicada en GitHub.

Hasta entonces la funcionalidad permanece en desarrollo.

---

# Principio 2
## Un solo objetivo por sesión.

Cada sesión de desarrollo debe concentrarse en un único eje.

Ejemplos:

- Base de datos.
- UX.
- Backend.
- API.
- Flujo.
- Seguridad.

Evitar trabajar simultáneamente en múltiples áreas reduce errores y facilita las pruebas.

---

# Principio 3
## No optimizar lo que aún no es estable.

Primero debe existir una solución funcional.

Después una solución correcta.

Finalmente una solución elegante.

Nunca debe invertirse ese orden.

---

# Principio 4
## Cambios reversibles.

Todo cambio importante debe poder revertirse con facilidad.

Cuando exista incertidumbre, se preferirán implementaciones aisladas sobre modificaciones profundas del sistema.

---

# Principio 5
## La lógica debe ser visible.

Dropit favorece procesos explícitos sobre automatismos difíciles de entender.

Las reglas importantes deben estar escritas de forma clara tanto en el código como en la documentación.

---

# Principio 6
## Las decisiones tienen fecha de revisión.

Las decisiones técnicas no son permanentes.

Cada decisión puede revisarse cuando cambien las necesidades del producto.

No existen soluciones intocables.

---

# Principio 7
## Construcción por capas.

Las funcionalidades se desarrollan en el siguiente orden:

1. Reglas de negocio.
2. Backend.
3. Base de datos.
4. APIs.
5. Frontend.
6. UX.
7. Optimización.

Cada capa depende de la estabilidad de la anterior.

---

# Principio 8
## Sistema sobre impulso.

Las decisiones deben responder al sistema completo y no únicamente a la necesidad inmediata.

Cada nueva funcionalidad debe contribuir a construir una plataforma más consistente.

---

# Principio 9
## Si algo se rompe dos veces, debe simplificarse.

Cuando una misma parte del sistema genera errores repetitivos, la prioridad no es corregir el error sino replantear el diseño.

La simplicidad tiene prioridad sobre la complejidad.

---

# Principio 10
## Cierre obligatorio.

Ningún desarrollo termina al compilar correctamente.

El ciclo completo es:

Idea

↓

Diseño

↓

Implementación

↓

Pruebas

↓

GitHub

↓

Documentación

↓

Cierre

---

# Filosofía técnica

Dropit prioriza:

- Simplicidad.
- Legibilidad.
- Seguridad.
- Escalabilidad.
- Mantenibilidad.

Cada decisión debe evaluarse considerando estos cinco pilares.

---

# Filosofía del producto

Dropit no inventa un comportamiento.

Formaliza un comportamiento que ya existe.

Cada nueva funcionalidad debe reforzar esta idea.

---

# Documentación

La documentación forma parte del producto.

Un cambio sin documentación se considera un cambio incompleto.

La carpeta `/docs` representa la fuente oficial de conocimiento del proyecto.

---

# Vigencia

Este documento deberá revisarse únicamente cuando exista un cambio importante en la filosofía de desarrollo de Dropit.