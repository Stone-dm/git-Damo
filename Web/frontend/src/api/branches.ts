import { request } from './client';
import type { BranchRequest, BranchView } from './types';

export function listBranches(): Promise<BranchView[]> {
  return request<BranchView[]>('/api/branches');
}

export function createBranch(body: BranchRequest): Promise<BranchView> {
  return request<BranchView>('/api/branches', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateBranch(
  id: number,
  body: BranchRequest,
): Promise<BranchView> {
  return request<BranchView>(`/api/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteBranch(id: number): Promise<void> {
  return request<void>(`/api/branches/${id}`, { method: 'DELETE' });
}
