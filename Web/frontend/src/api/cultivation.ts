import { request } from './client';
import type { CultivationContactRequest, CultivationContactView } from './types';

export function createCultivationContact(
  body: CultivationContactRequest,
): Promise<CultivationContactView> {
  return request<CultivationContactView>('/api/cultivation-contacts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listCultivationContacts(
  userId: number,
): Promise<CultivationContactView[]> {
  return request<CultivationContactView[]>(
    `/api/cultivation-contacts/user/${userId}`,
  );
}

export function deleteCultivationContact(id: number): Promise<void> {
  return request<void>(`/api/cultivation-contacts/${id}`, { method: 'DELETE' });
}
