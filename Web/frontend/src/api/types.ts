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

// ---- 智能任务解析 ----

export interface ParseTaskRequest {
  text: string;
}

export interface ParseTaskResponse {
  title: string;
  type: 'LEARNING' | 'EXAM';
  description: string;
  targetType: 'ALL' | 'BRANCH';
  branchIds: number[];
  deadline: string | null;
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
  floatingStartDate: string | null;
  floatingReason: string | null;
  floatingExpectedReturn: string | null;
  floatingContact: string | null;
  currentStage: string | null;
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
  floatingStartDate?: string;
  floatingReason?: string;
  floatingExpectedReturn?: string;
  floatingContact?: string;
}

// ---- 流动党员联系记录 ----

export type ContactMethod = 'PHONE' | 'WECHAT' | 'VISIT' | 'LETTER';

export interface FloatingContactView {
  id: number;
  userId: number;
  contactDate: string;
  contactMethod: ContactMethod;
  summary: string | null;
  createdAt: string;
}

export interface FloatingContactRequest {
  contactDate: string;
  contactMethod: ContactMethod;
  summary?: string;
}

// ---- 党员档案材料 ----

export type DocType =
  | 'APPLICATION'
  | 'TALK_RECORD'
  | 'THOUGHT_REPORT'
  | 'CULTIVATION_FORM'
  | 'TRAINING_CERT'
  | 'POLITICAL_REVIEW'
  | 'AUTOBIOGRAPHY'
  | 'PUBLIC_NOTICE'
  | 'VOLUNTEER_FORM'
  | 'PROBATION_REPORT'
  | 'PROBATION_FORM'
  | 'CONVERSION_APPLICATION';

export interface MemberDocumentView {
  id: number;
  userId: number;
  docType: DocType;
  title: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
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

// ---- 培养联系人 ----

export interface CultivationContactView {
  id: number;
  mentorUserId: number;
  mentorName: string;
  mentorPhone: string | null;
  traineeUserId: number;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
}

export interface CultivationContactRequest {
  mentorUserId: number;
  traineeUserId: number;
  role?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// ---- 培养教育 ----

export type PlanType = 'THEORY' | 'PRACTICE' | 'EDUCATION';

export type PlanStatus = 'DRAFT' | 'ACTIVE';

export interface TrainingPlanView {
  id: number;
  title: string;
  description: string | null;
  planType: PlanType;
  status: PlanStatus;
  deadline: string | null;
  relatedStage: string | null;
  createdAt: string;
}

export interface TrainingRecordView {
  id: number;
  planId: number;
  planTitle: string;
  userId: number;
  userName: string;
  branchId: number | null;
  branchName: string;
  completed: boolean;
  completedAt: string | null;
}

// ---- 组织材料归档 ----

export type ArchiveCategory =
  | 'MEETING_BRANCH'
  | 'MEETING_COMMITTEE'
  | 'MEETING_GROUP'
  | 'PARTY_LECTURE'
  | 'THEME_DAY'
  | 'ORG_LIFE'
  | 'ELECTION'
  | 'PLAN_SUMMARY'
  | 'SUPERIOR_DOC';

export interface BranchArchiveView {
  id: number;
  branchId: number;
  category: ArchiveCategory;
  title: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  recordDate: string;
  uploadedAt: string;
  uploaderId: number;
  // 三会一课结构化字段
  hostUserId: number | null;
  hostUserName: string | null;
  recorderUserId: number | null;
  recorderUserName: string | null;
  expectedCount: number | null;
  actualCount: number | null;
  absentCount: number | null;
  topics: string | null;
  location: string | null;
}

export interface BranchArchiveRequest {
  category: ArchiveCategory;
  title: string;
  content?: string;
  recordDate?: string;
  file?: File;
}

// ---- 志愿服务管理 ----

export type ActivityStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'FINISHED'
  | 'CANCELLED';

export type SignupStatus = 'SIGNED_UP' | 'PARTICIPATED' | 'ABSENT';

export interface VolunteerActivityView {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  maxParticipants: number | null;
  organizerId: number;
  organizerName: string;
  status: ActivityStatus;
  signupCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerActivityRequest {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
}

export interface VolunteerSignupView {
  id: number;
  activityId: number;
  userId: number;
  userName: string;
  status: SignupStatus;
  serviceHours: number | null;
  notes: string | null;
  signedUpAt: string;
  participatedAt: string | null;
}

export interface MonthlyStats {
  month: string;
  activityCount: number;
  serviceHours: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface VolunteerStats {
  totalActivities: number;
  totalParticipations: number;
  totalServiceHours: number;
  thisMonthActivities: number;
  thisMonthParticipations: number;
  thisMonthServiceHours: number;
  thisYearActivities: number;
  thisYearParticipations: number;
  thisYearServiceHours: number;
  monthlyTrends: MonthlyStats[];
  statusDistribution: StatusCount[];
}
