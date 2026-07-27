# Sumak Kawsay

Plataforma bilingue para presentar y administrar artesanias elaboradas a mano en Saraguro, Loja, Ecuador.

## Proyectos

- `apps/storefront`: sitio publico Astro + React + Tailwind, con visor 3D opcional solo en productos configurados.
- `apps/admin`: panel administrativo React + Vite.
- `apps/api`: API Fastify + MongoDB + Cloudinary + LibreTranslate.

## Inicio rapido

```bash
cp .env.example .env
npm install
npm run dev
```

Servicios locales:

- Tienda: `http://localhost:4321`
- Administracion: `http://localhost:5173`
- API: `http://localhost:4000`

MongoDB y LibreTranslate pueden iniciarse con:

```bash
docker compose up -d mongodb libretranslate
```

## Principios del proyecto

- Contenido principal renderizado por Astro y disponible sin JavaScript.
- Rutas localizadas en espanol e ingles.
- El hero principal no usa Three.js ni canvas; las funciones 3D opcionales y MediaPipe se cargan unicamente cuando hacen falta.
- Traducciones automaticas tratadas como borradores revisables.
- Accesibilidad WCAG 2.2 AA como objetivo de producto.
- No se inventan precios, disponibilidad, testimonios ni datos culturales.

Consulta `docs/ARQUITECTURA.md` para el mapa tecnico y `docs/REQUISITOS-ORIGINALES.txt` para la especificacion recibida.
