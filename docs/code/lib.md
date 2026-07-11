# Librerías Compartidas

> Documento Oficial
>
> Versión: 1.0

---

# Objetivo

La carpeta `lib/` concentra los servicios y utilidades reutilizables de Dropit.

No contiene pantallas.

No contiene reglas de presentación.

Su responsabilidad es encapsular lógica compartida.

---

# Componentes

## supabaseClient.ts

Cliente oficial de Supabase utilizado por el frontend.

---

## coins.ts

Funciones relacionadas con el sistema de Coins.

---

## email.ts

Servicio centralizado para envío de correos mediante Resend.

---

## emailTemplates/

Plantillas HTML reutilizables.

---

## roleLabels.ts

Conversión entre roles internos y nombres visibles para el usuario.

---

## utils.ts

Funciones auxiliares reutilizables.

---

# Principios

- No acceder directamente a servicios externos desde las pantallas.
- Centralizar integraciones.
- Evitar duplicar lógica.