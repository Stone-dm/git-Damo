import { request } from './client';
import type { PlanStatus, TrainingPlanView, TrainingRecordView } from './types';

// plans
export function listTrainingPlans(): Promise<TrainingPlanView[]> {
  return request<TrainingPlanView[]>('/api/training/plans');
}

export function createTrainingPlan(body: {
  title: string;
  description?: string;
  planType: string;
  status?: PlanStatus;
  deadline?: string;
  relatedStage?: string;
}): Promise<TrainingPlanView> {
  return request<TrainingPlanView>('/api/training/plans', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function publishTrainingPlan(id: number, status: PlanStatus): Promise<TrainingPlanView> {
  return request<TrainingPlanView>(`/api/training/plans/${id}/publish?status=${status}`, {
    method: 'PUT',
  });
}

export function deleteTrainingPlan(id: number): Promise<void> {
  return request<void>(`/api/training/plans/${id}`, { method: 'DELETE' });
}

export function batchAssignPlan(planId: number, branchIds: number[]): Promise<number> {
  return request<number>(`/api/training/plans/${planId}/batch-assign`, {
    method: 'POST',
    body: JSON.stringify(branchIds),
  });
}

// records
export function markTrainingComplete(
  planId: number,
  userId: number,
): Promise<TrainingRecordView> {
  return request<TrainingRecordView>(
    `/api/training/plans/${planId}/complete/${userId}`,
    { method: 'POST' },
  );
}

export function listTrainingRecordsByPlan(
  planId: number,
): Promise<TrainingRecordView[]> {
  return request<TrainingRecordView[]>(`/api/training/plans/${planId}/records`);
}

export function listTrainingRecordsByUser(
  userId: number,
): Promise<TrainingRecordView[]> {
  return request<TrainingRecordView[]>(`/api/training/users/${userId}/records`);
}
