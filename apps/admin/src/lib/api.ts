import type { AdminProduct, AdminGalleryItem, AdminCategory, AdminUser } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getToken = (): string => {
  return localStorage.getItem('admin_token') || '';
};

const headers = (contentType = false): HeadersInit => {
  const token = getToken();
  return {
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/* ── Auth ──────────────────────────────────────────────────────── */

export async function login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const response = await fetch(`${API_URL}/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorBody?.error || 'Usuario o contraseña incorrectos');
  }
  return response.json() as Promise<{ token: string; user: AdminUser }>;
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/v1/admin/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error('Error al solicitar recuperación');
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_URL}/v1/admin/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorBody?.error || 'Error al restablecer contraseña');
  }
}

/* ── Validation ────────────────────────────────────────────────── */

export function formatValidationErrorIssue(issue: { path?: (string | number)[]; message: string }): string {
  let msg = issue.message;
  if (msg.includes('Too big') || msg.includes('expected string to have <=')) {
    const match = msg.match(/<=(\d+)/);
    const maxChars = match ? match[1] : '';
    msg = `el texto es demasiado largo (máximo: ${maxChars} caracteres)`;
  } else if (msg.includes('Too small') || msg.includes('expected string to have >=')) {
    const match = msg.match(/>=(\d+)/);
    const minChars = match ? match[1] : '';
    msg = `el texto es demasiado corto (mínimo: ${minChars} caracteres)`;
  }
  
  const fieldPath = issue.path?.join('.') ?? '';
  let fieldLabel = fieldPath;
  if (fieldPath.includes('seoTitle')) fieldLabel = 'Título SEO';
  else if (fieldPath.includes('seoDescription')) fieldLabel = 'Meta description';
  else if (fieldPath.includes('name')) fieldLabel = 'Nombre';
  else if (fieldPath.includes('description')) fieldLabel = 'Descripción';
  else if (fieldPath.includes('materials')) fieldLabel = 'Materiales';
  else if (fieldPath.includes('careInstructions')) fieldLabel = 'Instrucciones de cuidado';
  
  return `${fieldLabel}: ${msg}`;
}

export class ValidationError extends Error {
  public issues: Array<{ path?: (string | number)[]; message: string }>;

  constructor(issues: Array<{ path?: (string | number)[]; message: string }>, message: string) {
    const mappedIssues = issues.map(issue => {
      let msg = issue.message;
      if (msg.includes('Too big') || msg.includes('expected string to have <=')) {
        const match = msg.match(/<=(\d+)/);
        const maxChars = match ? match[1] : '';
        msg = `El texto es demasiado largo (máximo: ${maxChars} caracteres).`;
      } else if (msg.includes('Too small') || msg.includes('expected string to have >=')) {
        const match = msg.match(/>=(\d+)/);
        const minChars = match ? match[1] : '';
        msg = `El texto es demasiado corto (mínimo: ${minChars} caracteres).`;
      }
      return { ...issue, message: msg };
    });
    super(message);
    this.issues = mappedIssues;
    this.name = 'ValidationError';
  }
}

async function ensureOk(response: Response, message: string): Promise<Response> {
  if (response.status === 401) {
    throw new Error('Clave de administración inválida o ausente.');
  }
  if (response.status === 403) {
    throw new Error('No tienes permisos para esta acción.');
  }
  if (response.status === 400) {
    const body = await response.json().catch(() => null) as { issues?: Array<{ path?: (string | number)[]; message: string }> } | null;
    const issues = body?.issues || [];
    const detail = issues.map(formatValidationErrorIssue).join(' · ');
    throw new ValidationError(issues, detail || 'La API rechazó los datos enviados.');
  }
  if (!response.ok) throw new Error(message);
  return response;
}

/* ── Current User ──────────────────────────────────────────────── */

export async function getMe(): Promise<AdminUser> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/me`, { headers: headers() }),
    'No se pudo obtener la información del usuario.'
  );
  return response.json() as Promise<AdminUser>;
}

export async function updateMe(data: { name?: string; email?: string; password?: string; photoUrl?: string }): Promise<AdminUser> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/me`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    }),
    'No se pudo actualizar el perfil.'
  );
  return response.json() as Promise<AdminUser>;
}

/* ── User Management ───────────────────────────────────────────── */

export async function listUsers(): Promise<AdminUser[]> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/users`, { headers: headers() }),
    'No se pudieron cargar los usuarios.'
  );
  const data = await response.json() as { users: AdminUser[] };
  return data.users;
}

export async function saveUser(user: AdminUser & { password?: string }): Promise<AdminUser> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(user),
    }),
    'No se pudo guardar el usuario.'
  );
  return response.json() as Promise<AdminUser>;
}

export async function deleteUser(id: string): Promise<void> {
  await ensureOk(
    await fetch(`${API_URL}/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers: headers(),
    }),
    'No se pudo eliminar el usuario.'
  );
}

/* ── Products ──────────────────────────────────────────────────── */

export async function listProducts(): Promise<AdminProduct[]> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/products`, { headers: headers() }),
    'API unavailable',
  );
  const data = await response.json() as { products: AdminProduct[] };
  return data.products;
}

export async function saveProduct(product: AdminProduct): Promise<AdminProduct> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/products/${product.id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(product),
    }),
    'Could not save product',
  );
  return response.json() as Promise<AdminProduct>;
}

export async function regenerateTranslation(productId: string) {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/products/${productId}/translate/en`, {
      method: 'POST',
      headers: headers(),
    }),
    'Could not translate product',
  );
  return response.json() as Promise<AdminProduct>;
}

/* ── Upload ────────────────────────────────────────────────────── */

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const signatureResponse = await fetch(`${API_URL}/v1/admin/uploads/signature`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ resourceType: 'image' }),
  });

  if (signatureResponse.status === 503) {
    throw new Error(
      'Cloudinary no está configurado. Completa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el archivo .env y reinicia la API.',
    );
  }
  if (!signatureResponse.ok) throw new Error('No se pudo obtener la firma de subida.');

  const signature = await signatureResponse.json() as {
    timestamp: number;
    folder: string;
    signature: string;
    cloudName: string;
    apiKey: string;
  };

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('folder', signature.folder);
  form.append('signature', signature.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!uploadResponse.ok) throw new Error('Cloudinary rechazó la subida de la imagen.');

  const uploaded = await uploadResponse.json() as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  };

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
  };
}

/* ── Settings ──────────────────────────────────────────────────── */

export interface AdminSettings {
  adminEmail: string;
  adminUsername: string;
  adminPassword?: string;
  destinationEmail: string;
}

export async function getSettings(): Promise<AdminSettings> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/settings`, { headers: headers() }),
    'No se pudieron cargar las configuraciones.'
  );
  return response.json() as Promise<AdminSettings>;
}

export async function saveSettings(settings: AdminSettings): Promise<AdminSettings> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/settings`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(settings),
    }),
    'No se pudieron guardar las configuraciones.'
  );
  return response.json() as Promise<AdminSettings>;
}

/* ── Gallery ───────────────────────────────────────────────────── */

export async function listGalleryItems(): Promise<AdminGalleryItem[]> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/gallery`, { headers: headers() }),
    'No se pudieron cargar los elementos de la galería.'
  );
  const data = await response.json() as { items: AdminGalleryItem[] };
  return data.items;
}

export async function saveGalleryItem(item: AdminGalleryItem): Promise<AdminGalleryItem> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/gallery/${item.id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(item),
    }),
    'No se pudo guardar el elemento de la galería.'
  );
  return response.json() as Promise<AdminGalleryItem>;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await ensureOk(
    await fetch(`${API_URL}/v1/admin/gallery/${id}`, {
      method: 'DELETE',
      headers: headers(),
    }),
    'No se pudo eliminar el elemento de la galería.'
  );
}

/* ── Categories ────────────────────────────────────────────────── */

export async function listCategories(): Promise<AdminCategory[]> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/categories`, { headers: headers() }),
    'No se pudieron cargar las categorías.'
  );
  const data = await response.json() as { items: AdminCategory[] };
  return data.items;
}

export async function saveCategory(category: AdminCategory): Promise<AdminCategory> {
  const response = await ensureOk(
    await fetch(`${API_URL}/v1/admin/categories/${category.id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(category),
    }),
    'No se pudo guardar la categoría.'
  );
  return response.json() as Promise<AdminCategory>;
}

export async function deleteCategory(id: string): Promise<void> {
  await ensureOk(
    await fetch(`${API_URL}/v1/admin/categories/${id}`, {
      method: 'DELETE',
      headers: headers(),
    }),
    'No se pudo eliminar la categoría.'
  );
}
