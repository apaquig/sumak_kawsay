import type { Language } from './i18n';

export interface GalleryItem {
  id: string | number;
  category: 'fairs' | 'craft' | 'artisans';
  title: string;
  description: string;
  tag: string;
  location: string;
  year: string;
  image: string;
  order?: number;
}

const FALLBACK_GALLERY: Record<Language, GalleryItem[]> = {
  es: [
    {
      id: 'gal-001',
      category: 'fairs',
      title: 'Feria Nacional de Artesanías de Saraguro',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: '2025 - 2026',
      image: '/images/feria-saraguro.jpg',
      tag: 'Feria Nacional',
      description: 'Exhibición oficial del stand artesanal de Sumak Kawsay con joyería de mullos de vidrio calibrados y demostración de tejido en vivo.',
    },
    {
      id: 'gal-002',
      category: 'fairs',
      title: 'Exposición de Arte Ancestral y Moda Andina',
      location: 'Quito · Ecuador 🇪🇨',
      year: '2025',
      image: '/images/feria-quito.jpg',
      tag: 'Exposición Quito',
      description: 'Presentación de collares Wallka y pulseras geométricas tradicionales ante diseñadores y visitantes en el centro histórico de Quito.',
    },
    {
      id: 'gal-003',
      category: 'fairs',
      title: 'Encuentro Internacional de Joyería Artesanal',
      location: 'Nueva York · EE.UU. 🇺🇸',
      year: '2026',
      image: '/images/feria-usa.jpg',
      tag: 'Exposición USA',
      description: 'Muestra internacional de la artesanía Kichwa Saraguro para la comunidad ecuatoriana y coleccionistas en Estados Unidos.',
    },
    {
      id: 'gal-004',
      category: 'artisans',
      title: 'El Arte del Tejido Mullo a Mullo',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: 'Tradición Viva',
      image: '/images/hero-artesana-saraguro.png',
      tag: 'Fundadora Yurak Macas',
      description: 'Yurak Macas tejiendo a mano con paciencia cada collar, pulsera y accesorio en su mesa de trabajo en Saraguro.',
    },
    {
      id: 'gal-005',
      category: 'craft',
      title: 'Collar Wallka de Alta Densidad',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: 'Colección 2026',
      image: '/images/hero-collar.webp',
      tag: 'Joyería Fina',
      description: 'Detalle macro de la simetría y armonía de color en mullos de vidrio seleccionados pieza por pieza.',
    },
    {
      id: 'gal-006',
      category: 'craft',
      title: 'Manillas y Gargantillas Geométricas',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: 'Colección 2026',
      image: '/images/manilla-geometrica.webp',
      tag: 'Geometría Sagrada',
      description: 'Simbología ancestral andina representada en tramas de pulseras flexibles de gran durabilidad.',
    },
  ],
  en: [
    {
      id: 'gal-001',
      category: 'fairs',
      title: 'National Saraguro Artisan Fair',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: '2025 - 2026',
      image: '/images/feria-saraguro.jpg',
      tag: 'National Fair',
      description: 'Official exhibition booth featuring glass beadwork jewelry and live traditional weaving demonstrations.',
    },
    {
      id: 'gal-002',
      category: 'fairs',
      title: 'Ancestral Art & Andean Fashion Expo',
      location: 'Quito · Ecuador 🇪🇨',
      year: '2025',
      image: '/images/feria-quito.jpg',
      tag: 'Quito Expo',
      description: 'Showcasing Wallka necklaces and geometric bracelets to art lovers in historic Quito.',
    },
    {
      id: 'gal-003',
      category: 'fairs',
      title: 'International Artisan Jewelry Showcase',
      location: 'New York · USA 🇺🇸',
      year: '2026',
      image: '/images/feria-usa.jpg',
      tag: 'USA Exhibition',
      description: 'Bringing Saraguro heritage glass bead jewelry to collectors and the Ecuadorian community in the United States.',
    },
    {
      id: 'gal-004',
      category: 'artisans',
      title: 'The Art of Bead-by-Beaded Hand Weaving',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: 'Living Heritage',
      image: '/images/hero-artesana-saraguro.png',
      tag: 'Founder Yurak Macas',
      description: 'Master artisan handweaving traditional Saraguro beadwork with high-strength thread.',
    },
    {
      id: 'gal-005',
      category: 'craft',
      title: 'High-Density Wallka Necklace',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: 'Collection 2026',
      image: '/images/hero-collar.webp',
      tag: 'Fine Jewelry',
      description: 'Macro view of symmetry and vibrant color harmonies in handpicked glass beads.',
    },
    {
      id: 'gal-006',
      category: 'craft',
      title: 'Geometric Bracelets & Necklaces',
      location: 'Saraguro, Loja · Ecuador 🇪🇨',
      year: 'Collection 2026',
      image: '/images/manilla-geometrica.webp',
      tag: 'Sacred Geometry',
      description: 'Andean sacred symbols captured in durable handwoven beadwork.',
    },
  ],
};

export async function getGalleryItems(lang: Language): Promise<GalleryItem[]> {
  const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/v1/gallery?lang=${lang}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch (e) {
    console.warn('[galeria] API no disponible, se usa catálogo de respaldos de la base de datos:', e);
  }
  return FALLBACK_GALLERY[lang] || FALLBACK_GALLERY.es;
}
