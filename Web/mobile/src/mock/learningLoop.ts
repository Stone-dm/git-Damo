/**
 * 党员学习闭环 — 本地模拟数据
 * 对应流程图节点字段已预留后端对接（id / syncStatus 等）
 * 无需后端即可完整预览首页与闭环流程
 */

/** 流程图业务节点标识 */
export type FlowNode =
  | 'receive_task' // 接收学习任务 / 专题党课推送
  | 'learn_theory' // 图文视频理论学习
  | 'learn_vr' // VR 红色实景研学
  | 'learn_march' // 重走长征路
  | 'learn_crowdfund' // 党课投票投稿
  | 'quiz' // 线上答题测验
  | 'review' // 错题闯关温习
  | 'ai_focus' // AI 专注度 + 建议
  | 'ai_portrait' // AI 学习画像 / 思想动态
  | 'ai_weak' // 薄弱点专项推送
  | 'report' // 个人综合成长报告
  | 'plan'; // 下一阶段学习计划

export interface MockAnnouncement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  /** 预留：后端 sync 字段 */
  syncStatus?: 'LOCAL' | 'SYNCED';
}

export interface MockTask {
  id: string;
  title: string;
  type: 'LEARNING' | 'LECTURE';
  deadline: string;
  progress: number; // 0~1
  required: boolean;
  flowNode: FlowNode;
}

export interface LearnChannel {
  id: 'theory' | 'vr' | 'march' | 'crowdfund';
  title: string;
  subtitle: string;
  icon: string;
  progress: number;
  points: number;
  flowNode: FlowNode;
  route: string;
}

export interface AiPortrait {
  focusScore: number;
  weeklyFocus: number[];
  weakPoints: { name: string; rate: number }[];
  ideologyBrief: string;
  suggestions: string[];
}

export interface RecommendResource {
  id: string;
  title: string;
  reason: string;
  points: number;
  flowNode: FlowNode;
}

export interface GrowthReport {
  studyHours: number;
  quizPassRate: number;
  vrSessions: number;
  marchKm: number;
  summary: string;
}

export interface NextPlanItem {
  id: string;
  title: string;
  priority: '高' | '中' | '低';
}

/** 专题党课推送公告（流程图：接收任务） */
export const MOCK_ANNOUNCEMENTS: MockAnnouncement[] = [
  {
    id: 'ann-1',
    title: '专题党课推送：深入学习党的二十大精神',
    body: '本周支部必学专题已下发，请于周五前完成理论学习并参加测验。',
    publishedAt: '2026-07-26 09:00',
    syncStatus: 'LOCAL',
  },
  {
    id: 'ann-2',
    title: '通知：本月「重走长征路」闯关活动开启',
    body: '完成里程关卡可获得额外学习积分，欢迎全员参与。',
    publishedAt: '2026-07-25 16:20',
    syncStatus: 'LOCAL',
  },
];

/** 今日学习任务（流程图：接收学习任务） */
export const MOCK_TODAY_TASKS: MockTask[] = [
  {
    id: 'task-1',
    title: '支部必学：党章总纲精读',
    type: 'LEARNING',
    deadline: '2026-07-28 18:00',
    progress: 0.45,
    required: true,
    flowNode: 'receive_task',
  },
  {
    id: 'task-2',
    title: '专题党课：新时代党的建设总要求',
    type: 'LECTURE',
    deadline: '2026-07-30 20:00',
    progress: 0.2,
    required: true,
    flowNode: 'receive_task',
  },
  {
    id: 'task-3',
    title: '拓展：红色纪念馆云上研学预习',
    type: 'LEARNING',
    deadline: '2026-08-02 12:00',
    progress: 0,
    required: false,
    flowNode: 'receive_task',
  },
];

/** 多元自主学习四渠道（流程图：多元自主学习） */
export const MOCK_CHANNELS: LearnChannel[] = [
  {
    id: 'theory',
    title: '图文/视频理论学习',
    subtitle: '党史党章 · 政策解读',
    icon: '课',
    progress: 0.62,
    points: 20,
    flowNode: 'learn_theory',
    route: '/(member)/loop/theory',
  },
  {
    id: 'vr',
    title: 'VR 红色实景研学',
    subtitle: '纪念馆 · 革命旧址漫游',
    icon: 'VR',
    progress: 0.28,
    points: 30,
    flowNode: 'learn_vr',
    route: '/(member)/loop/vr',
  },
  {
    id: 'march',
    title: '重走长征路',
    subtitle: '运动地图 · 里程闯关',
    icon: '路',
    progress: 0.41,
    points: 25,
    flowNode: 'learn_march',
    route: '/(member)/loop/march',
  },
  {
    id: 'crowdfund',
    title: '党课众筹共创',
    subtitle: '微党课投稿 · 投票',
    icon: '创',
    progress: 0.15,
    points: 15,
    flowNode: 'learn_crowdfund',
    route: '/(member)/loop/crowdfund',
  },
];

/** AI 学习画像（流程图：AI 识别 / 画像） */
export const MOCK_AI_PORTRAIT: AiPortrait = {
  focusScore: 78,
  weeklyFocus: [62, 70, 68, 75, 80, 78, 82],
  weakPoints: [
    { name: '党章总纲', rate: 0.42 },
    { name: '纪律规矩', rate: 0.35 },
    { name: '组织生活制度', rate: 0.28 },
  ],
  ideologyBrief:
    '近期学习态度积极，对党史兴趣较高；纪律规矩类错题偏多，建议加强专项巩固。',
  suggestions: [
    '党章总纲章节放慢倍速重看，并完成随堂检测',
    '本周安排一次错题闯关，直至正确率 ≥ 85%',
    '结合支部主题党日，输出一篇心得提纲',
  ],
};

/** 薄弱点推荐（流程图：AI 推送薄弱资源） */
export const MOCK_RECOMMENDS: RecommendResource[] = [
  {
    id: 'rec-1',
    title: '专项：党章总纲要点精讲（图文）',
    reason: '测验错题集中在总纲条款理解',
    points: 15,
    flowNode: 'ai_weak',
  },
  {
    id: 'rec-2',
    title: '视频课：党员纪律处分条例解读',
    reason: '纪律规矩模块正确率低于支部均值',
    points: 20,
    flowNode: 'ai_weak',
  },
  {
    id: 'rec-3',
    title: '案例集：组织生活会常见问题',
    reason: '根据画像中「组织生活制度」薄弱项推送',
    points: 10,
    flowNode: 'ai_weak',
  },
];

export const MOCK_GROWTH_REPORT: GrowthReport = {
  studyHours: 12.6,
  quizPassRate: 0.72,
  vrSessions: 3,
  marchKm: 8.4,
  summary:
    '本阶段理论学习稳步推进，VR 研学参与积极；测验通过率有提升空间，建议完成错题闭环后再进入下一专题。',
};

export const MOCK_NEXT_PLAN: NextPlanItem[] = [
  { id: 'plan-1', title: '完成党章总纲薄弱专项（含测验）', priority: '高' },
  { id: 'plan-2', title: '参加一次 VR 纪念馆研学并提交心得', priority: '中' },
  { id: 'plan-3', title: '为支部微党课投一票 / 投稿一条', priority: '中' },
  { id: 'plan-4', title: '重走长征路完成第 3 关', priority: '低' },
];

/** 党课资料库模拟条目 */
export const MOCK_LIBRARY = [
  { id: 'lib-1', title: '中国共产党章程（全文）', tag: '党章' },
  { id: 'lib-2', title: '党的二十大报告学习问答', tag: '政策' },
  { id: 'lib-3', title: '支部工作条例要点摘编', tag: '制度' },
  { id: 'lib-4', title: '红色故事：长征中的纪律故事', tag: '党史' },
];
