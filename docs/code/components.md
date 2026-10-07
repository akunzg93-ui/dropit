# Componentes

> Última actualización: 05/10/2026

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

## HorariosEstablecimiento

Componente para configurar horarios semanales estructurados.

Responsabilidades:

- configurar horarios por día;
- permitir múltiples intervalos en un mismo día;
- representar días cerrados;
- reutilizar configuraciones entre días cuando la UX lo permita;
- entregar una estructura que pueda persistirse en `establecimiento_horarios`.

Los horarios son informativos y no representan disponibilidad en tiempo real.

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


## FlowGuideModal

Modal reutilizable para hitos y siguientes pasos. Se utiliza cuando una acción importante terminó correctamente y Dropit necesita comunicar qué ocurrió y qué debe hacer el usuario después. Admite título y subtítulo, dato principal, pasos siguientes, recomendación, feedback y múltiples acciones. La lógica específica del negocio debe permanecer fuera del componente.

## OnboardingModal

Modal reutilizable para experiencias educativas por pasos. Admite paso actual y total, contenido específico por paso, regresar, avanzar, omitir y finalizar. Su presentación funciona como bottom sheet en móvil y modal centrado en escritorio. La persistencia del onboarding no pertenece al componente; la pantalla que lo utiliza decide cómo consultar y guardar el estado.
