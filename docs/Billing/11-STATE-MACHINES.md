# Billing - State Machines

## Objetivo

Definir las transiciones válidas de estado dentro del dominio Billing.

---

# 1. Invoice Request

## Estados

- `solicitada`
- `procesando`
- `parcial`
- `completada`
- `rechazada`

## Flujo

```text
solicitada
    ↓
procesando
    ↓
 ┌───────────────┐
 ↓               ↓
parcial       rechazada
 ↓
completada