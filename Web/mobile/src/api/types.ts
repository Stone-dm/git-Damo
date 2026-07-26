export type Role = 'ADMIN' | 'SECRETARY' | 'MEMBER';

export type KbType = 'PERSONAL' | 'LEARNING';

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export type ExamStatus = 'DRAFT' | 'OPEN';

export type TaskType = 'LEARNING' | 'EXAM';

export type TaskStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

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

export interface KbDocumentView {
  id: number;
  title: string;
  kbType: KbType;
  ownerUserId: number | null;
  branchId: number | null;
  sourceName: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
}

export interface KnowledgeUploadRequest {
  title: string;
  kbType: KbType;
  content: string;
  sourceName?: string;
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

export interface ExamView {
  id: number;
  title: string;
  status: ExamStatus;
  branchId: number | null;
}

export interface TaskView {
  id: number;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  targetType: 'ALL' | 'BRANCH';
  targetBranchIds: number[] | null;
  referenceId: number | null;
  dueDate: string | null;
  createdAt: string;
}
