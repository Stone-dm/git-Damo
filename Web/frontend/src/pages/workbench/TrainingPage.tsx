import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import {
  listDevelopmentByUser,
  updateDevelopmentRecord,
  listDevelopmentRecords,
} from '../../api/development';
import { listMemberProfiles } from '../../api/member-profiles';
import {
  batchAssignPlan,
  createTrainingPlan,
  deleteTrainingPlan,
  listTrainingPlans,
  listTrainingRecordsByPlan,
  markTrainingComplete,
  publishTrainingPlan,
} from '../../api/training';
import { listBranches } from '../../api/branches';
import { createCultivationContact, deleteCultivationContact, listCultivationContacts } from '../../api/cultivation';
import { listUsers } from '../../api/users';
import type {
  BranchView,
  CultivationContactView,
  DevelopmentRecordView,
  DevelopmentStage,
  MemberProfileView,
  PlanStatus,
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

const STAGE_ORDER: DevelopmentStage[] = [
  'APPLICANT', 'ACTIVIST', 'DEVELOPMENT_TARGET', 'PROBATIONARY', 'FORMAL',
];

const STAGE_COLORS: Record<DevelopmentStage, string> = {
  APPLICANT: '#3b82f6',
  ACTIVIST: '#22c55e',
  DEVELOPMENT_TARGET: '#f59e0b',
  PROBATIONARY: '#8b5cf6',
  FORMAL: '#ef4444',
};

const PLAN_TYPE_LABEL: Record<string, string> = {
  THEORY: '理论学习',
  PRACTICE: '实践锻炼',
  EDUCATION: '党性教育',
};

type TabKey = 'dashboard' | 'stages' | 'plans';

function stageIndex(stage: string | null): number {
  const idx = STAGE_ORDER.indexOf(stage as DevelopmentStage);
  return idx >= 0 ? idx : -1;
}

export function TrainingPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SECRETARY';
  const [tab, setTab] = useState<TabKey>('dashboard');

  // ---- stages: member card grid ----
  const [members, setMembers] = useState<MemberProfileView[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [stageRecords, setStageRecords] = useState<DevelopmentRecordView[]>([]);

  // ---- detail modal ----
  const [selectedMember, setSelectedMember] = useState<MemberProfileView | null>(null);
  const [devRecords, setDevRecords] = useState<DevelopmentRecordView[]>([]);
  const [contacts, setContacts] = useState<CultivationContactView[]>([]);
  const [devLoading, setDevLoading] = useState(false);

  // ---- add contact form (in modal) ----
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactUserId, setNewContactUserId] = useState<number | ''>('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactDate, setNewContactDate] = useState('');
  const [contactSaving, setContactSaving] = useState(false);

  // ---- edit stage ----
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- plans state ----
  const [plans, setPlans] = useState<TrainingPlanView[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [planType, setPlanType] = useState('THEORY');
  const [planDesc, setPlanDesc] = useState('');
  const [planDeadline, setPlanDeadline] = useState('');
  const [planRelatedStage, setPlanRelatedStage] = useState('');
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planRecords, setPlanRecords] = useState<TrainingRecordView[]>([]);
  const [planRecordsLoading, setPlanRecordsLoading] = useState(false);
  const [completeUserId, setCompleteUserId] = useState<number | ''>('');
  const [memberUsers, setMemberUsers] = useState<UserView[]>([]);
  const [branches, setBranches] = useState<BranchView[]>([]);
  // plan search/filter
  const [planSearch, setPlanSearch] = useState('');
  const [planFilterType, setPlanFilterType] = useState('');
  const [planFilterStatus, setPlanFilterStatus] = useState('');

  // ---- load data ----
  const loadData = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const [profiles, records] = await Promise.all([
        listMemberProfiles(),
        listDevelopmentRecords(),
      ]);
      setMembers(profiles);
      setStageRecords(records);
    } catch (err) {
      setMembersError(errMsg(err));
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      setPlans(await listTrainingPlans());
    } catch (err) {
      setPlansError(errMsg(err));
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadPlanRecords = useCallback(async (planId: number) => {
    setSelectedPlanId(planId);
    setPlanRecordsLoading(true);
    try { setPlanRecords(await listTrainingRecordsByPlan(planId)); }
    catch { setPlanRecords([]); }
    finally { setPlanRecordsLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    loadPlans();
    listUsers().then(setMemberUsers).catch(() => {});
    listBranches().then(setBranches).catch(() => {});
  }, [loadData, loadPlans]);

  // ---- stage stats ----
  const stageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STAGE_ORDER) counts[s] = 0;
    for (const r of stageRecords) counts[r.stage] = (counts[r.stage] || 0) + 1;
    return STAGE_ORDER.map((s) => ({ stage: s, label: STAGE_LABEL[s], color: STAGE_COLORS[s], count: counts[s] }));
  }, [stageRecords]);

  // ---- detail modal ----
  const openDetail = async (m: MemberProfileView) => {
    setSelectedMember(m);
    setEditingRecordId(null);
    setDevLoading(true);
    setShowAddContact(false);
    try {
      const [records, cts] = await Promise.all([
        listDevelopmentByUser(m.userId),
        listCultivationContacts(m.userId),
      ]);
      setDevRecords(records);
      setContacts(cts);
    } catch { setDevRecords([]); setContacts([]); }
    finally { setDevLoading(false); }
  };

  const handleAddContact = async () => {
    if (!selectedMember || !newContactUserId || !newContactRole.trim()) return;
    setContactSaving(true);
    try {
      await createCultivationContact({
        mentorUserId: Number(newContactUserId),
        traineeUserId: selectedMember.userId,
        role: newContactRole.trim(),
        startDate: newContactDate || undefined,
      });
      setShowAddContact(false);
      setNewContactUserId('');
      setNewContactRole('');
      setNewContactDate('');
      setContacts(await listCultivationContacts(selectedMember.userId));
    } catch { /* ignore */ }
    finally { setContactSaving(false); }
  };

  const handleRemoveContact = async (id: number) => {
    if (!selectedMember || !window.confirm('确定移除该培养联系人？')) return;
    try {
      await deleteCultivationContact(id);
      setContacts(await listCultivationContacts(selectedMember.userId));
    } catch { /* ignore */ }
  };

  // ---- edit ----
  const cancelEdit = () => {
    setEditingRecordId(null);
    setEditError(null);
  };

  const startEdit = (r: DevelopmentRecordView) => {
    setEditingRecordId(r.id);
    setEditStartDate(r.startDate);
    setEditEndDate(r.endDate || '');
    setEditNotes(r.notes || '');
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingRecordId || !selectedMember) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateDevelopmentRecord(editingRecordId, {
        userId: selectedMember.userId,
        stage: STAGE_ORDER[0],
        startDate: editStartDate,
        endDate: editEndDate || undefined,
        notes: editNotes || undefined,
      });
      setEditingRecordId(null);
      setDevRecords(await listDevelopmentByUser(selectedMember.userId));
    } catch (err) {
      setEditError(errMsg(err));
    } finally {
      setEditSaving(false);
    }
  };

  const getLatestStage = (userId: number): DevelopmentStage | null => {
    const userRecords = stageRecords.filter((r) => r.userId === userId);
    if (userRecords.length === 0) return null;
    const sorted = [...userRecords].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
    return sorted[sorted.length - 1].stage;
  };

  const getCultivationDays = (userId: number): number => {
    const userRecords = stageRecords.filter((r) => r.userId === userId);
    if (userRecords.length === 0) return 0;
    const dates = userRecords.map((r) => new Date(r.startDate));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
    return Math.ceil((latest.getTime() - earliest.getTime()) / 86400000);
  };

  // ---- plans ----
  const handleCreatePlan = async () => {
    if (!planTitle.trim()) { setPlanError('请输入培养计划标题'); return; }
    setPlanSubmitting(true); setPlanError(null);
    try {
      await createTrainingPlan({
        title: planTitle.trim(),
        description: planDesc.trim() || undefined,
        planType,
        deadline: planDeadline || undefined,
        relatedStage: planRelatedStage || undefined,
      });
      setPlanTitle(''); setPlanDesc(''); setPlanDeadline(''); setPlanRelatedStage('');
      loadPlans();
    } catch (err) { setPlanError(errMsg(err)); }
    finally { setPlanSubmitting(false); }
  };

  const handlePublish = async (id: number, newStatus: PlanStatus) => {
    try { await publishTrainingPlan(id, newStatus); loadPlans(); } catch { /* ignore */ }
  };

  const handleBatchAssign = async (planId: number) => {
    if (branches.length === 0) return;
    const ids = branches.map((b) => b.id);
    try {
      const n = await batchAssignPlan(planId, ids);
      alert(`已分配 ${n} 名党员`);
      loadPlanRecords(planId);
    } catch { /* ignore */ }
  };

  const handleMarkComplete = async () => {
    if (!selectedPlanId || !completeUserId) return;
    try { await markTrainingComplete(selectedPlanId, Number(completeUserId)); setCompleteUserId(''); loadPlanRecords(selectedPlanId); }
    catch { /* ignore */ }
  };

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm('删除该培养计划将同时清除所有完成记录，确定？')) return;
    try { await deleteTrainingPlan(id); loadPlans(); } catch { /* ignore */ }
  };

  const membUsers = memberUsers.filter((u) => u.role === 'MEMBER');

  // filter plans
  const filteredPlans = plans.filter((p) => {
    if (planSearch && !p.title.toLowerCase().includes(planSearch.toLowerCase())) return false;
    if (planFilterType && p.planType !== planFilterType) return false;
    if (planFilterStatus && p.status !== planFilterStatus) return false;
    return true;
  });

  const isOverdue = (deadline: string | null): boolean => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="page">
      <h2>党员培养</h2>
      <p className="muted">跟踪入党发展阶段，管理培养教育计划与学习完成情况</p>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>培养看板</button>
        <button className={`tab-btn${tab === 'stages' ? ' active' : ''}`} onClick={() => setTab('stages')}>发展历程</button>
        <button className={`tab-btn${tab === 'plans' ? ' active' : ''}`} onClick={() => setTab('plans')}>培养教育</button>
      </div>

      {/* ======== TAB: 培养看板 ======== */}
      {tab === 'dashboard' && (
        <>
          {/* stat cards */}
          <div className="dashboard-stats">
            {STAGE_ORDER.map((s) => {
              const count = members.filter((m) => m.currentStage === s).length;
              return (
                <div key={s} className="dashboard-stat-card" style={{ borderTopColor: STAGE_COLORS[s] }}
                  onClick={() => { setTab('stages'); /* navigate to stages tab */ }}>
                  <div className="dashboard-stat-num" style={{ color: STAGE_COLORS[s] }}>{count}</div>
                  <div className="dashboard-stat-label">{STAGE_LABEL[s]}</div>
                </div>
              );
            })}
          </div>

          {/* secondary stats */}
          <div className="dashboard-stats-row">
            <div className="dashboard-info-card">
              <div className="dashboard-info-num">
                {stageRecords.filter((r) => {
                  const d = new Date(r.startDate);
                  const now = new Date();
                  return r.stage === 'APPLICANT' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <div className="dashboard-info-label">本月新入申请人</div>
            </div>
            <div className="dashboard-info-card">
              <div className="dashboard-info-num">
                {stageRecords.filter((r) => {
                  const d = new Date(r.startDate);
                  const now = new Date();
                  return r.stage === 'FORMAL' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <div className="dashboard-info-label">本月转正人数</div>
            </div>
            <div className="dashboard-info-card">
              <div className="dashboard-info-num" style={{ color: '#f59e0b' }}>
                {(() => {
                  const allPlanRecords = planRecords;
                  const total = allPlanRecords.length;
                  const done = allPlanRecords.filter((r) => r.completed).length;
                  return total > 0 ? `${Math.round((done / total) * 100)}%` : '—';
                })()}
              </div>
              <div className="dashboard-info-label">计划完成率</div>
            </div>
            <div className="dashboard-info-card">
              <div className="dashboard-info-num" style={{ color: 'var(--red)' }}>
                {(() => {
                  // warnings count: overdue plans + probationary members overdue
                  const now = new Date();
                  const sevenDays = new Date(now.getTime() + 7 * 86400000);
                  const planWarnings = plans.filter((p) => {
                    if (!p.deadline || p.status !== 'ACTIVE') return false;
                    const d = new Date(p.deadline);
                    return d <= sevenDays;
                  }).length;
                  const probationWarnings = members.filter((m) => {
                    if (m.memberStatus !== 'PROBATIONARY' || !m.formalDate) return false;
                    return new Date(m.formalDate) <= new Date();
                  }).length;
                  return planWarnings + probationWarnings;
                })()}
              </div>
              <div className="dashboard-info-label">预警数量</div>
            </div>
          </div>

          {/* warning alerts */}
          <div className="dashboard-alerts">
            {/* 预备党员即将到期未转正 */}
            {(() => {
              const now = new Date();
              const probationOverdue = members.filter((m) => {
                if (m.memberStatus !== 'PROBATIONARY' || !m.formalDate) return false;
                return new Date(m.formalDate) <= now;
              });
              if (probationOverdue.length === 0) return null;
              return (
                <div className="dashboard-alert danger">
                  <div className="dashboard-alert-title">⚠️ 预备党员超期未转正（{probationOverdue.length}人）</div>
                  <div className="dashboard-alert-list">
                    {probationOverdue.map((m) => (
                      <span key={m.userId} className="dashboard-alert-item" onClick={() => openDetail(m)}>
                        {m.userName}（{m.branchName}，转正日期：{m.formalDate}）
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 培养计划即将到期 */}
            {(() => {
              const now = new Date();
              const sevenDays = new Date(now.getTime() + 7 * 86400000);
              const urgentPlans = plans.filter((p) => {
                if (!p.deadline || p.status !== 'ACTIVE') return false;
                const d = new Date(p.deadline);
                return d <= sevenDays;
              });
              if (urgentPlans.length === 0) return null;
              return (
                <div className="dashboard-alert warning">
                  <div className="dashboard-alert-title">📋 培养计划即将到期（{urgentPlans.length}项）</div>
                  <div className="dashboard-alert-list">
                    {urgentPlans.map((p) => (
                      <span key={p.id} className="dashboard-alert-item" onClick={() => setTab('plans')}>
                        {p.title}（截止：{p.deadline}）
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 积极分子超期未发展 */}
            {(() => {
              const now = new Date();
              const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 86400000);
              const overdueActivists = members.filter((m) => {
                if (m.currentStage !== 'ACTIVIST') return false;
                const userRecords = stageRecords.filter((r) => r.userId === m.userId && r.stage === 'ACTIVIST');
                if (userRecords.length === 0) return false;
                const earliest = new Date(Math.min(...userRecords.map((r) => new Date(r.startDate).getTime())));
                return earliest <= twoYearsAgo;
              });
              if (overdueActivists.length === 0) return null;
              return (
                <div className="dashboard-alert warning">
                  <div className="dashboard-alert-title">⏳ 积极分子超期未发展（{overdueActivists.length}人，培养超2年）</div>
                  <div className="dashboard-alert-list">
                    {overdueActivists.map((m) => (
                      <span key={m.userId} className="dashboard-alert-item" onClick={() => openDetail(m)}>
                        {m.userName}（{m.branchName}）
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {members.length > 0 && plans.length > 0 &&
              !members.some((m) => m.memberStatus === 'PROBATIONARY' && m.formalDate && new Date(m.formalDate!) <= new Date()) &&
              !plans.some((p) => p.deadline && p.status === 'ACTIVE' && new Date(p.deadline) <= new Date(Date.now() + 7 * 86400000)) &&
              !members.some((m) => {
                if (m.currentStage !== 'ACTIVIST') return false;
                const records = stageRecords.filter((r) => r.userId === m.userId && r.stage === 'ACTIVIST');
                if (records.length === 0) return false;
                return new Date(Math.min(...records.map((r) => new Date(r.startDate).getTime()))) <= new Date(Date.now() - 2 * 365 * 86400000);
              }) && (
                <div className="dashboard-alert success">
                  <div className="dashboard-alert-title">✅ 暂无预警事项</div>
                </div>
              )}
          </div>
        </>
      )}

      {/* ======== TAB: 发展历程总览 ======== */}
      {tab === 'stages' && (
        <>
          {/* stage stat cards */}
          <div className="dev-stat-cards">
            {stageStats.map((s) => (
              <div key={s.stage} className="dev-stat-card" style={{ borderTopColor: s.color }}>
                <div className="dev-stat-count" style={{ color: s.color }}>{s.count}</div>
                <div className="dev-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {membersError && <div className="form-error" style={{ marginTop: 12 }}>{membersError}</div>}

          {membersLoading ? (
            <div className="panel" style={{ marginTop: 16 }}><p className="muted">加载中…</p></div>
          ) : members.length === 0 ? (
            <div className="panel" style={{ marginTop: 16 }}><p className="muted">暂无党员档案数据</p></div>
          ) : (
            <div className="dev-member-grid">
              {members.map((m) => {
                const latest = (m.currentStage as DevelopmentStage) || null;
                const idx = stageIndex(latest);
                const days = getCultivationDays(m.userId);
                const initial = m.userName?.charAt(0) || '?';
                return (
                  <div key={m.userId} className="dev-member-card" onClick={() => openDetail(m)}>
                    <div className="dev-member-avatar" style={{ background: latest ? STAGE_COLORS[latest] : '#b0b8c1' }}>{initial}</div>
                    <div className="dev-member-info">
                      <div className="dev-member-name">{m.userName}</div>
                      <div className="dev-member-branch">{m.branchName || '—'}</div>
                      <span className="badge" style={{ fontSize: '0.72rem', marginTop: 2, background: latest ? STAGE_COLORS[latest] + '20' : undefined, color: latest ? STAGE_COLORS[latest] : undefined }}>
                        {latest ? STAGE_LABEL[latest] : '未开始'}
                      </span>
                      <div className="dev-member-days">在培养 {days} 天</div>
                    </div>
                    <div className="dev-progress-bar">
                      {STAGE_ORDER.map((s, i) => {
                        let cls = 'dev-progress-dot';
                        if (i < idx) cls += ' done';
                        else if (i === idx) cls += ' current';
                        return (
                          <div key={s} className="dev-progress-seg">
                            <div className={cls} style={{ borderColor: i <= idx && idx >= 0 ? STAGE_COLORS[s] : '#d7dde5' }} />
                            {i < 4 && <div className={`dev-progress-line ${i < idx ? 'done' : ''}`} style={{ background: i < idx ? STAGE_COLORS[STAGE_ORDER[i + 1]] : '#d7dde5' }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======== development detail modal ======== */}
          {devLoading && (
            <div className="modal-overlay" onClick={() => setDevLoading(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}><p className="muted" style={{ padding: 40, textAlign: 'center' }}>加载中…</p></div>
            </div>
          )}

          {selectedMember && !devLoading && (
            <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
              <div className="modal-card dev-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{selectedMember.userName} — 发展历程</h3>
                  <button className="modal-close" onClick={() => setSelectedMember(null)}>✕</button>
                </div>
                <div className="dev-detail-body">
                  <div className="dev-timeline">
                    {STAGE_ORDER.map((s) => {
                      const record = devRecords.find((r) => r.stage === s);
                      const idx = STAGE_ORDER.indexOf(s);
                      const latestIdx = stageIndex(getLatestStage(selectedMember.userId));
                      const isPast = idx <= latestIdx;
                      const isCurrent = idx === latestIdx;
                      const isEditing = record && editingRecordId === record.id;
                      return (
                        <div key={s} className={`dev-timeline-node ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}>
                          <div className="dev-timeline-dot" style={{ background: isPast ? STAGE_COLORS[s] : '#d7dde5', borderColor: isCurrent ? STAGE_COLORS[s] : 'transparent' }} />
                          <div className="dev-timeline-content">
                            <div className="dev-timeline-stage">
                              <span className="dev-timeline-dot-icon" style={{ color: STAGE_COLORS[s] }}>●</span>
                              {STAGE_LABEL[s]}
                            </div>
                            {record ? (
                              isEditing ? (
                                <div className="dev-edit-form">
                                  {editError && <div className="form-error" style={{ marginBottom: 6 }}>{editError}</div>}
                                  <label>开始日期 <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} /></label>
                                  <label>结束日期 <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} /></label>
                                  <label>备注 <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} /></label>
                                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                    <button className="btn primary" style={{ padding: '3px 10px', fontSize: '0.78rem' }} onClick={saveEdit} disabled={editSaving}>{editSaving ? '保存…' : '保存'}</button>
                                    <button className="btn ghost" style={{ padding: '3px 10px', fontSize: '0.78rem' }} onClick={cancelEdit}>取消</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="dev-timeline-dates">{record.startDate}{record.endDate ? ` → ${record.endDate}` : ' 至今'}</div>
                                  {record.notes && <div className="dev-timeline-notes">{record.notes}</div>}
                                  <button className="btn ghost" style={{ padding: '2px 6px', fontSize: '0.72rem', marginTop: 2 }} onClick={() => startEdit(record)}>编辑</button>
                                </>
                              )
                            ) : (
                              <div className="dev-timeline-empty">{isPast ? '—' : '未到达'}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="dev-summary">
                    <div className="dev-summary-avatar" style={{ background: selectedMember.currentStage ? STAGE_COLORS[selectedMember.currentStage as DevelopmentStage] || '#b0b8c1' : '#b0b8c1' }}>
                      {selectedMember.userName?.charAt(0) || '?'}
                    </div>
                    <div className="dev-summary-name">{selectedMember.userName}</div>
                    <div className="dev-summary-branch">{selectedMember.branchName || '—'}</div>
                    {/* 培养联系人 */}
                    <div className="dev-contacts">
                      <div className="dev-contacts-title">培养联系人</div>
                      {contacts.length === 0 ? (
                        <div className="muted" style={{ fontSize: '0.75rem' }}>暂无</div>
                      ) : (
                        contacts.map((c) => (
                          <div key={c.id} className="dev-contact-item">
                            <div className="dev-contact-name">{c.mentorName}</div>
                            {c.role && <div className="dev-contact-role">{c.role}</div>}
                            {c.mentorPhone && <div className="dev-contact-phone">{c.mentorPhone}</div>}
                            {c.startDate && <div className="muted" style={{ fontSize: '0.68rem' }}>{c.startDate}{c.endDate ? ` → ${c.endDate}` : ' 起'}</div>}
                            {canManage && (
                              <button className="btn ghost" style={{ padding: '1px 4px', fontSize: '0.65rem', color: 'var(--red)', marginTop: 1 }}
                                onClick={() => handleRemoveContact(c.id)}>移除</button>
                            )}
                          </div>
                        ))
                      )}
                      {/* add contact form */}
                      {canManage && (
                        showAddContact ? (
                          <div className="dev-add-contact-form">
                            <select value={newContactUserId} onChange={(e) => setNewContactUserId(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%', fontSize: '0.75rem' }}>
                              <option value="">选择联系人</option>
                              {memberUsers.filter((u) => u.id !== selectedMember.userId).map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                            </select>
                            <input type="text" placeholder="角色（如：第一介绍人）" value={newContactRole} onChange={(e) => setNewContactRole(e.target.value)} style={{ width: '100%', fontSize: '0.75rem' }} />
                            <input type="date" value={newContactDate} onChange={(e) => setNewContactDate(e.target.value)} style={{ width: '100%', fontSize: '0.75rem' }} />
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={handleAddContact} disabled={contactSaving}>添加</button>
                              <button className="btn ghost" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setShowAddContact(false)}>取消</button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn ghost" style={{ padding: '2px 6px', fontSize: '0.7rem', marginTop: 4 }} onClick={() => setShowAddContact(true)}>+ 添加联系人</button>
                        )
                      )}
                    </div>
                    <div className="dev-summary-items">
                      <div className="dev-summary-item"><span className="detail-label">入党时间</span><span className="detail-value">{selectedMember.joinDate || '—'}</span></div>
                      <div className="dev-summary-item"><span className="detail-label">转正时间</span><span className="detail-value">{selectedMember.formalDate || '—'}</span></div>
                      <div className="dev-summary-item"><span className="detail-label">当前阶段</span><span className="detail-value">{selectedMember.currentStage ? STAGE_LABEL[selectedMember.currentStage as DevelopmentStage] : '—'}</span></div>
                      <div className="dev-summary-item"><span className="detail-label">在培养天数</span><span className="detail-value">{getCultivationDays(selectedMember.userId)} 天</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======== TAB: 培养教育 ======== */}
      {tab === 'plans' && (
        <>
          {/* create plan form */}
          <div className="panel">
            <h3>创建培养计划</h3>
            {planError && <div className="form-error" style={{ marginBottom: 12 }}>{planError}</div>}
            <div className="form-grid">
              <label>计划标题 <input type="text" placeholder="如：2026年春季理论学习计划" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} /></label>
              <label>计划类型 <select value={planType} onChange={(e) => setPlanType(e.target.value)}>{Object.entries(PLAN_TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></label>
              <label>截止日期 <input type="date" value={planDeadline} onChange={(e) => setPlanDeadline(e.target.value)} /></label>
              <label>关联阶段 <select value={planRelatedStage} onChange={(e) => setPlanRelatedStage(e.target.value)}><option value="">不限</option>{STAGE_ORDER.map((s) => (<option key={s} value={s}>{STAGE_LABEL[s]}</option>))}</select></label>
              <label className="span-2">计划描述（可选）<textarea rows={2} placeholder="描述培养计划的具体内容和要求" value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} /></label>
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={planSubmitting} onClick={handleCreatePlan}>{planSubmitting ? '创建中…' : '创建计划'}</button>
            </div>
          </div>

          {/* plan list */}
          <div className="panel" style={{ marginTop: 16 }}>
            <h3>培养计划列表</h3>

            {/* search bar */}
            <div className="filter-bar" style={{ marginTop: 0, marginBottom: 12 }}>
              <div className="filter-bar-row">
                <input type="text" className="filter-input" placeholder="搜索计划标题…" value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} style={{ minWidth: 180 }} />
                <select className="filter-select" value={planFilterType} onChange={(e) => setPlanFilterType(e.target.value)}><option value="">全部类型</option>{Object.entries(PLAN_TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select>
                <select className="filter-select" value={planFilterStatus} onChange={(e) => setPlanFilterStatus(e.target.value)}><option value="">全部状态</option><option value="DRAFT">草稿</option><option value="ACTIVE">已发布</option></select>
                {(planSearch || planFilterType || planFilterStatus) && <button className="btn ghost" onClick={() => { setPlanSearch(''); setPlanFilterType(''); setPlanFilterStatus(''); }}>清除</button>}
              </div>
            </div>

            {plansError && <div className="form-error" style={{ marginTop: 12 }}>{plansError}</div>}
            {plansLoading ? <p className="muted" style={{ marginTop: 16 }}>加载中…</p>
              : filteredPlans.length === 0 ? <p className="muted" style={{ marginTop: 16 }}>{plans.length === 0 ? '暂无培养计划' : '无匹配计划'}</p>
                : <div className="training-plans-list">
                  {filteredPlans.map((p) => {
                    const completedCount = selectedPlanId === p.id ? planRecords.filter((r) => r.completed).length : 0;
                    const totalCount = selectedPlanId === p.id ? planRecords.length : 0;
                    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    const pctColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    const overdue = isOverdue(p.deadline) && (totalCount === 0 || completedCount < totalCount);
                    return (
                      <div key={p.id} className="training-plan-card">
                        <div className="training-plan-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className="training-plan-title">{p.title}</span>
                            <span className={`badge ${p.planType === 'THEORY' ? 'task-type-learning' : p.planType === 'PRACTICE' ? 'status-pending' : 'status-draft'}`}>{PLAN_TYPE_LABEL[p.planType] || p.planType}</span>
                            <span className={`badge ${p.status === 'ACTIVE' ? 'status-open' : 'status-draft'}`}>{p.status === 'ACTIVE' ? '已发布' : '草稿'}</span>
                            {p.relatedStage && <span className="badge" style={{ fontSize: '0.7rem' }}>{STAGE_LABEL[p.relatedStage as DevelopmentStage] || p.relatedStage}</span>}
                            {overdue && <span title="已过期" style={{ color: 'var(--red)', fontSize: '1rem' }}>⚠️</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="btn ghost" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handlePublish(p.id, p.status === 'DRAFT' ? 'ACTIVE' : 'DRAFT')}>
                              {p.status === 'DRAFT' ? '发布' : '取消发布'}
                            </button>
                            <button className="btn danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleDeletePlan(p.id)}>删除</button>
                          </div>
                        </div>
                        {p.description && <p className="training-plan-desc">{p.description}</p>}
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--muted)', marginBottom: selectedPlanId === p.id ? 8 : 0 }}>
                          {p.deadline && <span>截止：{p.deadline}</span>}
                          {selectedPlanId === p.id && totalCount > 0 && (
                            <span>{completedCount}/{totalCount} 人已完成</span>
                          )}
                        </div>
                        {/* progress bar */}
                        {selectedPlanId === p.id && totalCount > 0 && (
                          <div className="plan-progress-wrap">
                            <div className="plan-progress-bar">
                              <div className="plan-progress-fill" style={{ width: `${pct}%`, background: pctColor }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: pctColor }}>{pct}%</span>
                          </div>
                        )}
                        {selectedPlanId === p.id ? (
                          <div className="training-records">
                            <div className="training-complete-row">
                              <label>标记学员完成：<select value={completeUserId} onChange={(e) => setCompleteUserId(e.target.value ? Number(e.target.value) : '')} style={{ marginLeft: 8, marginRight: 8 }}><option value="">选择学员</option>{membUsers.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}</select></label>
                              <button className="btn primary" style={{ padding: '4px 12px', fontSize: '0.82rem' }} disabled={!completeUserId} onClick={handleMarkComplete}>标记完成</button>
                              <button className="btn ghost" style={{ padding: '4px 12px', fontSize: '0.82rem' }} onClick={() => handleBatchAssign(p.id)}>批量分配</button>
                            </div>
                            {planRecordsLoading ? <p className="muted">加载中…</p> : planRecords.length === 0 ? <p className="muted">暂无学员记录，请先「批量分配」</p> : (
                              <>
                                {/* completed */}
                                <div className="plan-records-section">
                                  <div className="plan-records-title">已完成 ({planRecords.filter((r) => r.completed).length})</div>
                                  {planRecords.filter((r) => r.completed).map((r) => (
                                    <div key={r.id} className="plan-record-row done"><span>{r.userName}</span><span className="muted" style={{ fontSize: '0.75rem' }}>{r.branchName}</span><span className="muted" style={{ fontSize: '0.75rem' }}>{r.completedAt}</span></div>
                                  ))}
                                </div>
                                {/* not completed */}
                                <div className="plan-records-section">
                                  <div className="plan-records-title" style={{ color: '#ef4444' }}>未完成 ({planRecords.filter((r) => !r.completed).length})</div>
                                  {planRecords.filter((r) => !r.completed).map((r) => (
                                    <div key={r.id} className="plan-record-row pending"><span>{r.userName}</span><span className="muted" style={{ fontSize: '0.75rem' }}>{r.branchName}</span><button className="btn ghost" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => {/* 占位：批量提醒 */}}>提醒</button></div>
                                  ))}
                                </div>
                              </>
                            )}
                            <button className="btn ghost" style={{ marginTop: 8, padding: '4px 10px', fontSize: '0.82rem' }} onClick={() => setSelectedPlanId(null)}>收起</button>
                          </div>
                        ) : (
                          <button className="btn ghost" style={{ marginTop: 8, padding: '4px 10px', fontSize: '0.82rem' }} onClick={() => loadPlanRecords(p.id)}>查看详情</button>
                        )}
                      </div>
                    );
                  })}
                </div>}
          </div>
        </>
      )}
    </div>
  );
}
