import { Save, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { uploadImage } from '../lib/api';
import type { AdminGalleryItem, GalleryTranslation } from '../types';

interface Props {
  item: AdminGalleryItem;
  onClose: () => void;
  onSave: (item: AdminGalleryItem) => Promise<void>;
}

export default function GalleryEditor({ item, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const image = await uploadImage(file);
      setDraft((current) => ({
        ...current,
        imageUrl: image.url,
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    setDraft(item);
    setUploadError('');
    setMessage(null);
  }, [item]);

  const updateTranslation = (field: keyof GalleryTranslation, value: string) => {
    setDraft((current) => ({
      ...current,
      translations: {
        ...current.translations,
        es: {
          ...current.translations.es,
          [field]: value,
        },
      },
    }));
  };

  const submit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ ...draft, updatedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Cambios guardados con éxito.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? `No se guardó: ${error.message}` : 'No se pudo guardar.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-charcoal-950/45"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex h-dvh w-full max-w-3xl flex-col bg-[#f7f7f5] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <header className="flex min-h-18 shrink-0 items-center justify-between gap-4 border-b border-charcoal-950/10 bg-white px-5 sm:px-7">
          <div>
            <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-terracotta-500">
              Editor de Galería
            </p>
            <h2 id="editor-title" className="mt-1 text-lg font-bold">
              {draft.translations.es.title || 'Nuevo elemento de galería'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="button-primary"
              type="button"
              disabled={saving}
              onClick={submit}
            >
              <Save size={17} />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              className="grid min-h-11 min-w-11 place-items-center rounded border border-charcoal-950/15 bg-white hover:bg-ivory-100"
              type="button"
              onClick={onClose}
              aria-label="Cerrar editor"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 space-y-7">
          {/* General Metadata Section */}
          <div className="bg-white rounded-lg border border-charcoal-950/10 p-5 space-y-5">
            <h3 className="font-bold text-sm text-charcoal-950 border-b border-charcoal-950/10 pb-2">
              Información General
            </h3>
            

            {/* Image Upload Area */}
            <div>
              <span className="field-label block mb-2">Imagen del elemento</span>
              <div className="flex min-h-40 flex-col items-center justify-center gap-4 rounded border border-dashed border-charcoal-950/25 bg-ivory-50/50 p-6">
                {draft.imageUrl ? (
                  <img
                    src={draft.imageUrl}
                    alt="Vista previa"
                    className="max-h-48 w-auto max-w-full rounded object-contain border border-charcoal-950/10"
                  />
                ) : (
                  <div className="text-center text-charcoal-800/60">
                    <p className="text-sm">No hay imagen seleccionada</p>
                  </div>
                )}
                <label className="button-outline cursor-pointer">
                  <Upload size={17} />
                  {uploading ? 'Subiendo…' : draft.imageUrl ? 'Reemplazar imagen' : 'Seleccionar imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(event) => {
                      void handleImageFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
                <p aria-live="polite" className="text-sm text-wine-700 empty:hidden">
                  {uploadError}
                </p>
              </div>
              {draft.imageUrl && (
                <div className="mt-3">
                  <Field label="URL de la imagen">
                    <input
                      className="field-input bg-charcoal-950/5 cursor-not-allowed text-xs"
                      value={draft.imageUrl}
                      readOnly
                    />
                  </Field>
                </div>
              )}
            </div>
            

          </div>

          {/* Translations Section */}
          <div className="bg-white rounded-lg border border-charcoal-950/10 p-5">
            <div className="border-b border-charcoal-950/10 pb-2 mb-4">
              <h3 className="font-bold text-sm text-charcoal-950">
                Textos e Información Adicional
              </h3>
            </div>

            <div className="space-y-4">
              <Field label="Título">
                <input
                  type="text"
                  className="field-input"
                  value={draft.translations.es?.title || ''}
                  onChange={(event) => updateTranslation('title', event.target.value)}
                  placeholder="Ej. Feria Nacional de Artesanías"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ubicación">
                  <input
                    type="text"
                    className="field-input"
                    value={draft.translations.es?.location || ''}
                    onChange={(event) => updateTranslation('location', event.target.value)}
                    placeholder="Ej. Saraguro, Loja · Ecuador 🇪🇨"
                  />
                </Field>
                <Field label="Año">
                  <input
                    type="text"
                    className="field-input"
                    value={draft.year}
                    placeholder="Ej. 2026"
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        year: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Descripción">
                <textarea
                  className="field-input min-h-28 resize-y"
                  value={draft.translations.es?.description || ''}
                  onChange={(event) => updateTranslation('description', event.target.value)}
                  placeholder="Escribe los detalles e información del evento o muestra..."
                />
              </Field>
            </div>
          </div>
        </div>

        <footer className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t border-charcoal-950/10 bg-white px-5 sm:px-7">
          <p
            className={`text-sm font-semibold ${
              message?.type === 'error'
                ? 'text-red-700'
                : message?.type === 'success'
                ? 'text-green-700'
                : 'text-charcoal-800/60'
            }`}
            role={message?.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {message?.text ?? ''}
          </p>
          <label className="flex min-h-11 items-center gap-2 text-sm font-bold cursor-pointer">
            <input
              type="checkbox"
              className="size-4 accent-wine-700"
              checked={draft.published}
              onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
            />
            Publicado
          </label>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label block mb-1">{label}</span>
      {children}
    </label>
  );
}
