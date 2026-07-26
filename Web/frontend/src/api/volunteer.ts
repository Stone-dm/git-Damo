import { request } from './client';
import type {
  VolunteerActivityView,
  VolunteerActivityRequest,
  VolunteerSignupView,
  VolunteerStats,
} from './types';

// ---- 活动管理 ----

export function createActivity(
  body: VolunteerActivityRequest,
): Promise<VolunteerActivityView> {
  return request<VolunteerActivityView>('/api/volunteer/activities', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listActivities(params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<VolunteerActivityView[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  const qs = search.toString();
  return request<VolunteerActivityView[]>(
    `/api/volunteer/activities${qs ? `?${qs}` : ''}`,
  );
}

export function getActivity(
  id: number,
): Promise<VolunteerActivityView> {
  return request<VolunteerActivityView>(`/api/volunteer/activities/${id}`);
}

export function updateActivity(
  id: number,
  body: VolunteerActivityRequest,
): Promise<VolunteerActivityView> {
  return request<VolunteerActivityView>(
    `/api/volunteer/activities/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
}

export function deleteActivity(id: number): Promise<void> {
  return request<void>(`/api/volunteer/activities/${id}`, {
    method: 'DELETE',
  });
}

/** 发布活动（草稿 → 已发布） */
export function publishActivity(
  id: number,
): Promise<VolunteerActivityView> {
  return request<VolunteerActivityView>(
    `/api/volunteer/activities/${id}/publish`,
    { method: 'PUT' },
  );
}

/** 结束活动（进行中/已发布 → 已结束） */
export function finishActivity(
  id: number,
): Promise<VolunteerActivityView> {
  return request<VolunteerActivityView>(
    `/api/volunteer/activities/${id}/finish`,
    { method: 'PUT' },
  );
}

// ---- 报名管理 ----

/** 党员报名活动 */
export function signup(
  activityId: number,
  notes?: string,
): Promise<VolunteerSignupView> {
  return request<VolunteerSignupView>(
    `/api/volunteer/activities/${activityId}/signup`,
    { method: 'POST', body: JSON.stringify({ notes }) },
  );
}

/** 取消报名 */
export function cancelSignup(activityId: number): Promise<void> {
  return request<void>(
    `/api/volunteer/activities/${activityId}/signup`,
    { method: 'DELETE' },
  );
}

/** 获取活动报名列表 */
export function listSignups(
  activityId: number,
): Promise<VolunteerSignupView[]> {
  return request<VolunteerSignupView[]>(
    `/api/volunteer/activities/${activityId}/signups`,
  );
}

/** 记录参与（填写服务时长） */
export function attend(
  signupId: number,
  serviceHours: number,
): Promise<VolunteerSignupView> {
  return request<VolunteerSignupView>(
    `/api/volunteer/signups/${signupId}/attend`,
    {
      method: 'PUT',
      body: JSON.stringify({ serviceHours }),
    },
  );
}

// ---- 统计 ----

/** 志愿服务统计数据 */
export function getVolunteerStats(): Promise<VolunteerStats> {
  return request<VolunteerStats>('/api/volunteer/stats');
}
