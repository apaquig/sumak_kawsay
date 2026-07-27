import { Save, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { updateMe, uploadImage } from '../lib/api';
import type { AdminUser } from '../types';

interface Props {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

export default function ProfileEditor({ user, onClose, onUpdated }: Props) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data: Record<string, string> = { name: name.trim(), email: email.trim(), photoUrl };
      if (password) data.password = password;
      const updated = await updateMe(data);
      setSuccess('Perfil actualizado correctamente');
      setPassword('');
      onUpdated(updated);
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
          <h2 className="text-lg font-bold">Mi Perfil</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-charcoal-950/5">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="size-20 rounded-full object-cover border-2 border-charcoal-950/10" />
            ) : (
              <span className="grid size-20 place-items-center rounded-full bg-wine-700 text-2xl font-bold text-white">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
            <label className="button-outline cursor-pointer text-sm">
              <Upload size={15} />
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
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
            <span className="field-label">Nueva contraseña (dejar vacío para no cambiar)</span>
            <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>

          {/* Role (read-only) */}
          <div>
            <span className="field-label">Rol</span>
            <p className="mt-1 text-sm font-medium">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                user.role === 'admin' ? 'bg-wine-700/10 text-wine-700' : 'bg-andes-700/10 text-andes-700'
              }`}>
                {user.role === 'admin' ? 'Administrador' : 'Editor'}
              </span>
            </p>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          {success && <p className="text-sm text-green-600 font-medium">{success}</p>}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-charcoal-950/10 px-6 py-4">
          <button type="button" onClick={onClose} className="button-outline">Cerrar</button>
          <button type="button" disabled={saving} onClick={handleSubmit} className="button-primary">
            <Save size={17} />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </footer>
      </div>
    </div>
  );
}
