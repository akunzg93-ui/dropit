# Decisiones de Arquitectura (ADR)

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Este documento registra las decisiones arquitectónicas importantes de Dropit.

Una ADR (Architecture Decision Record) documenta:

- El problema.
- Las alternativas.
- La decisión tomada.
- El motivo.
- Las consecuencias.

Las ADR representan la memoria técnica del proyecto.

---

# Estado de las ADR

| Estado | Significado |
|---------|-------------|
| Propuesta | En discusión |
| Aprobada | Forma parte de la arquitectura oficial |
| Reemplazada | Existe una decisión más reciente |
| Obsoleta | Ya no aplica |

---

# ADR-001

## Título

El pedido se modela como una máquina de estados.

## Estado

Aprobada.

## Contexto

El flujo del pedido constituye el núcleo del sistema.

Era necesario definir una forma consistente de controlar su evolución.

## Alternativas

- Estados independientes.
- Máquina de estados.

## Decisión

El pedido se implementa como una máquina de estados.

Las reglas de negocio pertenecen a las transiciones.

No a los estados.

## Consecuencias

- Mayor claridad.
- Flujo controlado.
- Fácil incorporación de nuevos estados.

# ADR-002

## Título

Mantener bigint como identificador de pedidos y establecimientos.

## Estado

Aprobada.

## Contexto

Se intentó migrar a UUID.

La migración rompió múltiples flujos del sistema.

## Decisión

Los IDs de pedidos y establecimientos permanecerán como bigint.

Cualquier migración futura requerirá un RFC.

## Consecuencias

- Compatibilidad con el sistema actual.
- Menor riesgo.
- Evita migraciones innecesarias.

# ADR-003

## Título

Consumir la coin al crear el pedido.

## Estado

Aprobada.

## Contexto

Era necesario definir cuándo debía consumirse una coin.

## Alternativas

- Al crear.
- Al entregar.
- Al recibir.

## Decisión

La coin se consume al crear el pedido.

## Motivo

La creación del pedido representa el uso del servicio.

## Consecuencias

- Regla simple.
- No depende del resultado final del flujo.

# ADR-004

## Título

El cliente elige el establecimiento.

## Estado

Aprobada.

## Contexto

El vendedor propone opciones.

El cliente conoce cuál le resulta más conveniente.

## Decisión

La selección final pertenece al cliente.

## Consecuencias

- Mayor flexibilidad.
- Mejor experiencia de usuario.

# ADR-005

## Título

No realizar refactors estructurales durante el desarrollo funcional.

## Estado

Aprobada.

## Contexto

El proyecto continúa creciendo.

Modificar la arquitectura durante el desarrollo incrementa el riesgo.

## Decisión

Primero estabilizar.

Después refactorizar.

## Consecuencias

- Menor riesgo.
- Mayor velocidad.
- Cambios controlados.