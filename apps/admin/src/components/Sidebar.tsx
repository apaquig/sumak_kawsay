import { Boxes, Gauge, Settings, LogOut, Image, Tags, Users, User } from 'lucide-react';
import type { AdminUser } from '../types';

const allItems = [
  { label: 'Resumen', icon: Gauge, adminOnly: false },
  { label: 'Productos', icon: Boxes, adminOnly: false },
  { label: 'Categorías', icon: Tags, adminOnly: true },
  { label: 'Galería', icon: Image, adminOnly: false },
  { label: 'Usuarios', icon: Users, adminOnly: true },
  { label: 'Configuración', icon: Settings, adminOnly: false },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  currentUser?: AdminUser | null;
  onOpenProfile?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, onLogout, currentUser, onOpenProfile }: Props) {
  const isAdmin = currentUser?.role === 'admin';
  const items = allItems.filter(i => !i.adminOnly || isAdmin);

  return (
    <aside className="hidden min-h-dvh w-60 shrink-0 border-r border-white/10 bg-charcoal-950 text-white lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="flex min-h-18 items-center gap-3 border-b border-white/10 px-5">
          <span className="grid size-9 place-items-center rounded-full border-2 border-gold-400" aria-hidden="true"><span className="size-3 rounded-full bg-terracotta-500" /></span>
          <div><strong className="block text-sm">Sumak Kawsay</strong><small className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-ivory-200/65">Administración</small></div>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Administración">
          {items.map(({ label, icon: Icon }) => {
            const isActive = activeTab === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onTabChange(label)}
                className={`flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-sm font-semibold transition ${isActive ? 'bg-wine-700 text-white' : 'text-ivory-100/70 hover:bg-white/8 hover:text-white'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />{label}
              </button>
            );
          })}
          {onLogout && (
            <button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-sm font-semibold text-red-400 hover:bg-white/8 hover:text-red-300 transition">
              <LogOut size={18} aria-hidden="true" />Cerrar sesión
            </button>
          )}
        </nav>

        {/* User profile at bottom */}
        {currentUser && (
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex w-full items-center gap-3 rounded px-2 py-2 text-left transition hover:bg-white/8"
            >
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser.name} className="size-9 rounded-full object-cover border border-white/20" />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-wine-700 text-sm font-bold text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ivory-100">{currentUser.name}</p>
                <p className="truncate text-[0.65rem] text-ivory-200/50">{currentUser.email}</p>
              </div>
              <User size={14} className="shrink-0 text-ivory-200/40" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
