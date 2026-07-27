import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  productId: string;
  addLabel: string;
  removeLabel: string;
}

const STORAGE_FAVORITES = 'sumak_favorites_v1';

export default function FavoriteButton({ productId, addLabel, removeLabel }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        setActive(list.includes(productId));
      }
    } catch (e) {
      console.warn(e);
    }
  }, [productId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES);
      let list: string[] = raw ? JSON.parse(raw) : [];

      if (list.includes(productId)) {
        list = list.filter((id) => id !== productId);
        setActive(false);
      } else {
        list.push(productId);
        setActive(true);
      }

      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('sumak-favorites-updated', { detail: list }));
    } catch (err) {
      console.warn('Favorite storage error:', err);
    }
  };

  const label = active ? removeLabel : addLabel;

  return (
    <button
      type="button"
      className={`grid min-h-11 min-w-11 place-items-center rounded border shadow-sm transition hover:scale-105 disabled:opacity-50 motion-reduce:transform-none ${
        active
          ? 'border-wine-700 bg-wine-700 text-white'
          : 'border-charcoal-950/15 bg-white/90 text-wine-700 hover:border-wine-700'
      }`}
      aria-label={label}
      aria-pressed={active}
      data-product-id={productId}
      onClick={toggleFavorite}
      title={label}
    >
      <Heart size={19} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
      <span className="sr-only" aria-live="polite">{active ? removeLabel : addLabel}</span>
    </button>
  );
}
