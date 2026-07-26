import { request } from './client';
import type {
  DevelopmentRecordRequest,
  DevelopmentRecordView,
  DevelopmentStage,
} from './types';

export function createDevelopmentRecord(
  body: DevelopmentRecordRequest,
): Promise<DevelopmentRecordView> {
  return request<DevelopmentRecordView>('/api/development-records', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listDevelopmentByUser(
  userId: number,
): Promise<DevelopmentRecordView[]> {
  return request<DevelopmentRecordView[]>(
    `/api/development-records/user/${userId}`,
  );
}

export function listDevelopmentRecords(params?: {
  stage?: DevelopmentStage;
}): Promise<DevelopmentRecordView[]> {
  const search = new URLSearchParams();
  if (params?.stage) search.set('stage', params.stage);
  const qs = search.toString();
  return request<DevelopmentRecordView[]>(
    `/api/development-records${qs ? `?${qs}` : ''}`,
  );
}
