import { Save, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { uploadImage } from '../lib/api';
import type { AdminUser, UserRole } from '../types';

interface Props {
  user: AdminUser;
  onClose: () => void;
  onSave: (user: AdminUser & { password?: string }) => Promise<void>;
}

export default function UserEditor({ user, onClose, onSave }: Props) {
  const isNew = !user.createdAt;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const img = await uploadImage(file);
      setPhotoUrl(img.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Nombre y email son requeridos.');
      return;
    }
    if (isNew && !password) {
      setError('La contraseña es requerida para usuarios nuevos.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...user,
        name: name.trim(),
        email: email.trim(),
        role,
        photoUrl,
        ...(password ? { password } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-charcoal-950/10 px-6 py-4">
          <h2 className="text-lg font-bold">{isNew ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-charcoal-950/5">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="size-16 rounded-full object-cover border-2 border-charcoal-950/10" />
            ) : (
              <span className="grid size-16 place-items-center rounded-full bg-wine-700 text-xl font-bold text-white">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
            <label className="button-outline cursor-pointer text-sm">
              <Upload size={15} />
              {uploading ? 'Subiendo…' : 'Subir foto'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => { void handlePhotoUpload(e.target.files?.[0]); e.target.value = ''; }}
              />
            </label>
          </div>

          {/* Name */}
          <label className="block">
            <span className="field-label">Nombre</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          {/* Email */}
          <label className="block">
            <span className="field-label">Email</span>
            <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          {/* Password */}
          <label className="block">
            <span className="field-label">{isNew ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}</span>
            <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isNew ? '' : '••••••••'} />
          </label>

          {/* Role */}
          <label className="block">
            <span className="field-label">Rol</span>
            <select className="field-input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="admin">Administrador</option>
              <option value="editor">Editor</option>
            </select>
          </label>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-charcoal-950/10 px-6 py-4">
          <button type="button" onClick={onClose} className="button-outline">Cancelar</button>
          <button type="button" disabled={saving} onClick={handleSubmit} className="button-primary">
            <Save size={17} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
