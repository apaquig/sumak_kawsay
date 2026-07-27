import { useEffect, useState } from 'react';
import { getSettings, saveSettings, type AdminSettings } from '../lib/api';
import { Save, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function SettingsEditor() {
  const [settings, setSettings] = useState<AdminSettings>({
    adminEmail: '',
    adminUsername: '',
    adminPassword: '',
    destinationEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Error al cargar la configuración.',
        });
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings(settings);
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la configuración.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm font-semibold text-charcoal-800/60">Cargando configuración…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white rounded-lg border border-charcoal-950/10 p-6 sm:p-8 shadow-sm">
      <div className="mb-6 border-b border-charcoal-950/10 pb-4">
        <h2 className="text-xl font-bold text-charcoal-950">Configuración General</h2>
        <p className="mt-1 text-sm text-charcoal-800/60">
          Modifica las credenciales de acceso administrativo y los datos de contacto mostrados en la tienda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div
            className={`flex items-start gap-3 rounded p-4 text-sm ${
              message.type === 'error'
                ? 'border border-red-500/20 bg-red-500/10 text-red-700'
                : 'border border-green-500/20 bg-green-500/10 text-green-700'
            }`}
            role="status"
          >
            {message.type === 'error' ? (
              <ShieldAlert className="mt-0.5 shrink-0" size={18} />
            ) : (
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Correo administrador (Login)</span>
              <input
                type="email"
                required
                className="field-input"
                value={settings.adminEmail || ''}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="field-label">Usuario administrador (Legacy)</span>
              <input
                type="text"
                required
                className="field-input"
                value={settings.adminUsername}
                onChange={(e) => setSettings({ ...settings, adminUsername: e.target.value })}
              />
            </label>

            <label className="block relative">
              <span className="field-label">Contraseña administrador</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="field-input pr-10"
                  value={settings.adminPassword || ''}
                  onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-charcoal-800/40 hover:text-charcoal-800 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <hr className="border-charcoal-950/10" />

          <div className="grid gap-5">
            <label className="block">
              <span className="field-label">Correo electrónico de destino</span>
              <input
                type="email"
                required
                placeholder="e.g. contacto@tudominio.com"
                className="field-input"
                value={settings.destinationEmail}
                onChange={(e) => setSettings({ ...settings, destinationEmail: e.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-charcoal-950/10">
          <button
            type="submit"
            disabled={saving}
            className="button-primary min-w-[8rem]"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
