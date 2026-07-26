import { request } from './client';
import type {
  TaskView,
  TaskRequest,
  TaskProgressView,
  BranchCompletionView,
} from './types';

export function listTasks(): Promise<TaskView[]> {
  return request<TaskView[]>('/api/tasks');
}

export function getTask(id: number): Promise<TaskView> {
  return request<TaskView>(`/api/tasks/${id}`);
}

export function createTask(body: TaskRequest): Promise<TaskView> {
  return request<TaskView>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateTask(
  id: number,
  body: Partial<TaskRequest>,
): Promise<TaskView> {
  return request<TaskView>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}

/** 派发任务（将草稿状态改为进行中） */
export function dispatchTask(id: number): Promise<TaskView> {
  return request<TaskView>(`/api/tasks/${id}/dispatch`, { method: 'POST' });
}

/** 关闭任务 */
export function closeTask(id: number): Promise<TaskView> {
  return request<TaskView>(`/api/tasks/${id}/close`, { method: 'POST' });
}

/** 重新开放已关闭的任务 */
export function reopenTask(id: number): Promise<TaskView> {
  return request<TaskView>(`/api/tasks/${id}/reopen`, { method: 'POST' });
}

/** 获取某个任务的个人完成进度列表 */
export function getTaskProgress(
  taskId: number,
): Promise<TaskProgressView[]> {
  return request<TaskProgressView[]>(`/api/tasks/${taskId}/progress`);
}

/** 获取某个任务的各支部完成率 */
export function getBranchCompletion(
  taskId: number,
): Promise<BranchCompletionView[]> {
  return request<BranchCompletionView[]>(
    `/api/tasks/${taskId}/branch-completion`,
  );
}
