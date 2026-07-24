import { request } from './client';
import type { LearningView } from './types';

export function listLearning(): Promise<LearningView[]> {
  return request<LearningView[]>('/api/learning');
}
