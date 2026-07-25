import { request } from './client';
import type { MemberProfileRequest, MemberProfileView } from './types';

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
