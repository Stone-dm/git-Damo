import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { listUsers } from '../../api/users';
import {
  createDevelopmentRecord,
  listDevelopmentRecords,
} from '../../api/development';
import {
  createTrainingPlan,
  deleteTrainingPlan,
  listTrainingPlans,
  listTrainingRecordsByPlan,
  markTrainingComplete,
} from '../../api/training';
import type {
  DevelopmentRecordView,
  DevelopmentStage,
  TrainingPlanView,
  TrainingRecordView,
  UserView,
} from '../../api/types';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const STAGE_LABEL: Record<DevelopmentStage, string> = {
  APPLICANT: '入党申请人',
  ACTIVIST: '入党积极分子',
  DEVELOPMENT_TARGET: '发展对象',
  PROBATIONARY: '预备党员',
  FORMAL: '正式党员',
};

const PLAN_TYPE_LABEL: Record<string, string> = {
  THEORY: '理论学习',
  PRACTICE: '实践锻炼',
  EDUCATION: '党性教育',
};

type TabKey = 'stages' | 'plans';

export function TrainingPage() {
  const [tab, setTab] = useState<TabKey>('stages');

  // ---- stages state ----
  const [stageFilter, setStageFilter] = useState<DevelopmentStage | ''>('');
  const [stageRecords, setStageRecords] = useState<DevelopmentRecordView[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState<string | null>(null);

  // ---- create stage form ----
  const [users, setUsers] = useState<UserView[]>([]);
  const [newStageUserId, setNewStageUserId] = useState<number | ''>('');
  const [newStage, setNewStage] = useState<DevelopmentStage>('APPLICANT');
  const [newStageDate, setNewStageDate] = useState('');
  const [newStageNotes, setNewStageNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState(false);

  // ---- plans state ----
  const [plans, setPlans] = useState<TrainingPlanView[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // ---- create plan form ----
  const [planTitle, setPlanTitle] = useState('');
  const [planType, setPlanType] = useState('THEORY');
  const [planDesc, setPlanDesc] = useState('');
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // ---- plan records ----
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planRecords, setPlanRecords] = useState<TrainingRecordView[]>([]);
  const [planRecordsLoading, setPlanRecordsLoading] = useState(false);
  const [completeUserId, setCompleteUserId] = useState<number | ''>('');

  // ---- load stages ----
  const loadStages = useCallback(async (stage?: DevelopmentStage | '') => {
    setStagesLoading(true);
    setStagesError(null);
    try {
      const data = await listDevelopmentRecords(
        stage ? { stage: stage as DevelopmentStage } : undefined,
      );
      setStageRecords(data);
    } catch (err) {
      setStagesError(errMsg(err));
    } finally {
      setStagesLoading(false);
    }
  }, []);

  // ---- load plans ----
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const data = await listTrainingPlans();
      setPlans(data);
    } catch (err) {
      setPlansError(errMsg(err));
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // ---- load plan records ----
  const loadPlanRecords = useCallback(async (planId: number) => {
    setSelectedPlanId(planId);
    setPlanRecordsLoading(true);
    try {
      const data = await listTrainingRecordsByPlan(planId);
      setPlanRecords(data);
    } catch {
      setPlanRecords([]);
    } finally {
      setPlanRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStages(stageFilter);
    loadPlans();
    listUsers()
      .then(setUsers)
      .catch(() => {});
  }, [loadStages, loadPlans, stageFilter]);

  // ---- create stage record ----
  const handleCreateStage = async () => {
    if (!newStageUserId || !newStageDate) {
      setCreateError('请选择党员和日期');
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    setCreateOk(false);
    try {
      await createDevelopmentRecord({
        userId: Number(newStageUserId),
        stage: newStage,
        startDate: newStageDate,
        notes: newStageNotes || undefined,
      });
      setCreateOk(true);
      setNewStageUserId('');
      setNewStageDate('');
      setNewStageNotes('');
      loadStages(stageFilter);
    } catch (err) {
      setCreateError(errMsg(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ---- create plan ----
  const handleCreatePlan = async () => {
    if (!planTitle.trim()) {
      setPlanError('请输入培养计划标题');
      return;
    }
    setPlanSubmitting(true);
    setPlanError(null);
    try {
      await createTrainingPlan({
        title: planTitle.trim(),
        description: planDesc.trim() || undefined,
        planType,
      });
      setPlanTitle('');
      setPlanDesc('');
      loadPlans();
    } catch (err) {
      setPlanError(errMsg(err));
    } finally {
      setPlanSubmitting(false);
    }
  };

  // ---- mark complete ----
  const handleMarkComplete = async () => {
    if (!selectedPlanId || !completeUserId) return;
    try {
      await markTrainingComplete(selectedPlanId, Number(completeUserId));
      setCompleteUserId('');
      loadPlanRecords(selectedPlanId);
    } catch {
      // ignore
    }
  };

  // ---- delete plan ----
  const handleDeletePlan = async (id: number) => {
    if (!window.confirm('删除该培养计划将同时清除所有完成记录，确定？')) return;
    try {
      await deleteTrainingPlan(id);
      loadPlans();
    } catch {
      // ignore
    }
  };

  // ---- filter by stage ----
  const memberUsers = users.filter((u) => u.role === 'MEMBER');

  return (
    <div className="page">
      <h2>党员培养</h2>
      <p className="muted">跟踪入党发展阶段，管理培养教育计划与学习完成情况</p>

      {/* tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn${tab === 'stages' ? ' active' : ''}`}
          onClick={() => setTab('stages')}
        >
          入党阶段
        </button>
        <button
          className={`tab-btn${tab === 'plans' ? ' active' : ''}`}
          onClick={() => setTab('plans')}
        >
          培养教育
        </button>
      </div>

      {/* ======== TAB: 入党阶段 ======== */}
      {tab === 'stages' && (
        <>
          {/* create form */}
          <div className="panel">
            <h3>添加阶段记录</h3>
            {createError && (
              <div className="form-error" style={{ marginBottom: 12 }}>
                {createError}
              </div>
            )}
            {createOk && (
              <div className="file-info" style={{ marginBottom: 12 }}>
                记录添加成功
              </div>
            )}
            <div className="form-grid">
              <label>
                选择党员
                <select
                  value={newStageUserId}
                  onChange={(e) =>
                    setNewStageUserId(
                      e.target.value ? Number(e.target.value) : '',
                    )
                  }
                >
                  <option value="">请选择</option>
                  {memberUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                入党阶段
                <select
                  value={newStage}
                  onChange={(e) =>
                    setNewStage(e.target.value as DevelopmentStage)
                  }
                >
                  {(
                    Object.entries(STAGE_LABEL) as [
                      DevelopmentStage,
                      string,
                    ][]
                  ).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                开始日期
                <input
                  type="date"
                  value={newStageDate}
                  onChange={(e) => setNewStageDate(e.target.value)}
                />
              </label>
              <label className="span-2">
                备注
                <input
                  type="text"
                  placeholder="可选备注"
                  value={newStageNotes}
                  onChange={(e) => setNewStageNotes(e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button
                className="btn primary"
                disabled={createSubmitting}
                onClick={handleCreateStage}
              >
                {createSubmitting ? '提交中…' : '添加记录'}
              </button>
            </div>
          </div>

          {/* stage list */}
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="archive-toolbar">
              <label>
                <span className="archive-filter-label">按阶段筛选：</span>
                <select
                  value={stageFilter}
                  onChange={(e) => {
                    const v = e.target.value as DevelopmentStage | '';
                    setStageFilter(v);
                  }}
                >
                  <option value="">全部阶段</option>
                  {(
                    Object.entries(STAGE_LABEL) as [
                      DevelopmentStage,
                      string,
                    ][]
                  ).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {stagesError && (
              <div className="form-error" style={{ marginTop: 12 }}>
                {stagesError}
              </div>
            )}

            {stagesLoading ? (
              <p className="muted" style={{ marginTop: 16 }}>
                加载中…
              </p>
            ) : stageRecords.length === 0 ? (
              <p className="muted" style={{ marginTop: 16 }}>
                暂无阶段记录
              </p>
            ) : (
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>当前阶段</th>
                      <th>开始日期</th>
                      <th>结束日期</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="archive-name-cell">{r.userName}</td>
                        <td>
                          <span className="badge status-draft">
                            {STAGE_LABEL[r.stage]}
                          </span>
                        </td>
                        <td>{r.startDate}</td>
                        <td>{r.endDate || '—'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ======== TAB: 培养教育 ======== */}
      {tab === 'plans' && (
        <>
          {/* create plan */}
          <div className="panel">
            <h3>创建培养计划</h3>
            {planError && (
              <div className="form-error" style={{ marginBottom: 12 }}>
                {planError}
              </div>
            )}
            <div className="form-grid">
              <label>
                计划标题
                <input
                  type="text"
                  placeholder="如：2026年春季理论学习计划"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                />
              </label>
              <label>
                计划类型
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                >
                  {Object.entries(PLAN_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                计划描述（可选）
                <textarea
                  rows={2}
                  placeholder="描述培养计划的具体内容和要求"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button
                className="btn primary"
                disabled={planSubmitting}
                onClick={handleCreatePlan}
              >
                {planSubmitting ? '创建中…' : '创建计划'}
              </button>
            </div>
          </div>

          {/* plans list */}
          <div className="panel" style={{ marginTop: 16 }}>
            <h3>培养计划列表</h3>
            {plansError && (
              <div className="form-error" style={{ marginTop: 12 }}>
                {plansError}
              </div>
            )}
            {plansLoading ? (
              <p className="muted" style={{ marginTop: 16 }}>
                加载中…
              </p>
            ) : plans.length === 0 ? (
              <p className="muted" style={{ marginTop: 16 }}>
                暂无培养计划
              </p>
            ) : (
              <div className="training-plans-list">
                {plans.map((p) => (
                  <div key={p.id} className="training-plan-card">
                    <div className="training-plan-header">
                      <div>
                        <span className="training-plan-title">{p.title}</span>
                        <span
                          className={`badge ${
                            p.planType === 'THEORY'
                              ? 'task-type-learning'
                              : p.planType === 'PRACTICE'
                                ? 'status-pending'
                                : 'status-draft'
                          }`}
                          style={{ marginLeft: 10 }}
                        >
                          {PLAN_TYPE_LABEL[p.planType] || p.planType}
                        </span>
                      </div>
                      <button
                        className="btn danger"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleDeletePlan(p.id)}
                      >
                        删除
                      </button>
                    </div>
                    {p.description && (
                      <p className="training-plan-desc">{p.description}</p>
                    )}

                    {/* expand records */}
                    {selectedPlanId === p.id ? (
                      <div className="training-records">
                        <div className="training-complete-row">
                          <label>
                            标记学员完成：
                            <select
                              value={completeUserId}
                              onChange={(e) =>
                                setCompleteUserId(
                                  e.target.value ? Number(e.target.value) : '',
                                )
                              }
                              style={{ marginLeft: 8, marginRight: 8 }}
                            >
                              <option value="">选择学员</option>
                              {memberUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="btn primary"
                            style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                            disabled={!completeUserId}
                            onClick={handleMarkComplete}
                          >
                            标记完成
                          </button>
                        </div>

                        {planRecordsLoading ? (
                          <p className="muted">加载中…</p>
                        ) : planRecords.length === 0 ? (
                          <p className="muted">暂无完成记录</p>
                        ) : (
                          <div className="table-wrap">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>学员</th>
                                  <th>状态</th>
                                  <th>完成时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {planRecords.map((r) => (
                                  <tr key={r.id}>
                                    <td>{r.userName}</td>
                                    <td>
                                      <span className="badge status-open">
                                        已完成
                                      </span>
                                    </td>
                                    <td>{r.completedAt || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <button
                          className="btn ghost"
                          style={{
                            marginTop: 8,
                            padding: '4px 10px',
                            fontSize: '0.82rem',
                          }}
                          onClick={() => setSelectedPlanId(null)}
                        >
                          收起
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn ghost"
                        style={{
                          marginTop: 8,
                          padding: '4px 10px',
                          fontSize: '0.82rem',
                        }}
                        onClick={() => loadPlanRecords(p.id)}
                      >
                        查看完成情况
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
