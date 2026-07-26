import { request, requestRaw } from './client';
import type { BranchArchiveView, BranchRequest, BranchView, UserView } from './types';

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

// ---- 组织材料归档 ----

/** 创建归档材料（支持上传附件） */
export function createArchive(
  branchId: number,
  body: FormData,
): Promise<BranchArchiveView> {
  return requestRaw<BranchArchiveView>(
    `/api/branches/${branchId}/archives`,
    { method: 'POST', body },
  );
}

/** 列表查询（支持 category 和日期范围筛选） */
export function listArchives(
  branchId: number,
  params?: { category?: string; dateFrom?: string; dateTo?: string },
): Promise<BranchArchiveView[]> {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  const qs = search.toString();
  return request<BranchArchiveView[]>(
    `/api/branches/${branchId}/archives${qs ? `?${qs}` : ''}`,
  );
}

/** 获取详情 */
export function getArchive(
  branchId: number,
  id: number,
): Promise<BranchArchiveView> {
  return request<BranchArchiveView>(`/api/branches/${branchId}/archives/${id}`);
}

/** 编辑归档材料（支持替换附件） */
export function updateArchive(
  branchId: number,
  id: number,
  body: FormData,
): Promise<BranchArchiveView> {
  return requestRaw<BranchArchiveView>(
    `/api/branches/${branchId}/archives/${id}`,
    { method: 'PUT', body },
  );
}

/** 删除归档材料 */
export function deleteArchive(
  branchId: number,
  id: number,
): Promise<void> {
  return request<void>(`/api/branches/${branchId}/archives/${id}`, {
    method: 'DELETE',
  });
}

/** 获取支部内可选用户列表（主持人/记录人） */
export function listBranchUsers(branchId: number): Promise<UserView[]> {
  return request<UserView[]>(`/api/branches/${branchId}/archives/users`);
}
