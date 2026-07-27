import { Edit2, Trash2 } from 'lucide-react';
import type { AdminCategory } from '../types';

interface Props {
  categories: AdminCategory[];
  selectedId?: string;
  onSelect: (category: AdminCategory) => void;
  onDelete: (id: string) => void;
}

export default function CategoryTable({ categories, selectedId, onSelect, onDelete }: Props) {
  if (categories.length === 0) {
    return (
      <div className="rounded border border-charcoal-950/10 bg-white px-4 py-12 text-center">
        <p className="text-sm text-charcoal-800/60">No se encontraron categorías.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-charcoal-950/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-charcoal-950/10 bg-charcoal-950/5">
          <tr>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Descripción</th>
            <th className="px-4 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal-950/5">
          {categories.map((category) => (
            <tr
              key={category.id}
              className={`group transition-colors hover:bg-ivory-100/50 ${
                selectedId === category.id ? 'bg-ivory-100' : ''
              }`}
            >
              <td className="px-4 py-3 font-medium">
                {category.translations.es.name || '(Sin nombre)'}
              </td>
              <td className="px-4 py-3 text-charcoal-800/60 max-w-xs truncate">
                {category.translations.es.description || '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(category)}
                    className="p-1.5 text-charcoal-800/60 hover:text-wine-700 transition"
                    title="Editar categoría"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Eliminar esta categoría? Esto podría romper productos que la usan.')) {
                        onDelete(category.id);
                      }
                    }}
                    className="p-1.5 text-charcoal-800/60 hover:text-terracotta-500 transition"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
