# APIs Oficiales de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Este documento define las APIs oficiales del sistema.

Las APIs representan el contrato entre el frontend y el backend.

Su comportamiento debe permanecer estable.

---

# Principios

- Las APIs implementan reglas de negocio.
- Nunca confían en información enviada por el cliente.
- Toda validación crítica ocurre en servidor.
- Todas las respuestas deben ser consistentes.
- Toda modificación importante requiere autenticación.

---

# Flujo principal

| API | Responsabilidad |
|------|-----------------|
| POST /api/orders/create | Crear pedido |
| POST /api/orders/confirmado | Confirmar establecimiento |
| POST /api/orders/notificar-vendedor | Enviar código al vendedor |
| POST /api/orders/preview-vendedor | Validar recepción |
| POST /api/orders/recibido | Confirmar recepción |
| POST /api/orders/entregado | Confirmar entrega |

---

# Estructura estándar

Todas las APIs deberán cumplir:

## Entrada

- Validación de parámetros.
- Validación de autenticación.
- Validación de permisos.

## Proceso

- Ejecutar reglas de negocio.
- Actualizar base de datos.
- Registrar eventos.
- Ejecutar acciones adicionales.

## Salida

Respuesta consistente.

Ejemplo:

{
    success: true,
    data: ...
}

o

{
    success: false,
    error: ...
}

---

# Responsabilidades

## Frontend

- Capturar información.
- Mostrar resultados.
- Validaciones de UX.

## API

- Reglas del negocio.
- Seguridad.
- Persistencia.
- Integraciones.

## Base de datos

- Almacenamiento.
- Relaciones.
- Auditoría.