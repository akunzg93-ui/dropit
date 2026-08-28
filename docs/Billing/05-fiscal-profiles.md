# Billing - Fiscal Profiles

> Última actualización: 27/08/2026

## Objetivo

Guardar datos fiscales reutilizables a nivel de cuenta.

## Modelo

`fiscal_profiles.user_id` identifica al propietario del perfil. Un mismo usuario puede mantener múltiples perfiles activos y uno predeterminado.

Campos principales:

- RFC;
- razón social;
- código postal fiscal;
- régimen fiscal;
- uso CFDI;
- email;
- perfil predeterminado;
- activo.

## Vendedor

El vendedor selecciona un perfil al solicitar factura. `invoice_requests.fiscal_data_snapshot` conserva los datos usados en ese momento.

## Establecimiento

`establecimientos.fiscal_profile_id` apunta al perfil fiscal que el establecimiento utilizará como emisor. El perfil debe pertenecer al mismo `usuario_id` propietario del establecimiento.

Los perfiles son de cuenta, no copias propias de cada establecimiento. La UX puede preseleccionar el predeterminado, pero debe confirmar cuál perfil se asocia al establecimiento.

El onboarding fiscal puede asociar el perfil después del alta operativa. Un establecimiento sin perfil fiscal no puede validar un CFDI como emisor.
