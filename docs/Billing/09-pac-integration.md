# Billing - PAC Integration

## Objetivo

Definir la integración entre Billing y el Proveedor Autorizado de Certificación (PAC) para la emisión de los CFDI correspondientes a Dropit.

---

## Principios

- Dropit únicamente timbra los CFDI que le corresponden como emisor.
- Dropit no timbra los CFDI emitidos por los establecimientos.
- La integración deberá ser independiente del PAC seleccionado.
- El cambio de proveedor no deberá afectar el flujo funcional de Billing.

---

## Alcance

La integración con el PAC será utilizada para:

- emisión de CFDI;
- timbrado;
- obtención del UUID;
- generación de XML;
- generación de PDF;
- cancelaciones;
- consultas de estado cuando sean necesarias.

---

## Flujo

### 1. Solicitud

Billing determina que corresponde emitir un CFDI de Dropit.

---

### 2. Generación

Dropit construye la información necesaria para generar el CFDI.

---

### 3. Timbrado

Dropit envía la solicitud al PAC.

---

### 4. Respuesta

El PAC devuelve:

- UUID fiscal;
- XML timbrado;
- representación PDF (cuando aplique);
- resultado de la operación.

---

### 5. Almacenamiento

Dropit almacena:

- UUID;
- XML;
- PDF;
- fecha de emisión;
- estado.

---

### 6. Disponibilidad

La factura queda disponible para el vendedor.

---

## Cancelaciones

Cuando un CFDI de Dropit deba cancelarse:

- Billing solicitará la cancelación al PAC.
- Se almacenará el resultado.
- Se conservará el historial de la operación.

---

## Webhooks

Cuando el PAC los soporte, Billing podrá recibir eventos relacionados con:

- timbrado;
- cancelación;
- errores;
- cambios de estado.

Billing deberá validar la autenticidad de cada evento recibido antes de procesarlo.

---

## Independencia tecnológica

Billing no dependerá de un proveedor específico.

Toda integración deberá implementarse mediante una capa de abstracción que permita reemplazar el PAC sin modificar el resto del dominio.

---

## Principio

Billing controla el proceso de emisión de los CFDI de Dropit.

Los CFDI emitidos por establecimientos permanecen fuera del proceso de timbrado de la plataforma y únicamente son recibidos y validados para efectos de liquidación.