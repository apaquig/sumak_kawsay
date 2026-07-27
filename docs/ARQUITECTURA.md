# Arquitectura

## 1. Storefront

Responsable de la experiencia publica, SEO, GEO, rutas localizadas, catalogo, fichas de producto, visor 3D y probador virtual. Astro renderiza el contenido; React se reserva para islas interactivas.

## 2. Admin

Responsable de crear y editar productos, traducciones, medios, configuracion 3D y habilitacion del probador. Consume la API y muestra claramente los estados `pending`, `machine-translated` y `approved`.

## 3. API

Fuente central de datos y reglas. Guarda productos en MongoDB, firma cargas para Cloudinary y comunica con LibreTranslate. Solo publica productos aprobados mediante un catalogo de lectura.

## Flujo editorial

1. El administrador guarda el contenido original en espanol.
2. La API solicita un borrador ingles a LibreTranslate.
3. La traduccion queda marcada como `machine-translated`.
4. Una persona revisa y aprueba el contenido.
5. El storefront publica e indexa solo idiomas aprobados.

## Rendimiento

- El hero es HTML y CSS con una imagen WebP optimizada; no monta canvas ni librerias 3D.
- Los modelos GLB usan carga diferida.
- MediaPipe se importa al abrir el probador.
- El visor 3D solo se monta en fichas que tengan un modelo GLB habilitado.
