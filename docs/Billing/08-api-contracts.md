# Billing - Use Cases

## Objetivo

Definir los casos de uso oficiales del dominio Billing.

Cada caso de uso describe el flujo completo desde que un usuario inicia una acción hasta que el proceso concluye.

---

# UC-001

## Solicitar factura

### Actor

Vendedor

### Precondiciones

- El pedido pertenece al vendedor.
- El servicio ya inició.
- Existe una Coin consumida.
- El plazo para solicitar factura continúa vigente.
- No existe otra solicitud para el mismo pedido.

### Flujo

1. El vendedor selecciona "Solicitar factura".
2. Billing obtiene los perfiles fiscales.
3. El vendedor selecciona un perfil.
4. Billing valida la solicitud.
5. Billing genera el Snapshot Fiscal.
6. Billing crea Invoice Request.
7. Billing bloquea temporalmente la liquidación cuando corresponda.
8. Billing inicia la emisión del CFDI de Dropit.
9. Billing solicita el CFDI al establecimiento.
10. El vendedor recibe la confirmación.

### Resultado

La solicitud queda registrada.

---

# UC-002

## Administrar perfiles fiscales

### Actor

Vendedor

### Flujo

- Crear perfil.
- Editar perfil.
- Seleccionar perfil predeterminado.
- Archivar perfil.

### Resultado

Los perfiles quedan disponibles para futuras solicitudes.

---

# UC-003

## Emitir factura Dropit

### Actor

Billing

### Evento

InvoiceRequested

### Flujo

1. Construir CFDI.
2. Enviar información al PAC.
3. Obtener UUID.
4. Guardar XML.
5. Guardar PDF.
6. Actualizar Invoice.

### Resultado

Factura Dropit disponible.

---

# UC-004

## Recibir factura del establecimiento

### Actor

Establecimiento

### Flujo

1. El establecimiento accede a la solicitud.
2. Sube XML.
3. Sube PDF.
4. Billing valida los documentos.
5. Billing actualiza Invoice.
6. Billing verifica si la liquidación puede liberarse.

### Resultado

Factura disponible para el vendedor.

---

# UC-005

## Liberar liquidación

### Actor

Billing

### Evento

EstablishmentInvoiceReceived

### Flujo

Billing verifica:

- solicitud de factura;
- estado de Invoice;
- reglas de negocio.

Si todas las condiciones se cumplen:

- Settlement cambia a `lista_pago`.

### Resultado

La liquidación queda lista para pago.

---

# UC-006

## Pagar establecimiento

### Actor

Billing

### Flujo

1. Billing ejecuta el pago.
2. Registra fecha.
3. Actualiza Settlement.
4. Registra historial.

### Resultado

Settlement finaliza en `pagada`.

---

# Principio

Cada caso de uso representa un proceso completo de negocio.

Las APIs, pantallas y procesos internos implementan estos casos de uso, pero no los sustituyen.