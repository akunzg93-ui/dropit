# Librerías Compartidas

> Documento Oficial  
> Última actualización: 27/08/2026

## Billing

`lib/billing/` concentra la lógica fiscal y económica reutilizable.

- `cfdi.ts`: parseo de CFDI y validaciones locales contra la operación.
- `getOrderServiceValue.ts`: reconstruye el valor real del servicio desde `coin_movimientos`/`coin_lotes`; no debe adivinar importes sin trazabilidad.
- `validateEstablishmentCfdi.ts`: valida propiedad, perfil fiscal, RFC emisor/receptor, monto y PAC/SAT; éxito deja `invoices.estado = emitida`. No libera el balance.
- `pac/provider.ts`: contrato independiente del PAC.
- `pac/factory.ts`: selección del proveedor.
- `pac/sw.ts`: adapter SW para autenticación, validación y capacidad de timbrado. La validación exige interpretar el estatus fiscal, no solo HTTP 200.
- `pac/swMapper.ts`: mapeo de payload genérico a SW.

## Principios

- Integraciones externas solo desde servidor.
- Credenciales PAC/CSD nunca en frontend ni documentación.
- Mantener separadas validación fiscal y liberación económica.
