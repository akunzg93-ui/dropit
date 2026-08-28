# Billing - State Machines

> Última actualización: 27/08/2026

## Invoice del establecimiento

```text
pendiente
   │ carga XML/PDF
   ▼
procesando
   │
   ├── validación local/PAC correcta ──► emitida
   │
   └── validación rechazada ───────────► error

emitida ── cancelación futura ──► cancelada
```

`emitida` no modifica automáticamente el estado del balance.

## Balance financiero

El flujo actual inicia en:

```text
pending
```

Las transiciones de conciliación mensual/pago se implementarán como objetivo separado. No deben dispararse desde la validación del CFDI.
