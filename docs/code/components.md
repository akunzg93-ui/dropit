# Componentes

> Última actualización: 18/07/2026

# Componentes de negocio

Ubicación principal: `app/components` y componentes cercanos a sus módulos.

## CountdownTimer

Componente reutilizable para representar plazos operativos.

Responsabilidades:

- Recibir `startDate`, duración en horas, título y mensajes.
- Calcular el tiempo restante en el cliente.
- Mostrar días sólo cuando son mayores a cero.
- Mostrar horas y minutos; no muestra segundos.
- Mantener estilo azul consistente con Dropit.
- Mostrar mensaje informativo al vencer.

No ejecuta cancelaciones ni cambios de estado. El backend sigue siendo la autoridad.

## Otros componentes

- Navbar
- MobileBottomNav
- MapaEstablecimientos
- StarsPromedio
- RoleSwitcher
- SelectorHorario

# Componentes UI

Ubicación: `components/ui`.

Implementan presentación y no deben contener reglas críticas del negocio.
