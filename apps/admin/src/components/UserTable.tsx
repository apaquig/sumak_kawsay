import { Pencil, Trash2 } from 'lucide-react';
import type { AdminUser } from '../types';

interface Props {
  users: AdminUser[];
  currentUserId: string;
  onSelect: (user: AdminUser) => void;
  onDelete: (id: string) => void;
}

export default function UserTable({ users, currentUserId, onSelect, onDelete }: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded border border-charcoal-950/10 bg-white px-6 py-10 text-center text-sm text-charcoal-800/60">
        No hay usuarios registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-charcoal-950/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-charcoal-950/10 bg-charcoal-950/5">
          <tr>
            <th className="px-4 py-3 font-semibold">Usuario</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Rol</th>
            <th className="px-4 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal-950/5">
          {users.map((user) => (
            <tr key={user.id} className="group transition-colors hover:bg-ivory-100/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="size-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-wine-700 text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium">{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-gold-700">Tú</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-charcoal-800/60">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                  user.role === 'admin' ? 'bg-wine-700/10 text-wine-700' : 'bg-andes-700/10 text-andes-700'
                }`}>
                  {user.role === 'admin' ? 'Administrador' : 'Editor'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => onSelect(user)} className="rounded p-1.5 text-charcoal-800/50 hover:bg-charcoal-950/5 hover:text-charcoal-950" title="Editar">
                    <Pencil size={15} />
                  </button>
                  {user.id !== currentUserId && (
                    <button type="button" onClick={() => { if (confirm('¿Eliminar este usuario?')) onDelete(user.id); }} className="rounded p-1.5 text-charcoal-800/50 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
