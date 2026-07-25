export type Role = 'ADMIN' | 'SECRETARY' | 'MEMBER';

export type KbType = 'PERSONAL' | 'LEARNING';

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export type ExamStatus = 'DRAFT' | 'OPEN';

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

export interface UserRequest {
  username: string;
  password?: string;
  name: string;
  role: Role;
  branchId?: number | null;
}

export interface BranchView {
  id: number;
  name: string;
  description: string | null;
}

export interface BranchRequest {
  name: string;
  description?: string;
}

export interface LearningView {
  id: number;
  title: string;
  summary: string | null;
  branchId: number | null;
  createdAt: string;
}

export interface ExamView {
  id: number;
  title: string;
  status: ExamStatus;
  branchId: number | null;
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

// ---- 资源中心 ----

export type MaterialType = 'TEXT' | 'IMAGE' | 'VIDEO';

export interface MaterialView {
  id: number;
  title: string;
  type: MaterialType;
  content: string | null;
  fileUrl: string | null;
  fileAccessUrl: string | null;
  branchId: number | null;
  uploaderId: number | null;
  createdAt: string;
}

export type QuestionType = 'SINGLE' | 'MULTI' | 'JUDGE' | 'FILL' | 'ESSAY';

export interface QuestionView {
  id: number | null;
  stem: string;
  type: QuestionType;
  optionsJson: string | null;
  answer: string;
  analysis: string | null;
  score: number;
  orderNum: number;
}

export interface QuestionImportResult {
  parsedCount: number;
  errors: string[];
  questions: QuestionView[];
}

// ---- 任务中心 ----

export type TaskType = 'LEARNING' | 'EXAM';

export type TaskStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface TaskView {
  id: number;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  targetType: 'ALL' | 'BRANCH';
  targetBranchIds: number[] | null;
  referenceId: number | null; // 关联的学习材料或考试ID
  dueDate: string | null;
  createdAt: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  type: TaskType;
  targetType: 'ALL' | 'BRANCH';
  targetBranchIds?: number[];
  referenceId?: number;
  dueDate?: string;
}

export interface TaskProgressView {
  userId: number;
  userName: string;
  branchId: number | null;
  branchName: string;
  completed: boolean;
  completedAt: string | null;
}

export interface BranchCompletionView {
  branchId: number;
  branchName: string;
  totalAssigned: number;
  completedCount: number;
  completionRate: number; // 0-100
}

// ---- 党员管理 ----

export type MemberStatus = 'FORMAL' | 'PROBATIONARY' | 'FLOATING';

export interface MemberProfileView {
  id: number | null;
  userId: number;
  userName: string;
  branchId: number | null;
  branchName: string;
  gender: string | null;
  ethnicity: string | null;
  birthDate: string | null;
  idCard: string | null;
  phone: string | null;
  education: string | null;
  degree: string | null;
  workplace: string | null;
  position: string | null;
  joinDate: string | null;
  formalDate: string | null;
  memberStatus: MemberStatus | null;
  floatingLocation: string | null;
}

export interface MemberProfileRequest {
  userId: number;
  gender?: string;
  ethnicity?: string;
  birthDate?: string;
  idCard?: string;
  phone?: string;
  education?: string;
  degree?: string;
  workplace?: string;
  position?: string;
  joinDate?: string;
  formalDate?: string;
  memberStatus?: MemberStatus;
  floatingLocation?: string;
}

// ---- 发展党员阶段 ----

export type DevelopmentStage =
  | 'APPLICANT'
  | 'ACTIVIST'
  | 'DEVELOPMENT_TARGET'
  | 'PROBATIONARY'
  | 'FORMAL';

export interface DevelopmentRecordView {
  id: number;
  userId: number;
  userName: string;
  stage: DevelopmentStage;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DevelopmentRecordRequest {
  userId: number;
  stage: DevelopmentStage;
  startDate: string;
  endDate?: string;
  notes?: string;
}

// ---- 培养教育 ----

export type PlanType = 'THEORY' | 'PRACTICE' | 'EDUCATION';

export interface TrainingPlanView {
  id: number;
  title: string;
  description: string | null;
  planType: PlanType;
  createdAt: string;
}

export interface TrainingRecordView {
  id: number;
  planId: number;
  planTitle: string;
  userId: number;
  userName: string;
  completed: boolean;
  completedAt: string | null;
}
