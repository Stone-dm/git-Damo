import { request } from './client';
import type { TrainingPlanView, TrainingRecordView } from './types';

// plans
export function listTrainingPlans(): Promise<TrainingPlanView[]> {
  return request<TrainingPlanView[]>('/api/training/plans');
}

export function createTrainingPlan(body: {
  title: string;
  description?: string;
  planType: string;
}): Promise<TrainingPlanView> {
  return request<TrainingPlanView>('/api/training/plans', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteTrainingPlan(id: number): Promise<void> {
  return request<void>(`/api/training/plans/${id}`, { method: 'DELETE' });
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
