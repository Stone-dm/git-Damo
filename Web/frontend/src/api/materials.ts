import { getToken } from './client';
import type { ApiResponse, MaterialView, MaterialType } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function listMaterials(): Promise<MaterialView[]> {
  const res = await fetch(`${BASE}/api/materials`, { headers: authHeader() });
  const body: ApiResponse<MaterialView[]> = await res.json();
  if (body.code !== 0) throw new Error(body.message);
  return body.data;
}

export async function uploadMaterial(
  title: string,
  type: MaterialType,
  file: File,
): Promise<MaterialView> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('type', type);
  formData.append('file', file);

  const res = await fetch(`${BASE}/api/materials`, {
    method: 'POST',
    headers: { Authorization: authHeader().Authorization },
    body: formData,
  });
  const body: ApiResponse<MaterialView> = await res.json();
  if (body.code !== 0) throw new Error(body.message);
  return body.data;
}

export async function deleteMaterial(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/materials/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const body: ApiResponse<null> = await res.json();
  if (body.code !== 0) throw new Error(body.message);
}

function authHeader() {
  return { Authorization: `Bearer ${getToken() ?? ''}` };
}
