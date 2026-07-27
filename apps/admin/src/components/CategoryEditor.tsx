import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { AdminCategory } from '../types';

interface Props {
  category: AdminCategory;
  onClose: () => void;
  onSave: (category: AdminCategory) => Promise<void>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-charcoal-800">{label}</span>
      {children}
    </label>
  );
}

export default function CategoryEditor({ category, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<AdminCategory>(category);
  const [isSaving, setIsSaving] = useState(false);
  const isNew = !category.createdAt;

  useEffect(() => {
    setDraft(category);
  }, [category]);

  const handleChange = (field: keyof AdminCategory, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleTranslationChange = (lang: 'es' | 'en', field: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: { ...prev.translations[lang], [field]: value },
      },
    }));
  };

  const generateSlug = (name: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const slugToSave = generateSlug(draft.translations.es.name);
      await onSave({ ...draft, slug: slugToSave, published: true });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-charcoal-950/10 px-6 py-4">
          <h2 className="text-lg font-bold">{isNew ? 'Nueva Categoría' : 'Editar Categoría'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-charcoal-950/5">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="category-form" onSubmit={handleSave} className="space-y-6">
            <section className="space-y-4">
              <h3 className="font-bold text-wine-700">Información General</h3>
              
              <div className="grid gap-4">
                <Field label="Nombre">
                  <input
                    type="text"
                    required
                    className="field-input"
                    value={draft.translations.es.name}
                    onChange={(e) => handleTranslationChange('es', 'name', e.target.value)}
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    className="field-input min-h-[120px] resize-y"
                    value={draft.translations.es.description || ''}
                    onChange={(e) => handleTranslationChange('es', 'description', e.target.value)}
                  />
                </Field>
              </div>
            </section>
          </form>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-charcoal-950/10 bg-charcoal-950/5 px-6 py-4">
          <button type="button" onClick={onClose} className="button-outline">
            Cancelar
          </button>
          <button
            type="submit"
            form="category-form"
            disabled={isSaving}
            className="button-primary min-w-[120px]"
          >
            {isSaving ? 'Guardando...' : <><Save size={16} />Guardar</>}
          </button>
        </footer>
      </div>
    </div>
  );
}
