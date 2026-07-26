import { getToken } from './client';
import type { ApiResponse, QuestionView, QuestionImportResult } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function listQuestions(): Promise<QuestionView[]> {
  const res = await fetch(`${BASE}/api/questions`, {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  const body: ApiResponse<QuestionView[]> = await res.json();
  if (body.code !== 0) throw new Error(body.message);
  return body.data;
}

export async function deleteQuestion(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/questions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  const body: ApiResponse<null> = await res.json();
  if (body.code !== 0) throw new Error(body.message);
}

export async function importQuestions(file: File): Promise<QuestionImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE}/api/questions/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
    body: formData,
  });
  const body: ApiResponse<QuestionImportResult> = await res.json();
  if (body.code !== 0) throw new Error(body.message);
  return body.data;
}
