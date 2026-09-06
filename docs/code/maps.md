# Sistema de Mapas

> Documento Oficial

---

# Objetivo

Administrar la ubicación geográfica de establecimientos y apoyar la selección del punto de entrega.

---

# Tecnologías

- Leaflet
- Geocodificación
- Geolocalización del navegador

---

# Componentes

## MapaEstablecimientos

Mapa principal utilizado en:

- Crear pedido.
- Registro de establecimientos.
- Selección del punto de entrega.

---

# Funcionalidades

- Mostrar establecimientos.
- Seleccionar ubicaciones.
- Calcular distancias.
- Obtener ubicación actual.
- Buscar direcciones.

---

# Principios

El mapa es un apoyo visual.

Las decisiones del negocio nunca dependen exclusivamente de la ubicación geográfica.

## Tracking y scroll

En mapas embebidos dentro de páginas de tracking, `scrollWheelZoom` permanece desactivado para evitar que Leaflet procese eventos de rueda durante desmontajes/remounts del componente y para no capturar accidentalmente el scroll de la página. El zoom táctil y los controles del mapa permanecen disponibles.
