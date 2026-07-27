import { Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminGalleryItem } from '../types';
import ConfirmModal from './ConfirmModal';

interface Props {
  items: AdminGalleryItem[];
  selectedId?: string;
  onSelect: (item: AdminGalleryItem) => void;
  onDelete: (id: string) => void;
}

const categoryLabels: Record<AdminGalleryItem['category'], string> = {
  fairs: 'Ferias',
  craft: 'Proceso Artesanal',
  artisans: 'Artesanos',
};

export default function GalleryTable({ items, selectedId, onSelect, onDelete }: Props) {
  const [itemToDelete, setItemToDelete] = useState<AdminGalleryItem | null>(null);

  if (!items.length) {
    return (
      <div className="grid min-h-64 place-items-center border-y border-charcoal-950/10 bg-white text-center">
        <div>
          <ImageIcon className="mx-auto text-charcoal-800/35" size={32} />
          <p className="mt-3 font-bold">No hay elementos en la galería con este filtro</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (event: React.MouseEvent, item: AdminGalleryItem) => {
    event.stopPropagation();
    setItemToDelete(item);
  };

  return (
    <>
      <ConfirmModal
        show={itemToDelete !== null}
        title="Confirmar eliminación"
        message={
          itemToDelete
            ? `¿Estás seguro de que deseas eliminar «${
                itemToDelete.translations.es.title || 'este elemento'
              }»?`
            : ''
        }
        onConfirm={() => {
          if (itemToDelete) {
            onDelete(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
      {/* Mobile view */}
      <div className="divide-y divide-charcoal-950/8 border-y border-charcoal-950/10 bg-white sm:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="grid min-h-24 w-full grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-ivory-100 cursor-pointer"
          >
            <span className="grid size-12 place-items-center overflow-hidden rounded border border-charcoal-950/10 bg-ivory-100">
              {item.imageUrl ? (
                <img className="size-full object-cover" src={item.imageUrl} alt="" />
              ) : (
                <ImageIcon size={18} className="text-charcoal-800/35" />
              )}
            </span>
            <span className="min-w-0">
              <strong className="block text-sm leading-5 truncate">{item.translations.es.title || 'Sin título'}</strong>
              <small className="mt-0.5 block font-semibold text-terracotta-500 text-[0.7rem] uppercase">
                {item.year}
              </small>
              <small className="mt-0.5 block truncate text-[0.67rem] text-charcoal-800/50">
                {item.translations.es.location || 'Sin ubicación'}
              </small>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid min-h-9 min-w-9 place-items-center rounded text-charcoal-800/40 hover:bg-rose-50 hover:text-rose-600 transition"
                onClick={(e) => handleDeleteClick(e, item)}
                aria-label="Eliminar"
              >
                <Trash2 size={16} />
              </button>
              <div className="grid size-8 place-items-center rounded bg-ivory-100 text-wine-700">
                <Pencil size={15} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden overflow-x-auto border-y border-charcoal-950/10 bg-white sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-[#f2f2ef] text-[0.68rem] uppercase tracking-[0.1em] text-charcoal-800/60">
            <tr>
              <th className="px-5 py-3 font-extrabold">Título / Info</th>
              <th className="px-4 py-3 font-extrabold">Año</th>
              <th className="px-4 py-3 font-extrabold">Publicación</th>
              <th className="w-24"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-950/8">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`cursor-pointer ${selectedId === item.id ? 'bg-ivory-100/60' : 'hover:bg-[#fafaf8]'}`}
                onClick={() => onSelect(item)}
              >
                <td className="px-5 py-3">
                  <div className="flex min-h-11 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded border border-charcoal-950/10 bg-ivory-100">
                      {item.imageUrl ? (
                        <img className="size-full object-cover" src={item.imageUrl} alt="" />
                      ) : (
                        <ImageIcon size={18} className="text-charcoal-800/35" />
                      )}
                    </span>
                    <span className="min-w-0 max-w-xs">
                      <strong className="block text-sm truncate">{item.translations.es.title || 'Sin título'}</strong>
                      <small className="mt-0.5 block truncate text-[0.68rem] text-charcoal-800/55">
                        {item.translations.es.location}
                      </small>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-charcoal-800/75">{item.year}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      item.published ? 'text-andes-700' : 'text-charcoal-800/55'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${item.published ? 'bg-emerald-600' : 'bg-charcoal-800/25'}`} />
                    {item.published ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded hover:bg-rose-50 hover:text-rose-600 text-charcoal-800/40 transition"
                      onClick={(e) => handleDeleteClick(e, item)}
                      aria-label={`Eliminar ${item.translations.es.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded bg-wine-50 text-wine-700 hover:bg-wine-100 transition"
                      onClick={() => onSelect(item)}
                      aria-label={`Editar ${item.translations.es.title}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
