# Módulo Cliente

> Documento Oficial  
> Versión: 1.1  
> Estado: En construcción  
> Última actualización: 18/07/2026

# Objetivo

El cliente selecciona el punto de entrega, consulta el tracking y recoge el pedido.

Los nombres técnicos históricos bajo `/comprador` se mantienen por estabilidad; toda UX visible utiliza **cliente**.

# Pantallas

| Ruta | Responsabilidad |
|---|---|
| `/comprador` | Selección de establecimiento |
| `/comprador/validar-pedido` | Validación de folio |
| `/track/[folio]` | Seguimiento público |

# Flujo

1. Validar folio.
2. Elegir entre establecimientos propuestos por el vendedor.
3. Confirmar el punto.
4. Esperar aceptación del establecimiento.
5. Consultar avance y plazos.
6. Recoger con código de entrega.

Si no recoge dentro de 48 horas desde `recibido_en`, el pedido inicia devolución al vendedor.

# Tracking

La pantalla pública muestra:

- estado actual;
- ruta normal o ruta de devolución;
- historial con descripciones y fechas;
- timer de 24 horas en `en_transito`;
- timer de 48 horas en `pendiente_recoleccion`;
- timer de 48 horas en `devolucion_pendiente`;
- aviso de `custodia_vencida`.

La consulta se realiza mediante `get_pedido_tracking`.
