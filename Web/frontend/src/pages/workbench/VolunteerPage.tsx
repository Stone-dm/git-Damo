import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import {
  createActivity,
  updateActivity,
  deleteActivity,
  publishActivity,
  finishActivity,
  listActivities,
  signup,
  cancelSignup,
  listSignups,
  attend,
  getVolunteerStats,
} from '../../api/volunteer';
import type {
  ActivityStatus,
  SignupStatus,
  VolunteerActivityView,
  VolunteerSignupView,
  VolunteerStats,
} from '../../api/types';
import { useAuth } from '../../auth/AuthContext';

// ---- helpers ----

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const STATUS_LABEL: Record<ActivityStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ONGOING: '进行中',
  FINISHED: '已结束',
  CANCELLED: '已取消',
};

const SIGNUP_STATUS_LABEL: Record<SignupStatus, string> = {
  SIGNED_UP: '已报名',
  PARTICIPATED: '已参与',
  ABSENT: '缺席',
};

function formatDateTime(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function isExpiredUnfinished(a: VolunteerActivityView): boolean {
  if (a.status === 'FINISHED' || a.status === 'CANCELLED') return false;
  return new Date(a.endTime) < new Date();
}

const statusBadgeClass = (s: ActivityStatus): string => {
  switch (s) {
    case 'PUBLISHED': return 'badge status-open';
    case 'ONGOING': return 'badge task-type-learning';
    case 'FINISHED': return 'badge status-pending';
    case 'CANCELLED': return 'badge status-failed';
    default: return 'badge';
  }
};

const signupStatusBadgeClass = (s: SignupStatus): string => {
  switch (s) {
    case 'SIGNED_UP': return 'badge task-type-learning';
    case 'PARTICIPATED': return 'badge status-open';
    case 'ABSENT': return 'badge status-failed';
  }
};

// ---- component ----

type TabKey = 'activities' | 'mySignups';

export function VolunteerPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ADMIN' || user?.role === 'SECRETARY';
  const isMember = user?.role === 'MEMBER';

  // ---- tab ----
  const [tab, setTab] = useState<TabKey>('activities');

  // ---- activities ----
  const [activities, setActivities] = useState<VolunteerActivityView[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // ---- stats ----
  const [stats, setStats] = useState<VolunteerStats | null>(null);

  // ---- my signups ----
  const [mySignups, setMySignups] = useState<VolunteerActivityView[]>([]);
  const [mySignupsLoading, setMySignupsLoading] = useState(false);

  // ---- user signup map (activityId -> user's signup) ----
  const [userSignupMap, setUserSignupMap] = useState<Record<number, VolunteerSignupView>>({});

  // ---- filters ----
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState('');

  // ---- action loading ----
  const [actionId, setActionId] = useState<number | null>(null);

  // ---- detail modal ----
  const [detailActivity, setDetailActivity] = useState<VolunteerActivityView | null>(null);
  const [detailSignups, setDetailSignups] = useState<VolunteerSignupView[]>([]);
  const [detailSignupsLoading, setDetailSignupsLoading] = useState(false);

  // ---- signup confirm modal ----
  const [signupActivity, setSignupActivity] = useState<VolunteerActivityView | null>(null);
  const [signupNotes, setSignupNotes] = useState('');
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  // ---- cancel confirm modal ----
  const [cancelActivityId, setCancelActivityId] = useState<number | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // ---- create/edit modal ----
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<VolunteerActivityView | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- signup management modal ----
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalActivityId, setSignupModalActivityId] = useState<number | null>(null);
  const [signupModalList, setSignupModalList] = useState<VolunteerSignupView[]>([]);
  const [signupModalLoading, setSignupModalLoading] = useState(false);
  const [signupModalError, setSignupModalError] = useState<string | null>(null);

  // ---- load data ----
  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const data = await listActivities();
      setActivities(data);
    } catch (err) {
      setActivitiesError(errMsg(err));
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getVolunteerStats());
    } catch { /* non-critical */ }
  }, []);

  const loadMySignups = useCallback(async () => {
    if (!isMember) return;
    setMySignupsLoading(true);
    try {
      const all = await listActivities();
      const mine: VolunteerActivityView[] = [];
      for (const a of all) {
        if (a.status === 'PUBLISHED' || a.status === 'ONGOING' || a.status === 'FINISHED') {
          try {
            const signups = await listSignups(a.id);
            if (signups.some(s => s.userId === user?.id)) {
              mine.push(a);
            }
          } catch { /* skip */ }
        }
      }
      setMySignups(mine);
    } finally {
      setMySignupsLoading(false);
    }
  }, [isMember, user?.id]);

  const loadUserSignupMap = useCallback(async () => {
    if (!isMember) return;
    const map: Record<number, VolunteerSignupView> = {};
    for (const a of activities) {
      if (a.status === 'PUBLISHED' || a.status === 'ONGOING' || a.status === 'FINISHED') {
        try {
          const signups = await listSignups(a.id);
          const mine = signups.find(s => s.userId === user?.id);
          if (mine) map[a.id] = mine;
        } catch { /* skip */ }
      }
    }
    setUserSignupMap(map);
  }, [activities, isMember, user?.id]);

  useEffect(() => { loadActivities(); loadStats(); }, [loadActivities, loadStats]);
  useEffect(() => { if (tab === 'mySignups') loadMySignups(); }, [tab, loadMySignups]);
  useEffect(() => { loadUserSignupMap(); }, [loadUserSignupMap]);

  // ---- computed stats (enriched by API) ----
  const computedStats = useMemo(() => {
    const ongoingCount = activities.filter(a => a.status === 'ONGOING').length;
    return {
      thisMonthCount: stats?.thisMonthActivities ?? 0,
      totalCount: stats?.totalActivities ?? activities.length,
      thisMonthParticipations: stats?.thisMonthParticipations ?? 0,
      totalParticipations: stats?.totalParticipations ?? 0,
      thisMonthHours: stats?.thisMonthServiceHours ?? 0,
      totalHours: stats?.totalServiceHours ?? 0,
      ongoingCount,
    };
  }, [activities, stats]);

  // ---- filtered activities ----
  const filteredActivities = useMemo(() => {
    let list = activities;
    if (filterStatus) list = list.filter(a => a.status === filterStatus);
    if (filterKeyword.trim()) {
      const kw = filterKeyword.trim().toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(kw)
        || (a.location && a.location.toLowerCase().includes(kw)));
    }
    return list;
  }, [activities, filterStatus, filterKeyword]);

  // ---- open detail modal ----
  const openDetail = async (a: VolunteerActivityView) => {
    setDetailActivity(a);
    if (isManager) {
      setDetailSignupsLoading(true);
      try {
        const signups = await listSignups(a.id);
        setDetailSignups(signups);
      } catch { setDetailSignups([]); }
      finally { setDetailSignupsLoading(false); }
    }
  };

  const closeDetail = () => {
    setDetailActivity(null);
    setDetailSignups([]);
  };

  // ---- signup flow: step 1 open confirm, step 2 submit ----
  const openSignupConfirm = (a: VolunteerActivityView) => {
    setSignupActivity(a);
    setSignupNotes('');
  };

  const handleSignupConfirm = async () => {
    if (!signupActivity) return;
    setSignupSubmitting(true);
    try {
      await signup(signupActivity.id, signupNotes.trim() || undefined);
      setSignupActivity(null);
      await loadActivities();
    } catch (err) {
      setActivitiesError(errMsg(err));
    } finally {
      setSignupSubmitting(false);
    }
  };

  // ---- cancel flow: step 1 open confirm, step 2 submit ----
  const openCancelConfirm = (activityId: number) => setCancelActivityId(activityId);

  const handleCancelConfirm = async () => {
    if (cancelActivityId == null) return;
    setCancelSubmitting(true);
    try {
      await cancelSignup(cancelActivityId);
      setCancelActivityId(null);
      await loadActivities();
      if (detailActivity && detailActivity.id === cancelActivityId) closeDetail();
    } catch (err) {
      setActivitiesError(errMsg(err));
    } finally {
      setCancelSubmitting(false);
    }
  };

  // ---- actions ----
  const handlePublish = async (id: number) => {
    setActionId(id);
    try { await publishActivity(id); await loadActivities(); }
    catch (err) { setActivitiesError(errMsg(err)); }
    finally { setActionId(null); }
  };

  const handleFinish = async (id: number) => {
    setActionId(id);
    try { await finishActivity(id); await loadActivities(); }
    catch (err) { setActivitiesError(errMsg(err)); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id: number) => {
    setActionId(id);
    try { await deleteActivity(id); await loadActivities(); }
    catch (err) { setActivitiesError(errMsg(err)); }
    finally { setActionId(null); }
  };

  // ---- form modal ----
  const openCreateModal = () => {
    setEditingActivity(null);
    setFormTitle(''); setFormDesc(''); setFormLocation('');
    setFormStartTime(''); setFormEndTime(''); setFormMaxParticipants('');
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (a: VolunteerActivityView) => {
    setEditingActivity(a);
    setFormTitle(a.title); setFormDesc(a.description ?? '');
    setFormLocation(a.location ?? '');
    setFormStartTime(a.startTime.slice(0, 16));
    setFormEndTime(a.endTime.slice(0, 16));
    setFormMaxParticipants(a.maxParticipants?.toString() ?? '');
    setFormError(null);
    setShowFormModal(true);
  };

  const handleFormSubmit = async () => {
    if (!formTitle.trim()) { setFormError('请输入活动标题'); return; }
    if (!formStartTime || !formEndTime) { setFormError('请选择开始和结束时间'); return; }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const body = {
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        location: formLocation.trim() || undefined,
        startTime: formStartTime + ':00',
        endTime: formEndTime + ':00',
        maxParticipants: formMaxParticipants ? Number(formMaxParticipants) : undefined,
      };
      if (editingActivity) await updateActivity(editingActivity.id, body);
      else await createActivity(body);
      setShowFormModal(false);
      await loadActivities();
    } catch (err) { setFormError(errMsg(err)); }
    finally { setFormSubmitting(false); }
  };

  // ---- signup management modal ----
  const openSignupModal = async (activityId: number) => {
    setShowSignupModal(true);
    setSignupModalActivityId(activityId);
    setSignupModalLoading(true);
    setSignupModalError(null);
    try { setSignupModalList(await listSignups(activityId)); }
    catch (err) { setSignupModalError(errMsg(err)); }
    finally { setSignupModalLoading(false); }
  };

  const handleAttend = async (signupId: number, hours: number) => {
    try {
      await attend(signupId, hours);
      if (signupModalActivityId) setSignupModalList(await listSignups(signupModalActivityId));
    } catch (err) { setSignupModalError(errMsg(err)); }
  };

  // ---- signup button state text ----
  const getSignupButton = (a: VolunteerActivityView) => {
    if (a.status === 'FINISHED' || a.status === 'CANCELLED')
      return { text: '活动已结束', disabled: true, className: 'btn ghost', action: null };
    if (a.status === 'DRAFT')
      return { text: '尚未发布', disabled: true, className: 'btn ghost', action: null };

    const mySignup = userSignupMap[a.id];
    if (mySignup) {
      if (mySignup.status === 'SIGNED_UP')
        return { text: '已报名，点击取消', disabled: false, className: 'btn ghost', action: () => openCancelConfirm(a.id) };
      if (mySignup.status === 'PARTICIPATED')
        return { text: '已参与 ✓', disabled: true, className: 'btn ghost', action: null };
      if (mySignup.status === 'ABSENT')
        return { text: '已缺席', disabled: true, className: 'btn ghost', action: null };
    }

    if (a.maxParticipants && a.signupCount >= a.maxParticipants)
      return { text: '名额已满', disabled: true, className: 'btn ghost', action: null };

    return { text: '我要报名', disabled: false, className: 'btn primary', action: () => openSignupConfirm(a) };
  };

  // ---- render ----
  return (
    <div className="page">
      <h2>志愿服务管理</h2>
      <p className="muted">党群工作 › 志愿服务管理 — 组织志愿服务活动，记录党员服务时长。</p>

      {/* ====== Stats Cards ====== */}
      <div className="stat-cards" style={{ marginTop: 18 }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
          <div className="stat-card-value" style={{ color: '#1d4ed8' }}>
            {computedStats.thisMonthCount}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#62748a' }}> / {computedStats.totalCount}</span>
          </div>
          <div className="stat-card-label">本月活动 / 累计活动</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
          <div className="stat-card-value" style={{ color: '#15803d' }}>
            {computedStats.thisMonthParticipations}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#62748a' }}> / {computedStats.totalParticipations}</span>
          </div>
          <div className="stat-card-label">本月参与人次 / 累计</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }}>
          <div className="stat-card-value" style={{ color: '#c2410c' }}>
            {computedStats.thisMonthHours.toFixed(1)}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#62748a' }}> / {computedStats.totalHours.toFixed(1)}</span>
          </div>
          <div className="stat-card-label">本月服务时长 / 累计（小时）</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', border: '1px solid #fca5a5' }}>
          <div className="stat-card-value" style={{ color: '#b91c1c' }}>
            <span style={{ fontSize: '1.2rem' }}>●</span> {computedStats.ongoingCount}
          </div>
          <div className="stat-card-label">正在进行中</div>
        </div>
      </div>

      {/* ====== Tab Bar ====== */}
      <div className="tab-bar">
        <button className={`tab-btn${tab === 'activities' ? ' active' : ''}`} onClick={() => setTab('activities')}>活动列表</button>
        {isMember && <button className={`tab-btn${tab === 'mySignups' ? ' active' : ''}`} onClick={() => setTab('mySignups')}>我的报名</button>}
      </div>

      {/* ====== TAB: 活动列表 ====== */}
      {tab === 'activities' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 120 }}>
                <option value="">全部状态</option>
                <option value="PUBLISHED">已发布</option>
                <option value="ONGOING">进行中</option>
                <option value="FINISHED">已结束</option>
                <option value="DRAFT">草稿</option>
                <option value="CANCELLED">已取消</option>
              </select>
              <input type="text" className="filter-input" placeholder="搜索标题或地点…" value={filterKeyword} onChange={e => setFilterKeyword(e.target.value)} style={{ minWidth: 200 }} />
              <span className="muted" style={{ fontSize: '0.85rem' }}>共 {filteredActivities.length} 个活动</span>
            </div>
            {isManager && <button className="btn primary" onClick={openCreateModal}>+ 创建活动</button>}
          </div>

          {activitiesError && <div className="form-error" style={{ marginTop: 12 }}>{activitiesError}</div>}

          {activitiesLoading ? (
            <p className="muted" style={{ marginTop: 24, textAlign: 'center' }}>加载中…</p>
          ) : filteredActivities.length === 0 ? (
            <div className="task-empty" style={{ marginTop: 16 }}>
              <p className="muted">暂无活动</p>
              {isManager && <p className="muted" style={{ fontSize: '0.85rem' }}>点击「创建活动」组织志愿服务活动</p>}
            </div>
          ) : (
            <div className="panel" style={{ marginTop: 12, background: 'none', border: 'none', padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredActivities.map(a => {
                  const expired = isExpiredUnfinished(a);
                  const btn = isMember ? getSignupButton(a) : null;
                  return (
                    <div key={a.id} style={{
                      background: 'var(--panel)', cursor: 'pointer',
                      border: expired ? '1px solid #fca5a5' : '1px solid var(--line)',
                      borderRadius: 10, padding: '16px 18px', transition: 'box-shadow 0.15s',
                    }}
                      onClick={() => openDetail(a)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                          {expired && <span style={{ color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>待处理</span>}
                        </div>
                        <span className={statusBadgeClass(a.status)} style={{ flexShrink: 0 }}>{STATUS_LABEL[a.status]}</span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                        {a.location && <span>📍 {a.location}</span>}
                        <span>🕐 {formatDateTime(a.startTime)} → {formatDateTime(a.endTime)}</span>
                      </div>
                      {a.description && (
                        <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                          {a.description.length > 120 ? a.description.slice(0, 120) + '…' : a.description}
                        </div>
                      )}
                      {/* progress bar */}
                      <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>报名人数</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                            {a.signupCount}{a.maxParticipants ? `/${a.maxParticipants}` : '/不限'}
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{
                            width: a.maxParticipants ? `${Math.min(100, (a.signupCount / a.maxParticipants) * 100)}%` : `${Math.min(100, a.signupCount * 5)}%`,
                            backgroundColor: a.maxParticipants && a.signupCount >= a.maxParticipants ? '#b91c1c'
                              : a.maxParticipants && a.signupCount / a.maxParticipants > 0.66 ? '#2563eb' : '#15803d',
                          }} />
                        </div>
                      </div>
                      {/* action row */}
                      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                        {isMember && btn && (
                          <button className={btn.className} style={{ padding: '6px 16px', fontSize: '0.85rem' }} disabled={btn.disabled || actionId === a.id}
                            onClick={btn.action ?? undefined}>
                            {btn.text}
                          </button>
                        )}
                        {isManager && (
                          <>
                            <button className="btn ghost" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => openSignupModal(a.id)}>查看报名</button>
                            {(a.status === 'DRAFT' || a.status === 'PUBLISHED') && (
                              <>
                                <button className="btn ghost" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => openEditModal(a)}>编辑</button>
                                {a.status === 'DRAFT' && (
                                  <button className="btn primary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} disabled={actionId === a.id} onClick={() => handlePublish(a.id)}>发布</button>
                                )}
                              </>
                            )}
                            {(a.status === 'PUBLISHED' || a.status === 'ONGOING') && (
                              <button className="btn ghost" style={{ padding: '6px 12px', fontSize: '0.82rem', color: '#b45309', borderColor: '#fed7aa' }}
                                disabled={actionId === a.id} onClick={() => handleFinish(a.id)}>结束活动</button>
                            )}
                            {(a.status === 'DRAFT' || a.status === 'CANCELLED') && (
                              <button className="btn danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }} disabled={actionId === a.id} onClick={() => handleDelete(a.id)}>删除</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ====== TAB: 我的报名 ====== */}
      {tab === 'mySignups' && isMember && (
        <div className="panel" style={{ marginTop: 16 }}>
          {mySignupsLoading ? <p className="muted">加载中…</p>
            : mySignups.length === 0 ? (
              <div className="task-empty">
                <p className="muted">暂无报名记录</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}>前往「活动列表」报名感兴趣的志愿服务活动</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mySignups.map(a => {
                  const myS = userSignupMap[a.id];
                  return (
                    <div key={a.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px', background: '#fbfcfe', cursor: 'pointer' }}
                      onClick={() => openDetail(a)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontWeight: 600 }}>{a.title}</span>
                        {myS && <span className={signupStatusBadgeClass(myS.status)}>{SIGNUP_STATUS_LABEL[myS.status]}</span>}
                      </div>
                      <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                        {a.location && <span>📍 {a.location}</span>}
                        <span>🕐 {formatDateTime(a.startTime)} → {formatDateTime(a.endTime)}</span>
                      </div>
                      {myS?.serviceHours != null && <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#15803d' }}>服务时长：{myS.serviceHours} 小时</div>}
                      {myS?.notes && <div style={{ marginTop: 4, fontSize: '0.82rem', color: 'var(--muted)' }}>备注：{myS.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* ====== Detail Modal ====== */}
      {/* ====================================================================== */}
      {detailActivity && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-card" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <h3 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detailActivity.title}</h3>
                <span className={statusBadgeClass(detailActivity.status)} style={{ fontSize: '0.85rem', padding: '3px 12px', flexShrink: 0 }}>
                  {STATUS_LABEL[detailActivity.status]}
                </span>
              </div>
              <button className="modal-close" onClick={closeDetail}>✕</button>
            </div>

            {/* body */}
            <div style={{ padding: '20px 22px', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px 20px', marginBottom: 20 }}>
                <div className="detail-item">
                  <span className="detail-label">开始时间</span>
                  <span className="detail-value">{formatDateTime(detailActivity.startTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">结束时间</span>
                  <span className="detail-value">{formatDateTime(detailActivity.endTime)}</span>
                </div>
                {detailActivity.location && (
                  <div className="detail-item">
                    <span className="detail-label">活动地点</span>
                    <span className="detail-value">📍 {detailActivity.location}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">报名人数</span>
                  <span className="detail-value">
                    {detailActivity.signupCount}{detailActivity.maxParticipants ? ` / ${detailActivity.maxParticipants}` : ' / 不限'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">组织者</span>
                  <span className="detail-value">{detailActivity.organizerName}</span>
                </div>
              </div>

              {/* description */}
              {detailActivity.description && (
                <div style={{ marginBottom: 20 }}>
                  <div className="detail-section-title" style={{ marginBottom: 10 }}>活动描述</div>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{detailActivity.description}</div>
                </div>
              )}

              {/* admin: participant list */}
              {isManager && (
                <div>
                  <div className="detail-section-title" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>已报名人员</span>
                    <button className="btn ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => { closeDetail(); openSignupModal(detailActivity.id); }}>
                      管理报名
                    </button>
                  </div>
                  {detailSignupsLoading ? <p className="muted">加载中…</p>
                    : detailSignups.length === 0 ? <p className="muted" style={{ fontSize: '0.85rem' }}>暂无报名</p>
                      : (
                        <div className="table-wrap">
                          <table className="data-table">
                            <thead><tr><th>姓名</th><th>报名时间</th><th>参与状态</th><th>服务时长</th></tr></thead>
                            <tbody>
                              {detailSignups.map(s => (
                                <tr key={s.id}>
                                  <td style={{ fontWeight: 500 }}>{s.userName}</td>
                                  <td>{formatDateTime(s.signedUpAt)}</td>
                                  <td><span className={signupStatusBadgeClass(s.status)}>{SIGNUP_STATUS_LABEL[s.status]}</span></td>
                                  <td>{s.serviceHours != null ? `${s.serviceHours} 小时` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                </div>
              )}
            </div>

            {/* bottom bar: signup button */}
            {isMember && (
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center', background: '#fafbfc', borderRadius: '0 0 12px 12px' }}>
                {(() => {
                  const btn = getSignupButton(detailActivity);
                  return (
                    <button className={btn.className} style={{ padding: '10px 32px', fontSize: '0.95rem', minWidth: 160 }}
                      disabled={btn.disabled || actionId === detailActivity.id} onClick={btn.action ?? undefined}>
                      {btn.text}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ====== Signup Confirm Modal ====== */}
      {/* ====================================================================== */}
      {signupActivity && (
        <div className="modal-overlay" onClick={() => setSignupActivity(null)}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认报名</h3>
              <button className="modal-close" onClick={() => setSignupActivity(null)}>✕</button>
            </div>
            <div style={{ padding: '16px 22px 20px' }}>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 8 }}>{signupActivity.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>🕐 {formatDateTime(signupActivity.startTime)} → {formatDateTime(signupActivity.endTime)}</span>
                  {signupActivity.location && <span>📍 {signupActivity.location}</span>}
                  <span>👤 组织者：{signupActivity.organizerName}</span>
                </div>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500 }}>
                备注（选填）
                <textarea rows={2} placeholder="例如：可提供物资运输服务…" value={signupNotes}
                  onChange={e => setSignupNotes(e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem', resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button className="btn ghost" onClick={() => setSignupActivity(null)}>取消</button>
                <button className="btn primary" disabled={signupSubmitting} onClick={handleSignupConfirm}
                  style={{ minWidth: 100 }}>
                  {signupSubmitting ? '提交中…' : '确认报名'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ====== Cancel Confirm Modal ====== */}
      {/* ====================================================================== */}
      {cancelActivityId != null && (
        <div className="modal-overlay" onClick={() => setCancelActivityId(null)}>
          <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>取消报名</h3>
              <button className="modal-close" onClick={() => setCancelActivityId(null)}>✕</button>
            </div>
            <div style={{ padding: '16px 22px 20px' }}>
              <p style={{ margin: '0 0 20px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                确定要取消该活动的报名吗？取消后可以重新报名。
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn ghost" onClick={() => setCancelActivityId(null)}>暂不取消</button>
                <button className="btn danger" disabled={cancelSubmitting} onClick={handleCancelConfirm}
                  style={{ minWidth: 100 }}>
                  {cancelSubmitting ? '取消中…' : '确认取消'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ====== Create/Edit Modal ====== */}
      {/* ====================================================================== */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingActivity ? '编辑活动' : '创建活动'}</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>✕</button>
            </div>
            <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && <div className="form-error">{formError}</div>}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500 }}>
                活动标题
                <input type="text" placeholder="请输入活动标题" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500 }}>
                活动描述
                <textarea rows={3} placeholder="请输入活动描述" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem', resize: 'vertical' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500 }}>
                活动地点
                <input type="text" placeholder="请输入活动地点" value={formLocation} onChange={e => setFormLocation(e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem' }} />
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500, flex: 1 }}>
                  开始时间
                  <input type="datetime-local" value={formStartTime} onChange={e => setFormStartTime(e.target.value)}
                    style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500, flex: 1 }}>
                  结束时间
                  <input type="datetime-local" value={formEndTime} onChange={e => setFormEndTime(e.target.value)}
                    style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem' }} />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem', fontWeight: 500 }}>
                人数上限 <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 400 }}>留空表示不限</span>
                <input type="number" placeholder="不限" value={formMaxParticipants} onChange={e => setFormMaxParticipants(e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem', width: 160 }} />
              </label>
              <div className="form-actions">
                <button className="btn ghost" onClick={() => setShowFormModal(false)}>取消</button>
                <button className="btn primary" disabled={formSubmitting} onClick={handleFormSubmit}>
                  {formSubmitting ? '提交中…' : editingActivity ? '保存修改' : '创建活动'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ====== Signup Management Modal ====== */}
      {/* ====================================================================== */}
      {showSignupModal && (
        <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
          <div className="modal-card" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>报名管理</h3>
              <button className="modal-close" onClick={() => setShowSignupModal(false)}>✕</button>
            </div>
            <div style={{ padding: '12px 20px 20px' }}>
              {signupModalError && <div className="form-error" style={{ marginBottom: 12 }}>{signupModalError}</div>}
              {signupModalLoading ? <p className="muted">加载中…</p>
                : signupModalList.length === 0 ? <p className="muted">暂无报名记录</p>
                  : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead><tr><th>姓名</th><th>报名时间</th><th>参与状态</th><th>服务时长</th><th>操作</th></tr></thead>
                        <tbody>
                          {signupModalList.map(s => (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 500 }}>{s.userName}</td>
                              <td>{formatDateTime(s.signedUpAt)}</td>
                              <td><span className={signupStatusBadgeClass(s.status)}>{SIGNUP_STATUS_LABEL[s.status]}</span></td>
                              <td>{s.serviceHours != null ? `${s.serviceHours} 小时` : '—'}</td>
                              <td>
                                {s.status === 'SIGNED_UP' ? (
                                  <AttendButton signupId={s.id} onAttend={handleAttend} />
                                ) : <span className="muted" style={{ fontSize: '0.82rem' }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Attend Button (inline) ----
function AttendButton({ signupId, onAttend }: { signupId: number; onAttend: (signupId: number, hours: number) => Promise<void> }) {
  const [showInput, setShowInput] = useState(false);
  const [hours, setHours] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  if (!showInput) return <button className="btn primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setShowInput(true)}>标记已参与</button>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="number" step="0.5" min="0" value={hours} onChange={e => setHours(e.target.value)}
        style={{ width: 60, border: '1px solid var(--line)', borderRadius: 6, padding: '3px 6px', fontSize: '0.8rem' }} />
      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>小时</span>
      <button className="btn primary" style={{ padding: '4px 8px', fontSize: '0.78rem' }} disabled={submitting}
        onClick={async () => { setSubmitting(true); try { await onAttend(signupId, Number(hours) || 0); } finally { setSubmitting(false); } }}>确认</button>
      <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => setShowInput(false)}>取消</button>
    </div>
  );
}
