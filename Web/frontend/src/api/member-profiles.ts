import { request } from './client';
import type {
  FloatingContactRequest,
  FloatingContactView,
  MemberDocumentView,
  MemberProfileRequest,
  MemberProfileView,
} from './types';

export function listMemberProfiles(params?: {
  branchId?: number;
}): Promise<MemberProfileView[]> {
  const search = new URLSearchParams();
  if (params?.branchId) search.set('branchId', String(params.branchId));
  const qs = search.toString();
  return request<MemberProfileView[]>(
    `/api/member-profiles${qs ? `?${qs}` : ''}`,
  );
}

export function getMemberProfileByUserId(
  userId: number,
): Promise<MemberProfileView> {
  return request<MemberProfileView>(`/api/member-profiles/user/${userId}`);
}

export function saveMemberProfile(
  body: MemberProfileRequest,
): Promise<MemberProfileView> {
  return request<MemberProfileView>('/api/member-profiles', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listFloatingMembers(): Promise<MemberProfileView[]> {
  return request<MemberProfileView[]>('/api/member-profiles/floating');
}

// ---- 流动党员管理 ----

/** 将党员标记为流动状态 */
export function markFloating(
  userId: number,
  body: MemberProfileRequest,
): Promise<MemberProfileView> {
  return request<MemberProfileView>(
    `/api/member-profiles/${userId}/mark-floating`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

/** 将流动党员转回正常状态 */
export function returnFromFloating(
  userId: number,
): Promise<MemberProfileView> {
  return request<MemberProfileView>(
    `/api/member-profiles/${userId}/return`,
    { method: 'POST' },
  );
}

/** 添加联系记录 */
export function addFloatingContact(
  userId: number,
  body: FloatingContactRequest,
): Promise<FloatingContactView> {
  return request<FloatingContactView>(
    `/api/member-profiles/${userId}/floating-contacts`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

/** 查看联系记录列表 */
export function listFloatingContacts(
  userId: number,
): Promise<FloatingContactView[]> {
  return request<FloatingContactView[]>(
    `/api/member-profiles/${userId}/floating-contacts`,
  );
}

/** 编辑联系记录 */
export function updateFloatingContact(
  id: number,
  body: FloatingContactRequest,
): Promise<FloatingContactView> {
  return request<FloatingContactView>(
    `/api/member-profiles/floating-contacts/${id}`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
}

/** 删除联系记录 */
export function deleteFloatingContact(id: number): Promise<void> {
  return request<void>(`/api/member-profiles/floating-contacts/${id}`, {
    method: 'DELETE',
  });
}

// ---- 党员档案材料 ----

/** 上传档案材料 */
export function uploadMemberDocument(
  userId: number,
  formData: FormData,
): Promise<MemberDocumentView> {
  return request<MemberDocumentView>(
    `/api/member-profiles/${userId}/documents`,
    { method: 'POST', body: formData },
  );
}

/** 查看某党员的档案材料列表 */
export function listMemberDocuments(
  userId: number,
): Promise<MemberDocumentView[]> {
  return request<MemberDocumentView[]>(
    `/api/member-profiles/${userId}/documents`,
  );
}

/** 获取文件预签名下载URL */
export function getMemberDocumentFileUrl(
  userId: number,
  docId: number,
): Promise<string> {
  return request<string>(
    `/api/member-profiles/${userId}/documents/${docId}/file`,
  );
}

/** 删除档案材料 */
export function deleteMemberDocument(
  userId: number,
  docId: number,
): Promise<void> {
  return request<void>(
    `/api/member-profiles/${userId}/documents/${docId}`,
    { method: 'DELETE' },
  );
}
