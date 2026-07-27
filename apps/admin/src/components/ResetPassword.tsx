import { useState } from 'react';
import { resetPassword } from '../lib/api';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface Props {
  token: string;
  onSuccess: () => void;
}

export default function ResetPassword({ token, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-charcoal-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-white/10 bg-charcoal-900/50 p-8 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="grid size-14 place-items-center rounded-full border-2 border-gold-400 bg-charcoal-950" aria-hidden="true">
            <span className="size-5 rounded-full bg-terracotta-500" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            Nueva Contraseña
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ivory-200/65">
            Administración
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="password" className="block text-xs font-extrabold uppercase tracking-wider text-ivory-200/80 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="size-5 text-ivory-200/40" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-white/15 bg-charcoal-950 pl-10 pr-10 py-2 text-sm text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ivory-200/40 hover:text-ivory-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-extrabold uppercase tracking-wider text-ivory-200/80 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="size-5 text-ivory-200/40" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border border-white/15 bg-charcoal-950 pl-10 pr-10 py-2 text-sm text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ivory-200/40 hover:text-ivory-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-wine-700 py-3 px-4 text-sm font-extrabold text-white transition-colors duration-150 hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-charcoal-950 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
