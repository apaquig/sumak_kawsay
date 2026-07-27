import { Save, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { uploadImage, ValidationError } from '../lib/api';
import type { AdminProduct, ProductTranslation, AdminCategory } from '../types';

// Las imágenes del catálogo de muestra viven en el storefront ("/images/...");
// para verlas desde el panel se resuelven contra ese origen.
const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:4321';

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

const isAbsolute = (url: string) => /^https?:\/\//.test(url);

const storefrontFallback = (url: string): string =>
  `${STOREFRONT_URL}${url.startsWith('/') ? '' : '/'}${url}`;

interface Props {
  product: AdminProduct;
  categories?: AdminCategory[];
  onClose: () => void;
  onSave: (product: AdminProduct) => Promise<void>;
}

export default function ProductEditor({ product, categories = [], onClose, onSave }: Props) {
  const [draft, setDraft] = useState(product);
  const [section, setSection] = useState<'content' | 'media' | 'experience'>('content');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadingTryOn, setUploadingTryOn] = useState(false);
  const [uploadTryOnError, setUploadTryOnError] = useState('');
  // 'same-origin': la ruta relativa tal cual (el admin sirve public/images);
  // 'storefront': reintento contra el origen del storefront; 'broken': sin vista previa.
  const [previewState, setPreviewState] = useState<'same-origin' | 'storefront' | 'broken'>('same-origin');

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const image = await uploadImage(file);
      setPreviewState('same-origin');
      setDraft((current) => ({
        ...current,
        imageUrl: image.url,
        imagePublicId: image.publicId,
        imageWidth: image.width,
        imageHeight: image.height,
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleTryOnImageFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadingTryOn(true);
    setUploadTryOnError('');
    try {
      const image = await uploadImage(file);
      setDraft((current) => ({
        ...current,
        virtualTryOn: {
          ...current.virtualTryOn,
          overlayImageUrl: image.url,
        },
      }));
    } catch (error) {
      setUploadTryOnError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingTryOn(false);
    }
  };

  useEffect(() => {
    setDraft(product);
    setPreviewState('same-origin');
    setUploadError('');
    setUploadTryOnError('');
    setMessage(null);
  }, [product]);

  const updateTranslation = (field: keyof ProductTranslation, value: string) => {
    setDraft((current) => {
      const updatedTranslations = {
        ...current.translations,
        es: { ...current.translations.es, [field]: value }
      };

      const extraUpdates = (field === 'name')
        ? { slug: slugify(value) }
        : {};

      return {
        ...current,
        translations: updatedTranslations,
        ...extraUpdates,
      };
    });
  };

  const submit = async () => {
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await onSave({ ...draft, updatedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Cambios guardados' });
    } catch (error) {
      if (error instanceof ValidationError && error.issues && error.issues.length > 0) {
        const newFieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          if (issue.path) {
            let msg = issue.message;
            if (msg.includes('Too big') || msg.includes('expected string to have <=')) {
              const match = msg.match(/<=(\d+)/);
              const maxChars = match ? match[1] : '';
              msg = `El texto es demasiado largo. Máximo permitido: ${maxChars} caracteres.`;
            } else if (msg.includes('Too small') || msg.includes('expected string to have >=')) {
              const match = msg.match(/>=(\d+)/);
              const minChars = match ? match[1] : '';
              msg = `El texto es demasiado corto. Mínimo requerido: ${minChars} caracteres.`;
            }
            newFieldErrors[issue.path.join('.')] = msg;
          }
        });
        setFieldErrors(newFieldErrors);
        setMessage({
          type: 'error',
          text: 'Por favor, revisa los campos marcados en rojo.',
        });
      } else {
        setMessage({
          type: 'error',
          text: error instanceof Error ? `No se guardó: ${error.message}` : 'No se pudo guardar.',
        });
      }
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-950/45" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex h-dvh w-full max-w-3xl flex-col bg-[#f7f7f5] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header className="flex min-h-18 shrink-0 items-center justify-between gap-4 border-b border-charcoal-950/10 bg-white px-5 sm:px-7">
          <div><p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-terracotta-500">Editor de producto</p><h2 id="editor-title" className="mt-1 text-lg font-bold">{draft.translations.es.name || 'Nuevo producto'}</h2></div>
          <div className="flex items-center gap-2"><button className="button-primary" type="button" disabled={saving} onClick={submit}><Save size={17} />{saving ? 'Guardando…' : 'Guardar'}</button><button className="grid min-h-11 min-w-11 place-items-center rounded border border-charcoal-950/15 bg-white hover:bg-ivory-100" type="button" onClick={onClose} aria-label="Cerrar editor"><X size={20} /></button></div>
        </header>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-charcoal-950/10 bg-white px-5 sm:px-7" role="tablist">
          {([['content', 'Contenido'], ['media', 'Medios y SEO'], ['experience', 'Probador virtual']] as const).map(([value, label]) => <button key={value} type="button" className={`min-h-12 border-b-2 px-3 text-sm font-bold ${section === value ? 'border-wine-700 text-wine-700' : 'border-transparent text-charcoal-800/60 hover:text-charcoal-950'}`} onClick={() => setSection(value)} aria-selected={section === value} role="tab">{label}</button>)}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {section === 'content' && (
            <div className="space-y-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Categoría" error={fieldErrors['category']}>
                  <select
                    className="field-input"
                    value={draft.category}
                    onChange={(event) => {
                      const val = event.target.value;
                      setDraft({
                        ...draft,
                        category: val,
                        virtualTryOn: {
                          enabled: val.toLowerCase() === 'collares' ? draft.virtualTryOn.enabled : false,
                          overlayImageUrl: draft.virtualTryOn.overlayImageUrl
                        }
                      });
                    }}
                  >
                    <option value="" disabled>Selecciona una categoría...</option>
                    {categories.filter(c => c.published).map(c => (
                      <option key={c.id} value={c.slug}>{c.translations.es.name || c.slug}</option>
                    ))}
                    {/* Fallback para compatibilidad con categorías anteriores si no están en la lista */}
                    {draft.category && !categories.some(c => c.slug === draft.category) && (
                      <option value={draft.category}>{draft.category}</option>
                    )}
                  </select>
                </Field>
                <Field label="Precio (Ecuador) USD" error={fieldErrors['priceEcuador']}>
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    value={draft.priceEcuador || ''}
                    onChange={(e) => setDraft((c) => ({ ...c, priceEcuador: parseFloat(e.target.value) || 0 }))}
                  />
                </Field>
                <Field label="Precio (USA / Internacional) USD" error={fieldErrors['priceUSA']}>
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    value={draft.priceUSA || ''}
                    onChange={(e) => setDraft((c) => ({ ...c, priceUSA: parseFloat(e.target.value) || 0 }))}
                  />
                </Field>
              </div>



              <div className="grid gap-5">
                <Field label="Nombre" error={fieldErrors[`translations.es.name`]} maxChars={160} currentLength={draft.translations.es.name?.length || 0}><input className="field-input" value={draft.translations.es.name} maxLength={160} onChange={(event) => updateTranslation('name', event.target.value)} /></Field>
                <Field label="Descripción" error={fieldErrors[`translations.es.description`]} maxChars={8000} currentLength={draft.translations.es.description?.length || 0}><textarea className="field-input min-h-32 resize-y" value={draft.translations.es.description} maxLength={8000} onChange={(event) => updateTranslation('description', event.target.value)} /></Field>
                <Field label="Materiales" error={fieldErrors[`translations.es.materials`]} maxChars={2000} currentLength={draft.translations.es.materials?.length || 0}><textarea className="field-input min-h-24 resize-y" value={draft.translations.es.materials} maxLength={2000} onChange={(event) => updateTranslation('materials', event.target.value)} /></Field>
                <Field label="Instrucciones de cuidado" error={fieldErrors[`translations.es.careInstructions`]} maxChars={2000} currentLength={draft.translations.es.careInstructions?.length || 0}><textarea className="field-input min-h-24 resize-y" value={draft.translations.es.careInstructions} maxLength={2000} onChange={(event) => updateTranslation('careInstructions', event.target.value)} /></Field>
              </div>
            </div>
          )}

          {section === 'media' && (
            <div className="space-y-7">
              <div>
                <h3 className="font-bold">Imagen principal</h3>
                <p className="mt-1 text-sm text-charcoal-800/60">Cloudinary conservará el original y las variantes optimizadas.</p>
                <div className="mt-4 flex min-h-40 flex-col items-center justify-center gap-4 rounded border border-dashed border-charcoal-950/25 bg-white p-6">
                  {draft.imageUrl && previewState !== 'broken' ? (
                    <img
                      src={isAbsolute(draft.imageUrl) || previewState === 'same-origin' ? draft.imageUrl : storefrontFallback(draft.imageUrl)}
                      alt={`Vista previa de ${draft.translations.es.name || draft.slug || 'la imagen del producto'}`}
                      className="max-h-64 w-auto max-w-full rounded object-contain"
                      onError={() => setPreviewState(isAbsolute(draft.imageUrl) || previewState === 'storefront' ? 'broken' : 'storefront')}
                    />
                  ) : draft.imageUrl ? (
                    <p className="text-sm text-charcoal-800/60">No se pudo cargar la vista previa de <span className="font-mono break-all">{draft.imageUrl}</span>. Verifica que la URL sea accesible.</p>
                  ) : null}
                  <label className="button-outline cursor-pointer">
                    <Upload size={17} />
                    {uploading ? 'Subiendo…' : draft.imageUrl ? 'Reemplazar imagen' : 'Seleccionar imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(event) => { void handleImageFile(event.target.files?.[0]); event.target.value = ''; }}
                    />
                  </label>
                  <p aria-live="polite" className="text-sm text-wine-700 empty:hidden">{uploadError}</p>
                </div>
              </div>
              <Field label="URL de imagen" error={fieldErrors['imageUrl']}><input className="field-input bg-charcoal-950/5 cursor-not-allowed" value={draft.imageUrl} readOnly /></Field>
              <div className="border-t border-charcoal-950/10 pt-6"><h3 className="font-bold">SEO</h3><div className="mt-4 grid gap-5"><Field label="Título SEO" error={fieldErrors[`translations.es.seoTitle`]} maxChars={160} currentLength={draft.translations.es.seoTitle?.length || 0}><input className="field-input" value={draft.translations.es.seoTitle} maxLength={160} onChange={(event) => updateTranslation('seoTitle', event.target.value)} /></Field><Field label="Meta description" error={fieldErrors[`translations.es.seoDescription`]} maxChars={320} currentLength={draft.translations.es.seoDescription?.length || 0}><textarea className="field-input min-h-24 resize-y" value={draft.translations.es.seoDescription} maxLength={320} onChange={(event) => updateTranslation('seoDescription', event.target.value)} /></Field></div></div>
            </div>
          )}

          {section === 'experience' && (
            <div className="space-y-7">
              <div className="bg-white rounded-lg border border-charcoal-950/10 p-5 space-y-4">
                <h3 className="font-bold text-sm text-charcoal-950 border-b border-charcoal-950/10 pb-2">
                  Configuración 3D y Probador Virtual
                </h3>
              </div>

              <div>
                <Toggle
                  label="Probador virtual"
                  description={draft.category === 'collares' ? 'Permite cámara, fotografía y ajuste manual.' : 'Disponible solamente para la categoría Collares.'}
                  checked={draft.virtualTryOn.enabled}
                  disabled={draft.category !== 'collares'}
                  onChange={(enabled) => setDraft({ ...draft, virtualTryOn: { ...draft.virtualTryOn, enabled } })}
                />
                {draft.virtualTryOn.enabled && (
                  <div className="mt-4 border-l-2 border-gold-400 pl-5 space-y-4">
                    <Field label="Imagen para probador virtual (collar abierto y fondo transparente)" error={fieldErrors['virtualTryOn.overlayImageUrl']}>
                      <div className="flex flex-col gap-3">
                        {draft.virtualTryOn.overlayImageUrl && (
                          <img
                            src={draft.virtualTryOn.overlayImageUrl}
                            alt="Vista previa del probador"
                            className="max-h-32 w-auto object-contain rounded border border-charcoal-950/10 bg-ivory-100/50"
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <label className="button-outline cursor-pointer text-xs">
                            <Upload size={14} />
                            {uploadingTryOn ? 'Subiendo…' : draft.virtualTryOn.overlayImageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              disabled={uploadingTryOn}
                              onChange={(event) => { void handleTryOnImageFile(event.target.files?.[0]); event.target.value = ''; }}
                            />
                          </label>
                          <input
                            type="text"
                            readOnly
                            placeholder="Sin archivo seleccionado"
                            className="field-input text-xs bg-charcoal-950/5 cursor-not-allowed flex-1"
                            value={draft.virtualTryOn.overlayImageUrl || ''}
                          />
                        </div>
                        <p className="text-[0.7rem] text-charcoal-800/60">
                          Sube una foto recortada (PNG transparente) con la parte trasera del collar abierta para que se superponga adecuadamente.
                        </p>
                        {uploadTryOnError && <p className="text-xs text-wine-700">{uploadTryOnError}</p>}
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t border-charcoal-950/10 bg-white px-5 sm:px-7">
          <p className={`text-sm font-semibold ${message?.type === 'error' ? 'text-red-700' : message?.type === 'success' ? 'text-green-700' : 'text-charcoal-800/60'}`} role={message?.type === 'error' ? 'alert' : 'status'} aria-live="polite">
            {message?.text ?? ''}
          </p>
          <div className="flex items-center gap-6">
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold cursor-pointer">
              <input type="checkbox" className="size-4 accent-wine-700" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />
              Destacado
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold cursor-pointer">
              <input type="checkbox" className="size-4 accent-wine-700" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />
              Publicado
            </label>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, children, error, maxChars, currentLength }: { label: string; children: React.ReactNode; error?: string; maxChars?: number; currentLength?: number }) { 
  return (
    <label className="block">
      <span className="flex items-center justify-between field-label">
        <span>{label}</span>
        {maxChars !== undefined && currentLength !== undefined && (
          <span className={`text-[0.7rem] font-mono ${currentLength >= maxChars ? 'text-red-600 font-bold' : 'text-charcoal-800/50'}`}>
            {currentLength} / {maxChars}
          </span>
        )}
      </span>
      {children}
      {error && <span className="block mt-1 text-xs text-red-600 font-medium">{error}</span>}
    </label>
  ); 
}

function Toggle({ label, description, checked, disabled = false, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label className={`flex min-h-14 items-start justify-between gap-5 ${disabled ? 'opacity-50' : ''}`}><span><strong className="block text-sm">{label}</strong><small className="mt-1 block max-w-md leading-5 text-charcoal-800/60">{description}</small></span><input type="checkbox" className="mt-1 size-5 accent-wine-700" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /></label>;
}
