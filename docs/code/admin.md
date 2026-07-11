# Módulo Administración

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

El módulo Administración concentra las herramientas de supervisión y configuración de la plataforma.

No participa directamente en el flujo operativo de un pedido.

Su responsabilidad es administrar la red Dropit.

---

# Responsabilidades

- Administrar usuarios.
- Administrar establecimientos.
- Administrar Coins.
- Administrar protecciones.
- Administrar retiros.
- Visualizar el mapa de la red.

---

# Pantallas

| Ruta | Responsabilidad |
|------|-----------------|
| /admin | Dashboard administrativo |
| /admin/usuarios | Administración de usuarios |
| /admin/establecimientos | Administración de establecimientos |
| /admin/mapa | Mapa general |
| /admin/coins | Administración de Coins |
| /admin/proteccion | Configuración de protección |
| /admin/retiros | Administración de retiros |

---

# Observaciones

El administrador no sustituye a los actores del negocio.

Su función es supervisar y configurar la plataforma.

---

# Pantalla: Dashboard administrativo

## Ruta

`/admin`

## Responsabilidad

Muestra una vista general de la operación de Dropit y ofrece accesos rápidos a los módulos administrativos.

## Métricas

- Establecimientos registrados.
- Pedidos.
- Incidencias.
- Saldo pendiente para establecimientos.
- Retiros pendientes.

## Tablas consultadas

- establecimientos
- pedidos
- incidencias
- balance_movimientos
- retiros

## Accesos rápidos

- Retiros.
- Establecimientos.
- Pedidos.
- Coins.

---

# Pantalla: Protección Dropit

## Ruta

`/admin/proteccion`

## Responsabilidad

Permite configurar la protección opcional de pedidos.

## Configuraciones

- Activar o desactivar protección.
- Definir porcentaje de cobro.
- Definir valor máximo asegurable.

## Tabla utilizada

- dropit_config

## Claves administradas

- proteccion_enabled
- proteccion_porcentaje
- proteccion_valor_maximo

## Resultado

Los cambios afectan la opción de protección mostrada al vendedor al crear un pedido.

---

# Pantalla: Administración de Coins

## Ruta

`/admin/coins`

## Responsabilidad

Permite asignar Coins manualmente a vendedores y auditar esas asignaciones.

## Funcionalidades

- Consultar saldo disponible por vendedor.
- Asignar Coins small o medium.
- Registrar cantidad y motivo.
- Consultar Coins históricamente asignadas por admin.
- Consultar Coins disponibles y consumidas.
- Revisar historial de asignaciones manuales. :contentReference[oaicite:0]{index=0}

## APIs utilizadas

- `POST /api/orders/coins/admin-resumen`
- `POST /api/orders/coins/admin-asignar`

## Validaciones

- Sesión válida de administrador.
- Cantidad mayor a cero.
- Motivo obligatorio.
- Vendedor válido. :contentReference[oaicite:1]{index=1}

## Información mostrada

- Vendedor.
- Coins small disponibles.
- Coins medium disponibles.
- Histórico asignado por admin.
- Coins admin disponibles.
- Coins admin consumidas.
- Fecha, cantidad y motivo de cada asignación. :contentReference[oaicite:2]{index=2}