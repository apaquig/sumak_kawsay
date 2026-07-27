import { Heart, X, Trash2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Language } from '../lib/i18n';

export interface SimpleProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  imageUrl: string;
  price?: number;
}

interface FavoritesDrawerProps {
  products: SimpleProduct[];
  lang: Language;
}

const STORAGE_FAVORITES = 'sumak_favorites_v1';

export default function FavoritesDrawer({ products, lang }: FavoritesDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadFavorites = () => {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES);
      if (raw) {
        setFavoriteIds(JSON.parse(raw));
      } else {
        setFavoriteIds([]);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadFavorites();

    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setFavoriteIds(customEvt.detail);
      } else {
        loadFavorites();
      }
    };

    window.addEventListener('sumak-favorites-updated', handleUpdate);
    window.addEventListener('storage', loadFavorites);

    return () => {
      window.removeEventListener('sumak-favorites-updated', handleUpdate);
      window.removeEventListener('storage', loadFavorites);
    };
  }, []);

  const removeFavorite = (productId: string) => {
    const updated = favoriteIds.filter((id) => id !== productId);
    setFavoriteIds(updated);
    try {
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sumak-favorites-updated', { detail: updated }));
    } catch (e) {
      console.warn(e);
    }
  };

  const favoritedProducts = products.filter((p) => favoriteIds.includes(p.id));

  const isEs = lang === 'es';
  const titleText = isEs ? 'Mis Favoritos' : 'My Favorites';
  const emptyText = isEs
    ? 'Aún no tienes piezas guardadas. Haz clic en el corazón ♥ en cualquier artesanía para guardarla aquí.'
    : 'No saved pieces yet. Click the heart ♥ on any craft to save it here.';

  const getProductUrl = (slug: string) =>
    isEs ? `/es/producto/${slug}/` : `/en/product/${slug}/`;

  const getShopUrl = () => (isEs ? '/es/tienda/' : '/en/shop/');

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center gap-1.5 rounded-full border border-wine-700/20 bg-wine-50 px-3 py-1.5 text-xs font-bold text-wine-900 transition hover:bg-wine-100 hover:border-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-700 focus:ring-offset-2"
        title={titleText}
        aria-label={titleText}
      >
        <Heart size={16} fill={favoriteIds.length > 0 ? '#881337' : 'none'} className="text-wine-700" />

        {favoriteIds.length > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-wine-700 text-[0.7rem] font-extrabold text-white">
            {favoriteIds.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
          <div
            className="relative flex h-screen w-full max-w-sm sm:max-w-md flex-col bg-white shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-charcoal-950/10 p-5 bg-white">
              <div className="flex items-center gap-2">
                <Heart size={22} fill="#881337" className="text-wine-700" />
                <h2 className="font-display text-2xl font-bold text-charcoal-950">{titleText}</h2>
                <span className="ml-1 rounded-full bg-wine-100 px-2.5 py-0.5 text-xs font-bold text-wine-900">
                  {favoritedProducts.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-charcoal-800/60 hover:bg-charcoal-950/5 hover:text-charcoal-950"
                aria-label={isEs ? 'Cerrar' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {/* List Container with min-h-0 for proper scrolling */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              {favoritedProducts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center px-4 py-12">
                  <div className="mb-4 grid size-16 place-items-center rounded-full bg-wine-50 text-wine-700">
                    <Heart size={32} />
                  </div>
                  <p className="text-sm leading-relaxed text-charcoal-800/70 max-w-xs">{emptyText}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoritedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group relative flex items-center gap-3.5 rounded-xl border border-charcoal-950/10 bg-ivory-50/80 p-3 transition hover:border-wine-700/40 hover:bg-white hover:shadow-sm"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 shrink-0 rounded-lg object-cover border border-charcoal-950/10 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-terracotta-500">{product.category}</p>
                        <h3 className="truncate text-sm font-bold text-charcoal-950">{product.name}</h3>
                        {product.price ? (
                          <p className="mt-0.5 text-xs font-extrabold text-wine-900">${product.price.toFixed(2)} USD</p>
                        ) : (
                          <p className="mt-0.5 text-xs font-bold text-wine-900">{isEs ? 'Consultar disponibilidad' : 'Ask for availability'}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={getProductUrl(product.slug)}
                          onClick={() => setIsOpen(false)}
                          className="grid size-8 place-items-center rounded-full bg-wine-700 text-white transition hover:bg-wine-800"
                          title={isEs ? 'Ver pieza' : 'View piece'}
                        >
                          <ArrowRight size={15} />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeFavorite(product.id)}
                          className="grid size-8 place-items-center rounded-full text-charcoal-800/40 hover:bg-rose-50 hover:text-rose-600 transition"
                          title={isEs ? 'Quitar de favoritos' : 'Remove favorite'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {favoritedProducts.length > 0 && (
              <div className="shrink-0 border-t border-charcoal-950/10 p-5 bg-white">
                <a
                  href={getShopUrl()}
                  onClick={() => setIsOpen(false)}
                  className="button-primary w-full text-center text-sm py-3 block"
                >
                  {isEs ? 'Explorar Colección Completa' : 'Explore Full Collection'}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
