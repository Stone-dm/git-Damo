import { request } from './client';
import type {
  ChatRequest,
  ChatResponse,
  ParseTaskRequest,
  ParseTaskResponse,
  RecommendRequest,
  RecommendResponse,
} from './types';

export function recommend(
  body: RecommendRequest = {},
): Promise<RecommendResponse> {
  return request<RecommendResponse>('/api/agent/recommend', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function chat(body: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function parseTask(body: ParseTaskRequest): Promise<ParseTaskResponse> {
  return request<ParseTaskResponse>('/api/agent/parse-task', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
