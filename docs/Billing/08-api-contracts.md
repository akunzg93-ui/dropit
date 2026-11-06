# Protección financiera V2 — Recepción y retiros

Estado: Implementado y validado en QA
Ambiente: QA
Producción: Pendiente
Fecha de cierre: 2026-10-15

## 1. Objetivo

Garantizar que la introducción del modelo financiero V2 no
modifique los movimientos históricos V1 y que ningún saldo V2
pueda retirarse mientras su determinación fiscal esté pendiente.

## 2. Versionamiento financiero

Las tablas `coin_lotes` y `balance_movimientos` incorporan
`modelo_financiero_version`.

Versiones:

- V1: modelo financiero histórico.
- V2: servicio con IVA desglosado, comisión sobre subtotal
  y determinación fiscal independiente.

Los registros históricos conservan V1.

## 3. Recepción de pedidos

Función:

`public.recibir_pedido_con_balance(bigint,text,numeric)`

La versión financiera se determina a partir del lote
de Coins utilizado por el pedido.

### V1

Se conserva el cálculo histórico.

Ejemplo Small:

- Monto bruto: $60.00
- Comisión Dropit: $6.00
- IVA comisión: $0.96
- Neto establecimiento: $53.04
- Estado: available

### V2

Ejemplo Small:

- Servicio subtotal: $60.00
- IVA servicio: $9.60
- Servicio total: $69.60
- Comisión Dropit: $6.00
- IVA comisión: $0.96
- Neto preliminar: $62.64
- Determinación fiscal: pendiente
- Estado: pending

El neto preliminar no constituye un saldo liquidable.

Las retenciones fiscales todavía no se encuentran implementadas.

## 4. Solicitud de retiros

Función:

`public.crear_retiro_desde_movimientos(uuid,bigint[])`

Reglas:

- Solo acepta movimientos con status = available.
- Para V2 exige determinación fiscal:
  determinado o no_sujeto.
- Para V2 exige neto_establecimiento positivo.
- Conserva validaciones de titularidad, cierre mensual,
  movimientos duplicados, retiros activos y datos bancarios.
- Conserva retiros multiestablecimiento.

## 5. Administración de retiros

Función:

`public.actualizar_retiro_admin(uuid,uuid,text,text)`

Se mantienen las transiciones:

- pending → approved
- pending → reversed
- approved → paid

Antes de aprobar o pagar:

- Los movimientos deben estar available.
- Los movimientos V2 deben tener determinación fiscal resuelta.
- Los movimientos V2 deben tener neto positivo.
- Los importes aplicados deben coincidir con los netos actuales.
- El total aplicado debe coincidir con el retiro.
- No pueden existir movimientos incompletos.

El pago continúa exigiendo referencia bancaria.

## 6. Seguridad

Las funciones de retiros fueron verificadas en QA.

Permisos:

- anon: sin EXECUTE
- authenticated: sin EXECUTE
- service_role: EXECUTE permitido

Se restringieron también las funciones:

- fn_marcar_balance_pagado(uuid)
- fn_marcar_balance_pagado(uuid,text)

Ambas tenían permisos excesivos.

El cambio de permisos está aplicado únicamente en QA.

## 7. Pruebas ejecutadas

### Recepción V1

Pedido 79:

- Versión 1
- Bruto $60.00
- Comisión $6.00
- IVA comisión $0.96
- Neto $53.04
- Estado available

Resultado: correcto.

### Recepción V2

Pedido 79 con versión de lote simulada temporalmente:

- Versión 2
- Subtotal $60.00
- IVA servicio $9.60
- Total $69.60
- Comisión $6.00
- IVA comisión $0.96
- Neto preliminar $62.64
- Determinación pendiente
- Estado pending

Resultado: correcto.

### Solicitud de retiro V2

Movimiento 52:

- Versión 2 simulada
- Estado pending
- Determinación pendiente

Resultado:

MOVIMIENTO_NO_ELEGIBLE

### Aprobación administrativa

Movimiento 51 y retiro temporal:

Resultado:

MOVIMIENTO_NO_ELEGIBLE

### Pago administrativo

Movimiento 51 y retiro temporal:

Resultado:

MOVIMIENTO_NO_ELEGIBLE

Todas las pruebas se ejecutaron con transacciones
revertidas mediante ROLLBACK.

## 8. Limitaciones actuales

Las protecciones están implementadas, pero V2 no debe
activarse todavía.

Pendientes:

1. Implementar determinación fiscal y retenciones.
2. Definir liberación de saldos V2.
3. Implementar compra de Coins V2.
4. Adaptar Stripe y acreditación de lotes.
5. Conciliar pagos, descuentos y subsidios Dropit.
6. Validar tratamiento fiscal con especialista SAT.
7. Probar integralmente el flujo V2.
8. Planear despliegue controlado a producción.

## 9. Criterio de cierre

Se considera completada en QA la etapa de:

PROTECCIÓN FINANCIERA V2

No se considera completada la implementación integral
del modelo financiero V2.

No se autoriza todavía la activación de V2 en producción.