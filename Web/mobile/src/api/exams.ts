import { request } from './client';
import type { ExamView } from './types';

export function listExams(): Promise<ExamView[]> {
  return request<ExamView[]>('/api/exams');
}
