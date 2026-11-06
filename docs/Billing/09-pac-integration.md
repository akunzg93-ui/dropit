# Billing - PAC Integration

> Última actualización: 27/08/2026

## Proveedor actual

QA utiliza SW Sapien mediante una capa de abstracción (`PacProvider`). El dominio no debe depender directamente de SW fuera del adapter.

## Emisión

La capacidad de timbrado JSON con SW fue probada en sandbox. Se conserva para CFDI que Dropit deba emitir en el futuro. No se usa actualmente para emitir automáticamente el CFDI del establecimiento.

## Validación de CFDI externo

El establecimiento emite su CFDI fuera de Dropit. Dropit envía el XML al PAC para validación fiscal después de superar las validaciones locales.

Con SW se utiliza `/validate/cfdi`. El adapter no debe considerar válido un CFDI únicamente porque la petición HTTP sea 200. Debe interpretar la respuesta fiscal y aceptar únicamente un comprobante exitoso, localizado y `Vigente` ante SAT.

## Responsabilidades

PAC/SW:
- validación fiscal y consulta SAT;
- timbrado cuando Dropit sea emisor;
- UUID/XML de emisiones propias.

Dropit:
- validación de correspondencia con la operación;
- almacenamiento privado de XML/PDF;
- estados internos;
- trazabilidad y conciliación.

## PDF

Para la prueba QA se comprobó la generación de representación PDF a partir del XML mediante SW. La arquitectura objetivo mantiene al XML timbrado como documento fiscal fuente y permite que Dropit genere su propia representación PDF para documentos propios, evitando dependencia visual del PAC.

## Seguridad

Credenciales, tokens y CSD nunca deben exponerse al cliente ni persistirse en documentación. Toda interacción con PAC se ejecuta en servidor mediante variables de entorno.

## Prueba de SW Test — 05/11/2026

Se utilizó el script QA existente `scripts/qa/emitir-cfdi-establecimiento-test.ts` con `BILLING_PAC_ENV=test` y `BILLING_PAC_PROVIDER=sw` para timbrar un comprobante de prueba destinado al pedido 85. Resultado: UUID `76C82B00-7655-46CB-9F87-6A367757111E`, XML `EST85-1793925191537.xml` y total `$60.00 MXN`.

La ejecución independiente del script requiere acceso a las variables de autenticación `SW_USER` y `SW_PASSWORD` en el proceso Node. No registrar credenciales ni tokens en documentación. La emisión de este CFDI fue una **preparación manual de prueba QA**, no una emisión automática del establecimiento dentro de Dropit.
