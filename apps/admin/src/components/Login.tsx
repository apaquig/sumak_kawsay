import { useState } from 'react';
import { login, forgotPassword } from '../lib/api';
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface Props {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      localStorage.setItem('admin_token', result.token);
      onLoginSuccess(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess('Si el correo está registrado, se ha enviado un enlace de recuperación.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar recuperación');
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
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Sumak Kawsay
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ivory-200/65">
            {view === 'login' ? 'Administración' : 'Recuperar Contraseña'}
          </p>
        </div>

        {view === 'login' ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="block text-xs font-extrabold uppercase tracking-wider text-ivory-200/80 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="size-5 text-ivory-200/40" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border border-white/15 bg-charcoal-950 pl-10 pr-3 py-2 text-sm text-white placeholder-white/40 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    placeholder="admin@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-extrabold uppercase tracking-wider text-ivory-200/80 mb-1">
                  Contraseña
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
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); }}
                  className="font-medium text-gold-400 hover:text-gold-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-wine-700 py-3 px-4 text-sm font-extrabold text-white transition-colors duration-150 hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-charcoal-950 disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleForgot}>
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400 text-center" role="alert">
                {success}
              </div>
            )}

            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-extrabold uppercase tracking-wider text-ivory-200/80 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="size-5 text-ivory-200/40" aria-hidden="true" />
                  </div>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border border-white/15 bg-charcoal-950 pl-10 pr-3 py-2 text-sm text-white placeholder-white/40 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    placeholder="admin@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-wine-700 py-3 px-4 text-sm font-extrabold text-white transition-colors duration-150 hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-charcoal-950 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                className="inline-flex items-center gap-2 text-sm font-medium text-ivory-200/60 hover:text-ivory-200 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
