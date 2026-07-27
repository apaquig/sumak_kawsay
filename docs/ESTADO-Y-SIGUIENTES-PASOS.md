# Estado del proyecto

## Implementado en esta base

- Monorepo con tres proyectos independientes: storefront, admin y API.
- Astro, React, TypeScript y Tailwind CSS.
- Hero futurista sin 3D, con fotografia editorial optimizada, composicion adaptable y animaciones CSS respetuosas de la reduccion de movimiento.
- Direccion visual negro-vino, terracota, marfil y dorado con el origen Saraguro integrado en la narrativa principal.
- Catalogo bilingue en rutas `/es/` y `/en/`.
- Fichas de producto indexables sin depender de JavaScript.
- SEO tecnico: canonical, hreflang, Open Graph, JSON-LD, robots, sitemaps y `llms.txt`.
- Catalogo JSON publico de solo lectura.
- Probador para collares con camara, carga de foto y ajustes manuales locales.
- Carga diferida de MediaPipe al abrir el probador.
- Panel para editar contenido, traducciones, medios, 3D y probador.
- Modelo MongoDB y endpoints de administracion y catalogo.
- Proveedor LibreTranslate con terminos protegidos.
- Firmas de carga para imagenes y modelos en Cloudinary.
- Docker Compose para MongoDB, LibreTranslate y API.
- Prueba visual automatizada en escritorio y movil.

## Requiere datos o credenciales reales

- Numero de WhatsApp y enlaces definitivos de redes sociales.
- Cuenta y credenciales de Cloudinary.
- Contenido real de productos, dimensiones, materiales, precios y disponibilidad.
- Autorizacion y datos verificados de personas artesanas.
- Modelos GLB optimizados y sus posters.
- Dominio de produccion y configuracion de despliegue.

## Siguiente fase tecnica

1. Agregar autenticacion y roles al panel administrativo.
2. Incluir localmente el modelo Face Landmarker de MediaPipe y conectar el ajuste automatico del collar.
3. Conectar el storefront a MongoDB mediante la API o un proceso de generacion estatica.
4. Implementar subida directa firmada a Cloudinary desde el panel.
5. Agregar historial editorial, perfiles autorizados y redirecciones de slugs.
6. Ejecutar Lighthouse, axe, pruebas de teclado y pruebas de integracion con los servicios levantados.

La traduccion automatica debe seguir tratandose como borrador. Una version inglesa solo se publica cuando el estado sea `approved`.
