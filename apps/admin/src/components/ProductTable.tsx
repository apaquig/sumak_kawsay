import { Box, Pencil } from 'lucide-react';
import type { AdminProduct } from '../types';

interface Props {
  products: AdminProduct[];
  selectedId?: string;
  onSelect: (product: AdminProduct) => void;
}

export default function ProductTable({ products, selectedId, onSelect }: Props) {
  if (!products.length) {
    return <div className="grid min-h-64 place-items-center border-y border-charcoal-950/10 bg-white text-center"><div><Box className="mx-auto text-charcoal-800/35" /><p className="mt-3 font-bold">No hay productos con este filtro</p></div></div>;
  }

  return (
    <>
      <div className="divide-y divide-charcoal-950/8 border-y border-charcoal-950/10 bg-white sm:hidden">
        {products.map((product) => (
          <button key={product.id} type="button" className="grid min-h-24 w-full grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-ivory-100" onClick={() => onSelect(product)}>
            <span className="grid size-12 place-items-center overflow-hidden rounded border border-charcoal-950/10 bg-ivory-100">
              {product.imageUrl ? <img className="size-full object-cover" src={product.imageUrl} alt="" /> : <Box size={18} className="text-charcoal-800/35" />}
            </span>
            <span className="min-w-0">
              <strong className="block text-sm leading-5">
                {product.translations.es.name || 'Producto sin nombre'}
                {product.featured && <span className="ml-1 text-amber-500">★</span>}
              </strong>
              <span className="mt-1 flex items-center gap-2 flex-wrap">
                <small className="truncate font-mono text-[0.67rem] text-charcoal-800/50">{product.slug || 'sin-slug'}</small>
                {(product.priceEcuador !== undefined || product.priceUSA !== undefined) && (
                  <span className="text-xs font-semibold text-wine-900">${product.priceEcuador?.toFixed(2)} / ${product.priceUSA?.toFixed(2)}</span>
                )}
              </span>
            </span>
            <div className="grid size-8 place-items-center rounded bg-ivory-100 text-wine-700">
              <Pencil size={15} aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
      <div className="hidden overflow-x-auto border-y border-charcoal-950/10 bg-white sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-[#f2f2ef] text-[0.68rem] uppercase tracking-[0.1em] text-charcoal-800/60">
          <tr><th className="px-5 py-3 font-extrabold">Producto</th><th className="px-4 py-3 font-extrabold">Categoría</th><th className="px-4 py-3 font-extrabold">Precio</th><th className="px-4 py-3 font-extrabold">Publicación</th><th className="px-4 py-3 font-extrabold">Actualizado</th><th className="w-14"><span className="sr-only">Abrir</span></th></tr>
        </thead>
        <tbody className="divide-y divide-charcoal-950/8">
          {products.map((product) => (
            <tr key={product.id} className={selectedId === product.id ? 'bg-ivory-100/60' : 'hover:bg-[#fafaf8]'}>
              <td className="px-5 py-3">
                <button type="button" className="flex min-h-11 items-center gap-3 text-left" onClick={() => onSelect(product)}>
                  <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded border border-charcoal-950/10 bg-ivory-100">
                    {product.imageUrl ? <img className="size-full object-cover" src={product.imageUrl} alt="" /> : <Box size={18} className="text-charcoal-800/35" />}
                  </span>
                  <span>
                    <strong className="block text-sm">
                      {product.translations.es.name || 'Producto sin nombre'}
                      {product.featured && (
                        <span className="ml-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[0.68rem] font-bold text-amber-800 border border-amber-300">
                          ★ Destacado
                        </span>
                      )}
                    </strong>
                    <small className="mt-1 block font-mono text-[0.68rem] text-charcoal-800/55">{product.slug || 'sin-slug'}</small>
                  </span>
                </button>
              </td>
              <td className="px-4 py-3 text-sm capitalize text-charcoal-800/75">{product.category}</td>
              <td className="px-4 py-3 text-sm font-semibold text-wine-900">
                {product.priceEcuador !== undefined || product.priceUSA !== undefined ? `$${product.priceEcuador?.toFixed(2)} / $${product.priceUSA?.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs font-bold ${product.published ? 'text-andes-700' : 'text-charcoal-800/55'}`}><span className={`size-2 rounded-full ${product.published ? 'bg-emerald-600' : 'bg-charcoal-800/25'}`} />{product.published ? 'Publicado' : 'Borrador'}</span></td>
              <td className="px-4 py-3 text-xs text-charcoal-800/60">{new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(product.updatedAt))}</td>
              <td className="px-3"><button type="button" className="grid min-h-9 min-w-9 place-items-center rounded bg-wine-50 text-wine-700 hover:bg-wine-100 transition" onClick={() => onSelect(product)} aria-label={`Editar ${product.translations.es.name}`}><Pencil size={16} aria-hidden="true" /></button></td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}
