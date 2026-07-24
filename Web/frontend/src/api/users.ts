import { request } from './client';
import type { UserRequest, UserView } from './types';

export function listUsers(): Promise<UserView[]> {
  return request<UserView[]>('/api/users');
}

export function createUser(body: UserRequest): Promise<UserView> {
  return request<UserView>('/api/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateUser(id: number, body: UserRequest): Promise<UserView> {
  return request<UserView>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteUser(id: number): Promise<void> {
  return request<void>(`/api/users/${id}`, { method: 'DELETE' });
}
