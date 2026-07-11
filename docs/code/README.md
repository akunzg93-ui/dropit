# Mapa del Código de Dropit

> Documento Oficial  
> Versión: 1.0  
> Estado: En construcción  
> Última actualización: 11/07/2026

---

# Objetivo

Este directorio documenta la organización real del código de Dropit.

Su propósito es permitir que cualquier desarrollador pueda identificar rápidamente:

- dónde se encuentra cada módulo;
- qué responsabilidad tiene;
- qué rutas utiliza;
- qué APIs consume;
- qué tablas modifica;
- qué estados del pedido intervienen;
- qué integraciones externas utiliza.

Esta documentación describe la implementación actual.

No reemplaza a la arquitectura oficial ubicada en `docs/01-ARQUITECTURA.md`.

---

# Regla principal

La documentación del código explica responsabilidades y relaciones.

No debe copiar archivos completos ni repetir la implementación línea por línea.

---

# Índice

| Documento | Contenido |
|---|---|
| APP | Estructura general de la carpeta `app` |
| API | API Routes y contratos internos |
| LIB | Clientes, helpers y utilidades compartidas |
| VENDEDOR | Módulo del vendedor |
| CLIENTE | Módulo del cliente |
| ESTABLECIMIENTO | Módulo del establecimiento |
| ADMIN | Módulo administrativo |
| AUTH | Autenticación, sesiones y roles |
| PAYMENTS | Stripe, compra y consumo de coins |
| EMAILS | Correos y notificaciones |
| MAPS | Mapas, geocodificación y distancias |
| SUPABASE | Auth, base de datos, RLS, RPC y Edge Functions |

---

# Mantenimiento

Cuando se agregue, elimine o modifique una ruta, API o módulo importante, deberá actualizarse el documento correspondiente.

Una funcionalidad no se considera cerrada hasta que su documentación de código esté actualizada.