export type Role = 'ADMIN' | 'SECRETARY' | 'MEMBER';

export interface UserView {
  id: number;
  username: string;
  name: string;
  role: Role;
  branchId: number | null;
}

export interface LoginResponse {
  token: string;
  user: UserView;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LearningView {
  id: number;
  title: string;
  summary: string | null;
  branchId: number | null;
  createdAt: string;
}

export interface RecommendRequest {
  query?: string;
}

export interface RecommendItem {
  title: string;
  reason: string;
  document_id: string;
}

export interface RecommendResponse {
  items: RecommendItem[];
}

export interface ChatHistoryItem {
  role: string;
  content: string;
}

export interface ChatRequest {
  message: string;
  documentId?: number | null;
  text?: string | null;
  history?: ChatHistoryItem[];
}

export interface ChatResponse {
  reply: string;
}
