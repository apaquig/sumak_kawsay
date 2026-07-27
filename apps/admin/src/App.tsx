import { Boxes, CircleAlert, Plus, Search, Wifi, WifiOff, LogOut, Image as ImageIcon, Users as UsersIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ProductEditor from './components/ProductEditor';
import ProductTable from './components/ProductTable';
import GalleryTable from './components/GalleryTable';
import GalleryEditor from './components/GalleryEditor';
import CategoryTable from './components/CategoryTable';
import CategoryEditor from './components/CategoryEditor';
import UserTable from './components/UserTable';
import UserEditor from './components/UserEditor';
import ProfileEditor from './components/ProfileEditor';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import SettingsEditor from './components/SettingsEditor';
import { createEmptyProduct, seedProducts, createEmptyGalleryItem } from './data';
import {
  listProducts,
  saveProduct,
  ValidationError,
  listGalleryItems,
  saveGalleryItem,
  deleteGalleryItem,
  listCategories,
  saveCategory,
  deleteCategory,
  listUsers,
  saveUser,
  deleteUser as deleteUserApi,
  getMe,
} from './lib/api';
import { ToastStack, type ToastItem, type ToastType } from './components/Toast';
import type { AdminProduct, Category, AdminGalleryItem, AdminCategory, AdminUser } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [resetToken, setResetToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token');
    }
    return null;
  });
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem('admin_active_tab') || 'Productos';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('admin_active_tab', tab);
  };
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<AdminProduct>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | Category>('all');
  const [connection, setConnection] = useState<'checking' | 'online' | 'offline'>('checking');
  const [notice, setNotice] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Gallery Management States
  const [galleryItems, setGalleryItems] = useState<AdminGalleryItem[]>([]);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<AdminGalleryItem>();
  const [galleryQuery, setGalleryQuery] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'all' | AdminGalleryItem['category']>('all');
  const [galleryPage, setGalleryPage] = useState(1);

  // Category Management States
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // User Management States
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser>();
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCategoryItem, setSelectedCategoryItem] = useState<AdminCategory>();

  const pushToast = (type: ToastType, text: string) => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), type, text }]);
  };
  const dismissToast = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  useEffect(() => {
    let cancelled = false;
    const load = async (silent: boolean) => {
      try {
        const [items, galleryData, cats] = await Promise.all([listProducts(), listGalleryItems(), listCategories()]);
        if (cancelled) return true;
        setProducts((current) => (current.length > 0 && silent ? current : items));
        setGalleryItems(galleryData);
        setCategories(cats);
        setConnection('online');
        setNotice((current) => (current.startsWith('API desconectada') ? '' : current));
        if (!silent) setLoading(false);
        return true;
      } catch {
        if (!cancelled) {
          setConnection('offline');
          // Fallback only if we don't have products already loaded
          setProducts((current) => current.length > 0 ? current : seedProducts);
          setNotice('API desconectada: los cambios se mantendrán solo en esta sesión.');
          if (!silent) setLoading(false);
        }
        return false;
      }
    };

    void load(false);
    // Reintento silencioso: si la API vuelve, el panel sale solo del modo local.
    const timer = setInterval(() => {
      void load(true);
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesQuery = !normalized || product.translations.es.name.toLowerCase().includes(normalized) || product.slug.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, category]);

  const ITEMS_PER_PAGE = 10;

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filtered.length / ITEMS_PER_PAGE);
  }, [filtered]);

  // Gallery Memoized Values
  const filteredGallery = useMemo(() => {
    const normalized = galleryQuery.trim().toLowerCase();
    return galleryItems.filter((item) => {
      const matchesCategory = galleryCategory === 'all' || item.category === galleryCategory;
      const matchesQuery =
        !normalized ||
        item.translations.es.title.toLowerCase().includes(normalized) ||
        item.translations.es.location.toLowerCase().includes(normalized) ||
        item.translations.es.tag.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [galleryItems, galleryQuery, galleryCategory]);

  useEffect(() => {
    setGalleryPage(1);
  }, [galleryQuery, galleryCategory]);

  const paginatedGallery = useMemo(() => {
    const start = (galleryPage - 1) * ITEMS_PER_PAGE;
    return filteredGallery.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGallery, galleryPage]);

  const totalGalleryPages = useMemo(() => {
    return Math.ceil(filteredGallery.length / ITEMS_PER_PAGE);
  }, [filteredGallery]);

  const stats = {
    published: products.filter((product) => product.published).length,
    translations: products.filter((product) => product.translationStatus.en !== 'approved').length,
    tryOn: products.filter((product) => product.category === 'collares' && product.virtualTryOn.enabled).length,
  };

  const upsertLocal = (updated: AdminProduct) => {
    setProducts((current) => current.some((item) => item.id === updated.id)
      ? current.map((item) => item.id === updated.id ? updated : item)
      : [updated, ...current]);
    setSelected(updated);
  };

  const handleSave = async (draft: AdminProduct) => {
    upsertLocal(draft);
    // Siempre se intenta la API: si estaba marcada como caída y responde,
    // el panel se reconecta solo en lugar de quedarse en modo local.
    try {
      const saved = await saveProduct(draft);
      upsertLocal(saved);
      setConnection('online');
      pushToast('success', `«${saved.translations.es.name || saved.slug}» se guardó correctamente.`);
      setSelected(undefined);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Datos rechazados: la API sigue en pie y el error debe verse tal cual.
        setConnection('online');
        pushToast('error', `No se guardó. ${error.message}`);
        throw error;
      }
      setConnection('offline');
      pushToast('error', 'La API no respondió al guardar. Se conserva una copia local; vuelve a intentar con Guardar.');
      throw new Error('La API no respondió al guardar. Se conserva una copia local.');
    }
  };

  const upsertGalleryLocal = (updated: AdminGalleryItem) => {
    setGalleryItems((current) =>
      current.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...current]
    );
    setSelectedGalleryItem(updated);
  };

  const handleSaveGalleryItem = async (draft: AdminGalleryItem) => {
    upsertGalleryLocal(draft);
    try {
      const saved = await saveGalleryItem(draft);
      upsertGalleryLocal(saved);
      setConnection('online');
      pushToast('success', `«${saved.translations.es.title || 'Elemento'}» se guardó correctamente.`);
      setSelectedGalleryItem(undefined);
    } catch (error) {
      if (error instanceof ValidationError) {
        setConnection('online');
        pushToast('error', `No se guardó: ${error.message}`);
        throw error;
      }
      setConnection('offline');
      pushToast('error', 'La API no respondió al guardar el elemento de la galería. Se conserva una copia local.');
      throw new Error('La API no respondió al guardar el elemento de la galería. Se conserva una copia local.');
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    setGalleryItems((current) => current.filter((item) => item.id !== id));
    if (selectedGalleryItem?.id === id) {
      setSelectedGalleryItem(undefined);
    }
    try {
      await deleteGalleryItem(id);
      setConnection('online');
      pushToast('success', 'El elemento se eliminó correctamente de la galería.');
    } catch (error) {
      setConnection('offline');
      pushToast('error', 'La API no respondió al eliminar el elemento. Se aplicó localmente.');
    }
  };

  const handleSaveCategoryItem = async (draft: AdminCategory) => {
    const isDuplicate = categories.some(c => c.slug === draft.slug && c.id !== draft.id);
    if (isDuplicate) {
      pushToast('error', 'Ya existe una categoría con ese nombre.');
      throw new Error('Duplicado');
    }
    try {
      const saved = await saveCategory(draft);
      setCategories(current => current.some(c => c.id === saved.id) ? current.map(c => c.id === saved.id ? saved : c) : [saved, ...current]);
      setConnection('online');
      pushToast('success', `«${saved.translations.es.name || 'Categoría'}» se guardó correctamente.`);
      setSelectedCategoryItem(undefined);
    } catch (error) {
      setConnection('offline');
      pushToast('error', 'Error al guardar categoría.');
    }
  };

  const handleDeleteCategoryItem = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(current => current.filter(c => c.id !== id));
      setConnection('online');
      pushToast('success', 'La categoría se eliminó correctamente.');
    } catch (error) {
      setConnection('offline');
      pushToast('error', 'Error al eliminar categoría.');
    }
  };

  // User Management Handlers
  const handleSaveUser = async (draft: AdminUser & { password?: string }) => {
    try {
      const saved = await saveUser(draft);
      setUsers(current => current.some(u => u.id === saved.id) ? current.map(u => u.id === saved.id ? saved : u) : [saved, ...current]);
      pushToast('success', `Usuario «${saved.name}» guardado.`);
      setSelectedUser(undefined);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Error al guardar usuario.');
      throw err;
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUserApi(id);
      setUsers(current => current.filter(u => u.id !== id));
      pushToast('success', 'Usuario eliminado.');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Error al eliminar usuario.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setCurrentUser(null);
  };

  if (resetToken) {
    return (
      <ResetPassword 
        token={resetToken} 
        onSuccess={() => {
          setResetToken(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }} 
      />
    );
  }

  if (!token) {
    return <Login onLoginSuccess={(t) => setToken(t)} />;
  }

  // Load current user on mount
  if (!currentUser && token) {
    void getMe().then(setCurrentUser).catch(() => handleLogout());
  }

  // Load users if admin
  if (currentUser?.role === 'admin' && users.length === 0) {
    void listUsers().then(setUsers).catch(() => {});
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} currentUser={currentUser} onOpenProfile={() => setShowProfile(true)} />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-4 border-b border-charcoal-950/10 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3 lg:hidden"><span className="grid size-9 place-items-center rounded-full border-2 border-wine-700" aria-hidden="true"><span className="size-3 rounded-full bg-terracotta-500" /></span><strong className="text-sm">Sumak Kawsay</strong></div>
          <div className="hidden lg:block"><p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-terracotta-500">{activeTab === 'Configuración' ? 'Administración' : 'Catálogo'}</p><h1 className="mt-1 text-lg font-bold">{activeTab}</h1></div>
          <div className="flex items-center gap-3">
            <span className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${connection === 'online' ? 'bg-andes-700/10 text-andes-700' : connection === 'offline' ? 'bg-amber-100 text-amber-800' : 'bg-charcoal-950/5 text-charcoal-800/60'}`}>
              {connection === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}{connection === 'online' ? 'API conectada' : connection === 'offline' ? 'Modo local' : 'Comprobando'}
            </span>
            {/* User avatar in header */}
            {currentUser && (
              <button type="button" onClick={() => setShowProfile(true)} className="flex items-center gap-2 rounded-full border border-charcoal-950/10 px-2 py-1 text-sm transition hover:bg-ivory-100" title="Mi perfil">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="size-7 rounded-full object-cover" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-wine-700 text-xs font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                )}
                <span className="hidden font-medium sm:inline">{currentUser.name}</span>
              </button>
            )}
            {activeTab === 'Productos' && (
              <>
                <button className="button-outline lg:hidden" type="button" onClick={handleLogout} title="Cerrar sesión"><LogOut size={17} aria-hidden="true" /></button>
                <button className="button-primary" type="button" onClick={() => setSelected(createEmptyProduct())}><Plus size={17} aria-hidden="true" />Nuevo producto</button>
              </>
            )}
            {activeTab === 'Galería' && (
              <>
                <button className="button-outline lg:hidden" type="button" onClick={handleLogout} title="Cerrar sesión"><LogOut size={17} aria-hidden="true" /></button>
                <button className="button-primary" type="button" onClick={() => setSelectedGalleryItem(createEmptyGalleryItem())}><Plus size={17} aria-hidden="true" />Nuevo elemento</button>
              </>
            )}
            {activeTab === 'Categorías' && (
              <>
                <button className="button-outline lg:hidden" type="button" onClick={handleLogout} title="Cerrar sesión"><LogOut size={17} aria-hidden="true" /></button>
                <button className="button-primary" type="button" onClick={() => setSelectedCategoryItem({ id: Math.random().toString(36).slice(2), slug: '', published: true, translations: { es: { name: '', description: '' }, en: { name: '', description: '' } } })}><Plus size={17} aria-hidden="true" />Nueva categoría</button>
              </>
            )}
            {activeTab === 'Usuarios' && currentUser?.role === 'admin' && (
              <>
                <button className="button-primary" type="button" onClick={() => setSelectedUser({ id: Math.random().toString(36).slice(2), name: '', email: '', photoUrl: '', role: 'editor' })}><Plus size={17} aria-hidden="true" />Nuevo usuario</button>
              </>
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-7 sm:py-8">
          {loading ? (
            <div className="grid min-h-[350px] place-items-center rounded border border-charcoal-950/10 bg-white">
              <div className="text-center">
                <div className="mx-auto size-8 animate-spin rounded-full border-4 border-wine-700 border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-charcoal-800/60">Cargando información desde la base de datos...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'Productos' && (
                <>
                  {notice && <div className="mb-5 flex items-start justify-between gap-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status"><span className="flex gap-2"><CircleAlert className="mt-0.5 shrink-0" size={17} />{notice}</span><button className="font-bold underline" type="button" onClick={() => setNotice('')}>Cerrar</button></div>}

              <section className="grid gap-px overflow-hidden rounded border border-charcoal-950/10 bg-charcoal-950/10 sm:grid-cols-2" aria-label="Resumen del catálogo">
                <Metric icon={<Boxes size={18} />} label="Publicados" value={stats.published} detail={`${products.length} productos totales`} />
                <Metric icon={<Wifi size={18} />} label="Con probador virtual" value={stats.tryOn} detail="Solo collares" />
              </section>

              <section className="mt-7">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-800/40" size={17} /><input className="field-input pl-10" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o slug" aria-label="Buscar productos" /></div>
                  <select className="field-input w-full sm:w-44" value={category} onChange={(event) => setCategory(event.target.value as typeof category)} aria-label="Filtrar categoría"><option value="all">Todas</option><option value="collares">Collares</option><option value="manillas">Manillas</option><option value="aretes">Aretes</option></select>
                </div>
                <ProductTable products={paginatedProducts} selectedId={selected?.id} onSelect={setSelected} />
                <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-charcoal-950/10 pt-4 sm:flex-row">
                  <p className="text-xs text-charcoal-800/55">
                    Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(filtered.length, currentPage * ITEMS_PER_PAGE)} de {filtered.length} productos
                  </p>
                  {totalPages > 1 && (
                    <nav className="flex items-center gap-1" aria-label="Paginación de productos">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="button-outline min-h-9 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-h-9 min-w-9 rounded border text-xs font-bold transition ${
                            currentPage === page
                              ? 'border-wine-700 bg-wine-700 text-white'
                              : 'border-charcoal-950/10 bg-white text-charcoal-800 hover:border-wine-700 hover:text-wine-700'
                          }`}
                          aria-current={currentPage === page ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="button-outline min-h-9 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'Galería' && (
            <>
              {notice && <div className="mb-5 flex items-start justify-between gap-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status"><span className="flex gap-2"><CircleAlert className="mt-0.5 shrink-0" size={17} />{notice}</span><button className="font-bold underline" type="button" onClick={() => setNotice('')}>Cerrar</button></div>}

              <section className="grid gap-px overflow-hidden rounded border border-charcoal-950/10 bg-charcoal-950/10 sm:grid-cols-2" aria-label="Resumen de la Galería">
                <Metric icon={<ImageIcon size={18} />} label="Elementos Totales" value={galleryItems.length} detail={`${galleryItems.filter(i => i.published).length} publicados en el sitio`} />
                <Metric icon={<Boxes size={18} />} label="Ferias y Eventos" value={galleryItems.filter(i => i.category === 'fairs').length} detail="Exposiciones nacionales e internacionales" />
              </section>

              <section className="mt-7">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-800/40" size={17} />
                    <input
                      className="field-input pl-10"
                      type="search"
                      value={galleryQuery}
                      onChange={(event) => setGalleryQuery(event.target.value)}
                      placeholder="Buscar por título, ubicación o etiqueta"
                      aria-label="Buscar elementos de galería"
                    />
                  </div>
                  <select
                    className="field-input w-full sm:w-44"
                    value={galleryCategory}
                    onChange={(event) => setGalleryCategory(event.target.value as typeof galleryCategory)}
                    aria-label="Filtrar por categoría de galería"
                  >
                    <option value="all">Todas</option>
                    <option value="fairs">Ferias</option>
                    <option value="craft">Proceso Artesanal</option>
                    <option value="artisans">Artesanos</option>
                  </select>
                </div>

                <GalleryTable
                  items={paginatedGallery}
                  selectedId={selectedGalleryItem?.id}
                  onSelect={setSelectedGalleryItem}
                  onDelete={handleDeleteGalleryItem}
                />

                <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-charcoal-950/10 pt-4 sm:flex-row">
                  <p className="text-xs text-charcoal-800/55">
                    Mostrando {filteredGallery.length === 0 ? 0 : (galleryPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(filteredGallery.length, galleryPage * ITEMS_PER_PAGE)} de {filteredGallery.length} elementos
                  </p>
                  {totalGalleryPages > 1 && (
                    <nav className="flex items-center gap-1" aria-label="Paginación de la galería">
                      <button
                        type="button"
                        disabled={galleryPage === 1}
                        onClick={() => setGalleryPage((p) => Math.max(1, p - 1))}
                        className="button-outline min-h-9 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalGalleryPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setGalleryPage(page)}
                          className={`min-h-9 min-w-9 rounded border text-xs font-bold transition ${
                            galleryPage === page
                              ? 'border-wine-700 bg-wine-700 text-white'
                              : 'border-charcoal-950/10 bg-white text-charcoal-800 hover:border-wine-700 hover:text-wine-700'
                          }`}
                          aria-current={galleryPage === page ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={galleryPage === totalGalleryPages}
                        onClick={() => setGalleryPage((p) => Math.min(totalGalleryPages, p + 1))}
                        className="button-outline min-h-9 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'Categorías' && (
            <>
              {notice && <div className="mb-5 flex items-start justify-between gap-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status"><span className="flex gap-2"><CircleAlert className="mt-0.5 shrink-0" size={17} />{notice}</span><button className="font-bold underline" type="button" onClick={() => setNotice('')}>Cerrar</button></div>}
              
              <section className="grid gap-px overflow-hidden rounded border border-charcoal-950/10 bg-charcoal-950/10 sm:grid-cols-2" aria-label="Resumen de Categorías">
                <Metric icon={<Boxes size={18} />} label="Categorías Totales" value={categories.length} detail={`${categories.filter(c => c.published).length} publicadas en el sitio`} />
              </section>

              <section className="mt-7">
                <CategoryTable
                  categories={categories}
                  selectedId={selectedCategoryItem?.id}
                  onSelect={setSelectedCategoryItem}
                  onDelete={handleDeleteCategoryItem}
                />
              </section>
            </>
          )}

          {activeTab === 'Resumen' && (
            <div className="space-y-6">
              <section className="grid gap-px overflow-hidden rounded border border-charcoal-950/10 bg-charcoal-950/10 sm:grid-cols-2" aria-label="Resumen del catálogo">
                <Metric icon={<Boxes size={18} />} label="Publicados" value={stats.published} detail={`${products.length} productos totales`} />
                <Metric icon={<Wifi size={18} />} label="Con probador virtual" value={stats.tryOn} detail="Solo collares" />
              </section>
              <div className="rounded-lg border border-charcoal-950/10 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-2">¡Bienvenido al Panel de Sumak Kawsay!</h2>
                <p className="text-sm text-charcoal-800/70">Usa el menú lateral para gestionar los productos del catálogo o cambiar la configuración general de la tienda.</p>
              </div>
            </div>
          )}

          {activeTab === 'Usuarios' && currentUser?.role === 'admin' && (
            <>
              <section className="grid gap-px overflow-hidden rounded border border-charcoal-950/10 bg-charcoal-950/10 sm:grid-cols-2" aria-label="Resumen de Usuarios">
                <Metric icon={<UsersIcon size={18} />} label="Usuarios Totales" value={users.length} detail={`${users.filter(u => u.role === 'admin').length} administradores, ${users.filter(u => u.role === 'editor').length} editores`} />
              </section>
              <section className="mt-7">
                <UserTable users={users} currentUserId={currentUser.id} onSelect={setSelectedUser} onDelete={handleDeleteUser} />
              </section>
            </>
          )}

          {activeTab === 'Configuración' && (
            <SettingsEditor />
          )}
        </>)}
        </div>
      </main>

      {selected && <ProductEditor product={selected} categories={categories} onClose={() => setSelected(undefined)} onSave={handleSave} />}
      {selectedGalleryItem && (
        <GalleryEditor
          item={selectedGalleryItem}
          onClose={() => setSelectedGalleryItem(undefined)}
          onSave={handleSaveGalleryItem}
        />
      )}
      {selectedCategoryItem && (
        <CategoryEditor
          category={selectedCategoryItem}
          onClose={() => setSelectedCategoryItem(undefined)}
          onSave={handleSaveCategoryItem}
        />
      )}
      {selectedUser && (
        <UserEditor
          user={selectedUser}
          onClose={() => setSelectedUser(undefined)}
          onSave={handleSaveUser}
        />
      )}
      {showProfile && currentUser && (
        <ProfileEditor
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onUpdated={(updated) => setCurrentUser(updated)}
        />
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return <div className="flex items-center gap-4 bg-white px-5 py-4"><span className="grid size-10 shrink-0 place-items-center rounded bg-ivory-100 text-wine-700">{icon}</span><span><strong className="block text-2xl leading-none">{value}</strong><span className="mt-1 block text-xs font-bold text-charcoal-800/70">{label}</span><small className="text-[0.68rem] text-charcoal-800/45">{detail}</small></span></div>;
}
