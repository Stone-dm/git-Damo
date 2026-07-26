import { request } from './client';
import type { KbDocumentView, KnowledgeUploadRequest } from './types';

export function listKnowledge(): Promise<KbDocumentView[]> {
  return request<KbDocumentView[]>('/api/knowledge');
}

export function uploadKnowledge(
  body: KnowledgeUploadRequest,
): Promise<KbDocumentView> {
  return request<KbDocumentView>('/api/knowledge/upload', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
