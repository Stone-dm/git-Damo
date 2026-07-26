import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import {
  closeTask,
  createTask,
  deleteTask,
  dispatchTask,
  getBranchCompletion,
  getTaskProgress,
  listTasks,
} from '../api/tasks';
import { listBranches } from '../api/branches';
import { listLearning } from '../api/learning';
import { listExams } from '../api/exams';
import type {
  BranchCompletionView,
  BranchView,
  ExamView,
  LearningView,
  TaskProgressView,
  TaskStatus,
  TaskType,
  TaskView,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';

// ---- helpers ----

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  LEARNING: '学习任务',
  EXAM: '考试任务',
};

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '进行中',
  CLOSED: '已关闭',
};

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---- component ----

type TabKey = 'list' | 'create' | 'progress';

export function TasksPage() {
  const { user } = useAuth();
  const isSecretary = user?.role === 'SECRETARY';

  // ---- tab state ----
  const [tab, setTab] = useState<TabKey>('list');

  // ---- task list state ----
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // ---- create form state ----
  const [createType, setCreateType] = useState<TaskType>('LEARNING');
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createTargetType, setCreateTargetType] = useState<'ALL' | 'BRANCH'>(
    () => (user?.role === 'SECRETARY' ? 'BRANCH' : 'ALL'),
  );
  const [createTargetBranchIds, setCreateTargetBranchIds] = useState<number[]>(
    () =>
      user?.role === 'SECRETARY' && user.branchId != null ? [user.branchId] : [],
  );
  const [createReferenceId, setCreateReferenceId] = useState<number | null>(
    null,
  );
  const [createDueDate, setCreateDueDate] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState(false);

  // ---- ref data ----
  const [branches, setBranches] = useState<BranchView[]>([]);
  const [learnings, setLearnings] = useState<LearningView[]>([]);
  const [exams, setExams] = useState<ExamView[]>([]);

  // ---- progress state ----
  const [progressTaskId, setProgressTaskId] = useState<number | null>(null);
  const [progressList, setProgressList] = useState<TaskProgressView[]>([]);
  const [branchCompletion, setBranchCompletion] = useState<
    BranchCompletionView[]
  >([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // ---- action-in-progress flags ----
  const [actionTaskId, setActionTaskId] = useState<number | null>(null);

  // ---- load tasks ----
  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const data = await listTasks();
      setTasks(data);
    } catch (err) {
      setTasksError(errMsg(err));
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // ---- load reference data ----
  const loadRefData = useCallback(async () => {
    try {
      const [b, l, e] = await Promise.all([
        listBranches(),
        listLearning(),
        listExams(),
      ]);
      setBranches(b);
      setLearnings(l);
      setExams(e);
    } catch {
      // ref data loading failure is non-critical
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadRefData();
  }, [loadTasks, loadRefData]);

  // ---- load progress ----
  const loadProgress = useCallback(
    async (taskId: number) => {
      setProgressLoading(true);
      setProgressError(null);
      setProgressTaskId(taskId);
      try {
        const [p, bc] = await Promise.all([
          getTaskProgress(taskId),
          getBranchCompletion(taskId),
        ]);
        setProgressList(p);
        setBranchCompletion(bc);
      } catch (err) {
        setProgressError(errMsg(err));
        setProgressList([]);
        setBranchCompletion([]);
      } finally {
        setProgressLoading(false);
      }
    },
    [],
  );

  // ---- switch tab ----
  const switchTab = useCallback(
    (t: TabKey) => {
      setTab(t);
      if (t === 'list') {
        loadTasks();
      }
    },
    [loadTasks],
  );

  // ---- create task ----
  const handleCreate = async () => {
    if (!createTitle.trim()) {
      setCreateError('请输入任务标题');
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    setCreateOk(false);
    const targetType = isSecretary ? 'BRANCH' : createTargetType;
    const targetBranchIds = isSecretary
      ? user?.branchId != null
        ? [user.branchId]
        : []
      : createTargetType === 'BRANCH'
        ? createTargetBranchIds
        : undefined;

    try {
      await createTask({
        title: createTitle.trim(),
        description: createDesc.trim() || undefined,
        type: createType,
        targetType,
        targetBranchIds,
        referenceId: createReferenceId ?? undefined,
        dueDate: createDueDate || undefined,
      });
      setCreateOk(true);
      // reset form
      setCreateTitle('');
      setCreateDesc('');
      setCreateTargetType(isSecretary ? 'BRANCH' : 'ALL');
      setCreateTargetBranchIds(
        isSecretary && user?.branchId != null ? [user.branchId] : [],
      );
      setCreateReferenceId(null);
      setCreateDueDate('');
    } catch (err) {
      setCreateError(errMsg(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ---- dispatch / close / delete ----
  const handleDispatch = async (id: number) => {
    setActionTaskId(id);
    try {
      await dispatchTask(id);
      await loadTasks();
    } catch (err) {
      setTasksError(errMsg(err));
    } finally {
      setActionTaskId(null);
    }
  };

  const handleClose = async (id: number) => {
    setActionTaskId(id);
    try {
      await closeTask(id);
      await loadTasks();
    } catch (err) {
      setTasksError(errMsg(err));
    } finally {
      setActionTaskId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除该任务吗？')) return;
    setActionTaskId(id);
    try {
      await deleteTask(id);
      await loadTasks();
    } catch (err) {
      setTasksError(errMsg(err));
    } finally {
      setActionTaskId(null);
    }
  };

  // ---- target label helper ----
  const targetLabel = (t: TaskView) => {
    if (t.targetType === 'ALL') return '全平台';
    if (!t.targetBranchIds || t.targetBranchIds.length === 0) return '—';
    return t.targetBranchIds
      .map((id) => branches.find((b) => b.id === id)?.name ?? `#${id}`)
      .join('、');
  };

  // ---- toggle branch selection ----
  const toggleBranch = (id: number) => {
    setCreateTargetBranchIds((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id],
    );
  };

  // ---- progress bar helper ----
  const progressColor = (rate: number) => {
    if (rate >= 100) return '#067647';
    if (rate >= 50) return '#2563eb';
    return '#c2410c';
  };

  // ---- render ----
  return (
    <div className="page">
      <h2>任务中心</h2>
      <p className="muted">管理全平台学习与考试任务，派发任务并追踪各支部完成进度。</p>

      {/* tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn${tab === 'list' ? ' active' : ''}`}
          onClick={() => switchTab('list')}
        >
          任务列表
        </button>
        <button
          className={`tab-btn${tab === 'create' ? ' active' : ''}`}
          onClick={() => switchTab('create')}
        >
          创建任务
        </button>
        <button
          className={`tab-btn${tab === 'progress' ? ' active' : ''}`}
          onClick={() => switchTab('progress')}
        >
          进度追踪
        </button>
      </div>

      {/* ======== TAB: 任务列表 ======== */}
      {tab === 'list' && (
        <div className="panel">
          <div className="task-toolbar">
            <span className="muted">
              共 {tasks.length} 个任务
            </span>
            <button
              className="btn primary"
              onClick={() => switchTab('create')}
            >
              + 创建任务
            </button>
          </div>

          {tasksError && (
            <div className="form-error" style={{ marginTop: 10 }}>
              {tasksError}
            </div>
          )}

          {tasksLoading ? (
            <p className="muted" style={{ marginTop: 16 }}>
              加载中…
            </p>
          ) : tasks.length === 0 ? (
            <div className="task-empty">
              <p className="muted">暂无任务</p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                点击「创建任务」下发学习或考试任务
              </p>
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>标题</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>目标范围</th>
                    <th>截止日期</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>
                        <div className="task-title-cell">
                          <span className="task-title-text">{t.title}</span>
                          {t.description && (
                            <span className="task-desc-preview">
                              {t.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge task-type-${t.type.toLowerCase()}`}
                        >
                          {TASK_TYPE_LABEL[t.type]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge status-${t.status.toLowerCase()}`}
                        >
                          {TASK_STATUS_LABEL[t.status]}
                        </span>
                      </td>
                      <td>{targetLabel(t)}</td>
                      <td>{formatDate(t.dueDate)}</td>
                      <td>{formatDate(t.createdAt)}</td>
                      <td>
                        <div className="task-actions">
                          {t.status === 'DRAFT' && (
                            <button
                              className="btn primary"
                              style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                              disabled={actionTaskId === t.id}
                              onClick={() => handleDispatch(t.id)}
                            >
                              派发
                            </button>
                          )}
                          {t.status === 'ACTIVE' && (
                            <>
                              <button
                                className="btn ghost"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.82rem',
                                }}
                                disabled={actionTaskId === t.id}
                                onClick={() => handleClose(t.id)}
                              >
                                关闭
                              </button>
                              <button
                                className="btn ghost"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.82rem',
                                }}
                                onClick={() => {
                                  switchTab('progress');
                                  loadProgress(t.id);
                                }}
                              >
                                进度
                              </button>
                            </>
                          )}
                          {t.status === 'CLOSED' && (
                            <>
                              <button
                                className="btn ghost"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.82rem',
                                }}
                                onClick={() => {
                                  switchTab('progress');
                                  loadProgress(t.id);
                                }}
                              >
                                查看
                              </button>
                              <button
                                className="btn danger"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.82rem',
                                }}
                                disabled={actionTaskId === t.id}
                                onClick={() => handleDelete(t.id)}
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======== TAB: 创建任务 ======== */}
      {tab === 'create' && (
        <div className="panel">
          <h3>创建新任务</h3>

          {createError && (
            <div className="form-error" style={{ marginBottom: 14 }}>
              {createError}
            </div>
          )}
          {createOk && (
            <div
              className="file-info"
              style={{ marginBottom: 14, borderRadius: 8 }}
            >
              任务创建成功！
            </div>
          )}

          <div className="task-form">
            {/* 任务类型 */}
            <label>
              <span className="task-form-label">任务类型</span>
              <div className="task-type-toggle">
                <button
                  type="button"
                  className={`task-type-btn${createType === 'LEARNING' ? ' active' : ''}`}
                  onClick={() => {
                    setCreateType('LEARNING');
                    setCreateReferenceId(null);
                  }}
                >
                  📖 学习任务
                </button>
                <button
                  type="button"
                  className={`task-type-btn${createType === 'EXAM' ? ' active' : ''}`}
                  onClick={() => {
                    setCreateType('EXAM');
                    setCreateReferenceId(null);
                  }}
                >
                  📝 考试任务
                </button>
              </div>
            </label>

            {/* 关联内容 */}
            <label>
              <span className="task-form-label">
                关联{createType === 'LEARNING' ? '学习材料' : '考试'}
                <span className="hint" style={{ marginLeft: 6 }}>
                  （可选）
                </span>
              </span>
              <select
                value={createReferenceId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setCreateReferenceId(v ? Number(v) : null);
                }}
              >
                <option value="">不关联</option>
                {createType === 'LEARNING'
                  ? learnings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))
                  : exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
              </select>
            </label>

            {/* 标题 */}
            <label>
              <span className="task-form-label">任务标题</span>
              <input
                type="text"
                placeholder="请输入任务标题"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
              />
            </label>

            {/* 描述 */}
            <label>
              <span className="task-form-label">
                任务描述
                <span className="hint" style={{ marginLeft: 6 }}>
                  （可选）
                </span>
              </span>
              <textarea
                rows={3}
                placeholder="请输入任务描述或要求"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
              />
            </label>

            {/* 目标范围 */}
            <label>
              <span className="task-form-label">目标范围</span>
              {isSecretary ? (
                <p className="muted" style={{ margin: '8px 0 0' }}>
                  本支部
                </p>
              ) : (
                <div className="task-type-toggle">
                  <button
                    type="button"
                    className={`task-type-btn${createTargetType === 'ALL' ? ' active' : ''}`}
                    onClick={() => setCreateTargetType('ALL')}
                  >
                    🌐 全平台
                  </button>
                  <button
                    type="button"
                    className={`task-type-btn${createTargetType === 'BRANCH' ? ' active' : ''}`}
                    onClick={() => setCreateTargetType('BRANCH')}
                  >
                    📋 指定支部
                  </button>
                </div>
              )}
            </label>

            {/* 支部选择 */}
            {!isSecretary && createTargetType === 'BRANCH' && (
              <div className="branch-checkboxes">
                {branches.length === 0 ? (
                  <p className="muted">暂无支部数据</p>
                ) : (
                  branches.map((b) => (
                    <label key={b.id} className="branch-cb">
                      <input
                        type="checkbox"
                        checked={createTargetBranchIds.includes(b.id)}
                        onChange={() => toggleBranch(b.id)}
                      />
                      <span>{b.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* 截止日期 */}
            <label>
              <span className="task-form-label">
                截止日期
                <span className="hint" style={{ marginLeft: 6 }}>
                  （可选）
                </span>
              </span>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
              />
            </label>

            {/* submit */}
            <div className="form-actions" style={{ marginTop: 8 }}>
              <button
                className="btn primary"
                disabled={createSubmitting}
                onClick={handleCreate}
              >
                {createSubmitting ? '创建中…' : '创建任务'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== TAB: 进度追踪 ======== */}
      {tab === 'progress' && (
        <div className="panel">
          <h3>任务进度追踪</h3>

          {/* task selector */}
          <div className="task-progress-selector">
            <label>
              <span className="task-form-label">选择任务</span>
              <select
                value={progressTaskId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) loadProgress(Number(v));
                }}
              >
                <option value="">请选择任务</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{TASK_TYPE_LABEL[t.type]}] {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {progressError && (
            <div className="form-error" style={{ marginTop: 12 }}>
              {progressError}
            </div>
          )}

          {progressLoading && (
            <p className="muted" style={{ marginTop: 16 }}>
              加载中…
            </p>
          )}

          {/* branch completion summary */}
          {!progressLoading &&
            progressTaskId &&
            branchCompletion.length > 0 && (
              <>
                <h4 style={{ marginTop: 20, marginBottom: 12 }}>
                  各支部完成情况
                </h4>
                <div className="completion-cards">
                  {branchCompletion.map((bc) => (
                    <div key={bc.branchId} className="completion-card">
                      <div className="completion-card-header">
                        <span className="completion-branch-name">
                          {bc.branchName}
                        </span>
                        <span className="completion-count">
                          {bc.completedCount}/{bc.totalAssigned}
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${bc.completionRate}%`,
                            backgroundColor: progressColor(bc.completionRate),
                          }}
                        />
                      </div>
                      <div className="completion-rate-text">
                        {bc.completionRate.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* overall stats */}
                {(() => {
                  const totalAssigned = branchCompletion.reduce(
                    (sum, bc) => sum + bc.totalAssigned,
                    0,
                  );
                  const totalCompleted = branchCompletion.reduce(
                    (sum, bc) => sum + bc.completedCount,
                    0,
                  );
                  const overallRate =
                    totalAssigned > 0
                      ? (totalCompleted / totalAssigned) * 100
                      : 0;
                  return (
                    <div
                      className="completion-overall"
                      style={{ marginTop: 20 }}
                    >
                      <div className="completion-overall-header">
                        <span className="completion-branch-name">
                          全平台汇总
                        </span>
                        <span className="completion-count">
                          {totalCompleted}/{totalAssigned}
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${overallRate}%`,
                            backgroundColor: progressColor(overallRate),
                          }}
                        />
                      </div>
                      <div
                        className="completion-rate-text"
                        style={{ fontWeight: 700 }}
                      >
                        {overallRate.toFixed(1)}%
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

          {/* individual progress table */}
          {!progressLoading && progressTaskId && progressList.length > 0 && (
            <>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>
                个人完成明细
              </h4>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>所属支部</th>
                      <th>完成状态</th>
                      <th>完成时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressList.map((p) => (
                      <tr key={p.userId}>
                        <td>{p.userName}</td>
                        <td>{p.branchName || '—'}</td>
                        <td>
                          <span
                            className={`badge ${p.completed ? 'status-open' : 'status-pending'}`}
                          >
                            {p.completed ? '已完成' : '未完成'}
                          </span>
                        </td>
                        <td>{formatDate(p.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!progressLoading &&
            progressTaskId &&
            branchCompletion.length === 0 &&
            progressList.length === 0 && (
              <p className="muted" style={{ marginTop: 16 }}>
                暂无进度数据
              </p>
            )}
        </div>
      )}
    </div>
  );
}
