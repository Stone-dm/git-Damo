import { request, requestRaw } from './client';
import type {
  PartyDuesBatchPayRequest,
  PartyDuesBatchRemindRequest,
  PartyDuesImportResult,
  PartyDuesPayRequest,
  PartyDuesRecordStatus,
  PartyDuesRecordView,
  PartyDuesStandardRequest,
  PartyDuesStandardView,
  PartyDuesStatsView,
} from './types';

export function createPartyDuesStandard(
  body: PartyDuesStandardRequest,
): Promise<PartyDuesStandardView> {
  return request<PartyDuesStandardView>('/api/party-dues/standards', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function importPartyDuesStandards(
  file: File,
): Promise<PartyDuesImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return requestRaw<PartyDuesImportResult>('/api/party-dues/standards/batch', {
    method: 'POST',
    body: formData,
  });
}

export function listPartyDuesStandards(params?: {
  branchId?: number | null;
}): Promise<PartyDuesStandardView[]> {
  const search = new URLSearchParams();
  if (params?.branchId) search.set('branchId', String(params.branchId));
  const qs = search.toString();
  return request<PartyDuesStandardView[]>(
    `/api/party-dues/standards${qs ? `?${qs}` : ''}`,
  );
}

export function updatePartyDuesStandard(
  id: number,
  body: PartyDuesStandardRequest,
): Promise<PartyDuesStandardView> {
  return request<PartyDuesStandardView>(`/api/party-dues/standards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function generatePartyDuesRecords(
  yearMonth: string,
): Promise<PartyDuesRecordView[]> {
  const search = new URLSearchParams({ yearMonth });
  return request<PartyDuesRecordView[]>(
    `/api/party-dues/generate?${search.toString()}`,
    { method: 'POST' },
  );
}

export function listPartyDuesRecords(params?: {
  branchId?: number | null;
  yearMonth?: string;
  status?: PartyDuesRecordStatus;
}): Promise<PartyDuesRecordView[]> {
  const search = new URLSearchParams();
  if (params?.branchId) search.set('branchId', String(params.branchId));
  if (params?.yearMonth) search.set('yearMonth', params.yearMonth);
  if (params?.status) search.set('status', params.status);
  const qs = search.toString();
  return request<PartyDuesRecordView[]>(
    `/api/party-dues/records${qs ? `?${qs}` : ''}`,
  );
}

export function payPartyDuesRecord(
  id: number,
  body: PartyDuesPayRequest,
): Promise<PartyDuesRecordView> {
  return request<PartyDuesRecordView>(`/api/party-dues/records/${id}/pay`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function batchPayPartyDuesRecords(
  body: PartyDuesBatchPayRequest,
): Promise<PartyDuesRecordView[]> {
  return request<PartyDuesRecordView[]>('/api/party-dues/records/batch-pay', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function remindPartyDuesRecord(
  id: number,
): Promise<PartyDuesRecordView> {
  return request<PartyDuesRecordView>(
    `/api/party-dues/records/${id}/remind`,
    { method: 'POST' },
  );
}

export function batchRemindPartyDuesRecords(
  body: PartyDuesBatchRemindRequest,
): Promise<PartyDuesRecordView[]> {
  return request<PartyDuesRecordView[]>(
    '/api/party-dues/records/batch-remind',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function getPartyDuesStats(
  yearMonth: string,
): Promise<PartyDuesStatsView> {
  const search = new URLSearchParams({ yearMonth });
  return request<PartyDuesStatsView>(
    `/api/party-dues/stats?${search.toString()}`,
  );
}

export function listMyPartyDuesRecords(): Promise<PartyDuesRecordView[]> {
  return request<PartyDuesRecordView[]>('/api/party-dues/my-records');
}
