import { request } from './client';
import type { TaskView } from './types';

export function listTasks(): Promise<TaskView[]> {
  return request<TaskView[]>('/api/tasks');
}

export function getTask(id: number): Promise<TaskView> {
  return request<TaskView>(`/api/tasks/${id}`);
}
