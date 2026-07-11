# Arquitectura Oficial de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Propósito

Este documento describe la arquitectura oficial de Dropit.

Su objetivo es definir cómo está construido el sistema, cuáles son las responsabilidades de cada componente y qué principios deben respetarse durante su evolución.

Este documento no describe la implementación de una funcionalidad específica.

Describe el diseño completo del sistema.

---

# Objetivos de la arquitectura

La arquitectura de Dropit busca cumplir cinco objetivos principales.

## 1. Simplicidad

Cada componente debe tener una única responsabilidad.

La complejidad debe mantenerse lo más baja posible.

---

## 2. Escalabilidad

El sistema debe poder crecer sin necesidad de reescribir su núcleo.

Nuevos módulos deberán integrarse sobre la arquitectura existente.

---

## 3. Mantenibilidad

El código debe ser fácil de entender, modificar y extender.

Una funcionalidad nueva nunca debe requerir comprender todo el sistema.

---

## 4. Seguridad

Toda operación importante debe validarse desde el servidor.

Nunca se confiará en información proveniente únicamente del cliente.

---

## 5. Experiencia de usuario

Las decisiones técnicas siempre deberán favorecer un flujo simple para el usuario final.

La complejidad pertenece al sistema, no al usuario.

---

# Arquitectura General

Dropit utiliza una arquitectura web basada en servicios.

```

```
┌──────────────────────────────┐
│          Cliente             │
│        (Navegador)           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          Next.js             │
│         Frontend UI          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         API Routes           │
│      Lógica de negocio       │
└──────────────┬───────────────┘
               │
      ┌────────┴─────────┐
      ▼                  ▼
┌──────────────┐   ┌──────────────┐
│  Supabase    │   │ Integraciones│
│ Base de Datos│   │ Stripe, Mail │
└──────────────┘   └──────────────┘
```

---

# Componentes principales

Actualmente Dropit se divide en cinco grandes componentes.

## Frontend

Responsable de:

- Interfaces de usuario.
- Formularios.
- Navegación.
- Validaciones básicas.
- Experiencia de usuario.

Tecnología:

- Next.js
- React
- Tailwind CSS

---

## Backend

Responsable de:

- Reglas de negocio.
- Validaciones críticas.
- Procesamiento del flujo.
- Integración con servicios externos.

Tecnología:

- API Routes de Next.js.

---

## Base de datos

Responsable de:

- Persistencia de información.
- Relaciones entre entidades.
- Historial.
- Seguridad mediante RLS.

Tecnología:

- Supabase PostgreSQL.

---

## Servicios externos

Actualmente existen las siguientes integraciones.

- Stripe.
- Servicio de correo.
- Mapbox.
- Supabase Auth.

---

## Infraestructura

El sistema se despliega sobre Vercel.

Supabase opera como proveedor de autenticación y base de datos.

---

# Principio arquitectónico principal

La lógica del negocio pertenece al servidor.

El cliente únicamente representa información y captura acciones del usuario.

Nunca deberán implementarse reglas críticas exclusivamente en el frontend.

---

# Estado del documento

Este documento será actualizado conforme evolucione la arquitectura del sistema.

---

# Arquitectura actual vs arquitectura objetivo

Dropit documentará dos niveles de arquitectura:

## Arquitectura actual

Describe cómo está construido el sistema hoy.

Esta sección refleja la implementación real del proyecto y debe mantenerse sincronizada con el código existente.

## Arquitectura objetivo

Describe hacia dónde debe evolucionar el sistema conforme Dropit crezca.

La arquitectura objetivo no implica una reestructura inmediata del código.

Cualquier reestructura deberá tratarse como una sesión separada, con análisis de riesgo, alcance definido y plan de reversión.

---

# Decisión arquitectónica

Dropit no reestructurará carpetas, rutas o módulos estables únicamente por limpieza.

Primero se documentará el sistema.

Después se evaluará si una reestructura aporta valor real al producto.

Todo cambio estructural deberá cumplir con los principios de Dropit:

- El flujo manda.
- Cambios reversibles.
- No optimizar lo inestable.
- Cierre obligatorio.

---

# Responsabilidades

Cada componente del sistema tiene una responsabilidad claramente definida.

## Frontend

Responsable de:

- Mostrar información.
- Capturar datos.
- Guiar al usuario.
- Validaciones de experiencia de usuario.

No implementa reglas críticas del negocio.

---

## API Routes

Responsables de:

- Ejecutar reglas del negocio.
- Validar permisos.
- Orquestar el flujo del pedido.
- Integrar servicios externos.

Representan la capa de aplicación del sistema.

---

## Base de datos

Responsable de:

- Persistencia.
- Relaciones.
- Integridad de los datos.
- Auditoría.

La base de datos no define el flujo del negocio.

---

## Servicios externos

Responsables de capacidades especializadas.

Actualmente:

- Supabase Auth
- Stripe
- Mapbox
- Servicio de correo

Cada integración debe permanecer desacoplada del resto del sistema.

---

# Flujo de una petición

El ciclo general de una petición es:

1. El usuario realiza una acción desde el Frontend.
2. Next.js envía la solicitud a una API Route.
3. La API valida autenticación y permisos.
4. La API ejecuta las reglas de negocio.
5. Se actualiza la base de datos.
6. Se registran eventos.
7. Se ejecutan acciones adicionales (correos, QR, etc.).
8. Se devuelve una respuesta al cliente.

Toda regla crítica deberá ejecutarse antes de responder al usuario.

---

# Seguridad

Dropit implementa una estrategia de seguridad por capas.

## Cliente

No se considera una fuente confiable.

Toda información enviada debe validarse nuevamente en servidor.

---

## API

Constituye la principal barrera de seguridad.

Valida:

- Autenticación.
- Permisos.
- Estados del flujo.
- Reglas de negocio.

---

## Base de datos

La base utiliza Row Level Security (RLS).

Las operaciones administrativas utilizan Service Role únicamente desde el servidor.

Nunca desde el cliente.

---

# Ambientes

Actualmente Dropit mantiene ambientes separados.

## Desarrollo (DEV)

Utilizado para nuevas funcionalidades y pruebas.

## Producción (PROD)

Contiene únicamente funcionalidades validadas.

Toda migración a producción deberá realizarse mediante un proceso controlado.

---

# Evolución de la arquitectura

La arquitectura podrá evolucionar conforme crezca el producto.

Sin embargo:

- El flujo principal tiene prioridad.
- No se realizarán refactors únicamente por limpieza.
- Toda modificación estructural deberá justificarse mediante una decisión arquitectónica.

La estabilidad del sistema prevalece sobre la perfección técnica.