import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import {
  addFloatingContact,
  deleteFloatingContact,
  listFloatingContacts,
  listFloatingMembers,
  listMemberProfiles,
  markFloating,
  getMemberProfileByUserId,
  returnFromFloating,
} from '../../api/member-profiles';
import type {
  ContactMethod,
  FloatingContactView,
  MemberProfileRequest,
  MemberProfileView,
} from '../../api/types';

// ---- helpers ----

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const CONTACT_METHOD_LABEL: Record<string, string> = {
  PHONE: '电话',
  WECHAT: '微信',
  VISIT: '走访',
  LETTER: '信函',
};

const STATUS_LABEL: Record<string, string> = {
  FORMAL: '正式党员',
  PROBATIONARY: '预备党员',
  FLOATING: '流动党员',
};

type FilterStatus = 'ALL' | 'ACTIVE' | 'RETURNING_SOON';

function isReturningSoon(expectedReturn: string | null): boolean {
  if (!expectedReturn) return false;
  const d = new Date(expectedReturn);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

function isNewThisMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function FloatingMembersPage() {
  // data
  const [members, setMembers] = useState<MemberProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  // detail modal
  const [detail, setDetail] = useState<MemberProfileView | null>(null);
  const [detailContacts, setDetailContacts] = useState<FloatingContactView[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // outflow register modal
  const [showOutflowModal, setShowOutflowModal] = useState(false);
  const [allMembers, setAllMembers] = useState<MemberProfileView[]>([]);
  const [outflowUserId, setOutflowUserId] = useState<number | null>(null);
  const [outflowSaving, setOutflowSaving] = useState(false);
  const [outflowError, setOutflowError] = useState<string | null>(null);

  // outflow form fields
  const [outflowLocation, setOutflowLocation] = useState('');
  const [outflowStartDate, setOutflowStartDate] = useState('');
  const [outflowReason, setOutflowReason] = useState('');
  const [outflowExpectedReturn, setOutflowExpectedReturn] = useState('');
  const [outflowContact, setOutflowContact] = useState('');

  // contact records modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactUserId, setContactUserId] = useState<number | null>(null);
  const [contactUserName, setContactUserName] = useState('');
  const [contacts, setContacts] = useState<FloatingContactView[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // add contact form
  const [contactDate, setContactDate] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('PHONE');
  const [contactSummary, setContactSummary] = useState('');
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // return confirm dialog
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [returnUserId, setReturnUserId] = useState<number | null>(null);
  const [returnUserName, setReturnUserName] = useState('');
  const [returnSaving, setReturnSaving] = useState(false);

  // ---- data loading ----

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFloatingMembers();
      setMembers(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- filtered data ----

  const filtered = useMemo(() => {
    return members.filter((m) => {
      // location search
      if (filterLocation.trim()) {
        const kw = filterLocation.trim().toLowerCase();
        if (!(m.floatingLocation ?? '').toLowerCase().includes(kw)) return false;
      }
      // date range
      if (filterDateFrom) {
        if (!m.floatingStartDate || m.floatingStartDate < filterDateFrom) return false;
      }
      if (filterDateTo) {
        if (!m.floatingStartDate || m.floatingStartDate > filterDateTo) return false;
      }
      // status
      if (filterStatus === 'RETURNING_SOON') {
        if (!isReturningSoon(m.floatingExpectedReturn)) return false;
      }
      // 'ACTIVE' is all floating (already filtered by the API)
      return true;
    });
  }, [members, filterLocation, filterDateFrom, filterDateTo, filterStatus]);

  // ---- statistics ----

  const stats = useMemo(() => {
    const total = filtered.length;
    const newThisMonth = filtered.filter((m) => isNewThisMonth(m.floatingStartDate)).length;
    const returningSoon = filtered.filter((m) => isReturningSoon(m.floatingExpectedReturn)).length;
    return { total, newThisMonth, returningSoon };
  }, [filtered]);

  // ---- detail modal ----

  const openDetail = async (userId: number) => {
    setDetailLoading(true);
    setDetail(null);
    setDetailContacts([]);
    try {
      const [d, ct] = await Promise.all([
        getMemberProfileByUserId(userId),
        listFloatingContacts(userId),
      ]);
      setDetail(d);
      setDetailContacts(ct);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailContacts([]);
  };

  // ---- outflow register modal ----

  const openOutflowModal = async () => {
    setOutflowUserId(null);
    setOutflowLocation('');
    setOutflowStartDate('');
    setOutflowReason('');
    setOutflowExpectedReturn('');
    setOutflowContact('');
    setOutflowError(null);
    setShowOutflowModal(true);
    try {
      const data = await listMemberProfiles();
      setAllMembers(data.filter((m) => m.memberStatus !== 'FLOATING'));
    } catch {
      setAllMembers([]);
    }
  };

  const handleOutflowSubmit = async () => {
    if (!outflowUserId) return;
    setOutflowSaving(true);
    setOutflowError(null);
    try {
      const body: MemberProfileRequest = {
        userId: outflowUserId,
        floatingLocation: outflowLocation || undefined,
        floatingStartDate: outflowStartDate || undefined,
        floatingReason: outflowReason || undefined,
        floatingExpectedReturn: outflowExpectedReturn || undefined,
        floatingContact: outflowContact || undefined,
        memberStatus: 'FLOATING' as const,
      };
      await markFloating(outflowUserId, body);
      setShowOutflowModal(false);
      await load();
    } catch (err) {
      setOutflowError(errMsg(err));
    } finally {
      setOutflowSaving(false);
    }
  };

  // ---- contact records modal ----

  const openContactModal = async (userId: number, userName: string) => {
    setContactUserId(userId);
    setContactUserName(userName);
    setContactDate('');
    setContactMethod('PHONE');
    setContactSummary('');
    setContactError(null);
    setShowContactModal(true);
    setContactsLoading(true);
    try {
      const data = await listFloatingContacts(userId);
      setContacts(data);
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactUserId || !contactDate.trim()) return;
    setContactSaving(true);
    setContactError(null);
    try {
      await addFloatingContact(contactUserId, {
        contactDate,
        contactMethod,
        summary: contactSummary || undefined,
      });
      setContactDate('');
      setContactMethod('PHONE');
      setContactSummary('');
      // refresh list
      const data = await listFloatingContacts(contactUserId);
      setContacts(data);
    } catch (err) {
      setContactError(errMsg(err));
    } finally {
      setContactSaving(false);
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!contactUserId) return;
    if (!window.confirm('确定删除该联系记录？')) return;
    try {
      await deleteFloatingContact(id);
      const data = await listFloatingContacts(contactUserId);
      setContacts(data);
    } catch {
      // ignore
    }
  };

  // ---- return confirm ----

  const openReturnConfirm = (userId: number, userName: string) => {
    setReturnUserId(userId);
    setReturnUserName(userName);
    setReturnSaving(false);
    setShowReturnConfirm(true);
  };

  const handleReturn = async () => {
    if (!returnUserId) return;
    setReturnSaving(true);
    try {
      await returnFromFloating(returnUserId);
      setShowReturnConfirm(false);
      await load();
    } catch {
      setReturnSaving(false);
    }
  };

  // ---- render helpers ----

  const genderLabel = (g: string | null) =>
    g === 'MALE' ? '男' : g === 'FEMALE' ? '女' : '—';

  const badgeClass = (status: string | null) => {
    if (status === 'FORMAL') return 'status-open';
    if (status === 'FLOATING') return 'status-pending';
    return 'status-draft';
  };

  return (
    <div className="page">
      <h2>流动党员管理</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p className="muted" style={{ margin: 0 }}>管理和查看所有处于流动状态的党员信息，记录联系情况</p>
        <button className="btn primary" onClick={openOutflowModal}>
          流出登记
        </button>
      </div>

      {/* ---- stat cards ---- */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">流动党员总数</div>
        </div>
        <div className="stat-card stat-card-new">
          <div className="stat-card-value">{stats.newThisMonth}</div>
          <div className="stat-card-label">本月新增流出</div>
        </div>
        <div className="stat-card stat-card-returning">
          <div className="stat-card-value">{stats.returningSoon}</div>
          <div className="stat-card-label">即将到期返回</div>
        </div>
      </div>

      {/* ---- filter bar ---- */}
      <div className="filter-bar">
        <div className="filter-bar-row">
          <div className="filter-group">
            <label className="filter-label">流入地搜索</label>
            <input
              type="text"
              className="filter-input"
              placeholder="输入流入地关键词…"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">流出时间从</label>
            <input
              type="date"
              className="filter-input"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">至</label>
            <input
              type="date"
              className="filter-input"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">状态</label>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="ALL">全部</option>
              <option value="ACTIVE">流动中</option>
              <option value="RETURNING_SOON">即将到期</option>
            </select>
          </div>
          {(filterLocation || filterDateFrom || filterDateTo || filterStatus !== 'ALL') && (
            <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn ghost"
                onClick={() => {
                  setFilterLocation('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterStatus('ALL');
                }}
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          共 {filtered.length} 名流动党员
        </span>
      </div>

      {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* ---- data table ---- */}
      <div className="panel" style={{ marginTop: 12 }}>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">暂无符合条件的流动党员</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>原属支部</th>
                  <th>性别</th>
                  <th>流入地</th>
                  <th>流出时间</th>
                  <th>流出原因</th>
                  <th>预计返回</th>
                  <th>紧急联系电话</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.userId}>
                    <td className="archive-name-cell">{m.userName}</td>
                    <td>{m.branchName || '—'}</td>
                    <td>{genderLabel(m.gender)}</td>
                    <td>{m.floatingLocation || '—'}</td>
                    <td>{m.floatingStartDate || '—'}</td>
                    <td>
                      <span style={{ maxWidth: 160, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.floatingReason ?? undefined}>
                        {m.floatingReason || '—'}
                      </span>
                    </td>
                    <td>
                      {m.floatingExpectedReturn ? (
                        <span className={isReturningSoon(m.floatingExpectedReturn) ? 'text-warning' : ''}>
                          {m.floatingExpectedReturn}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{m.floatingContact || '—'}</td>
                    <td>
                      <div className="action-btn-group">
                        <button
                          className="btn ghost"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => openDetail(m.userId)}
                        >
                          查看详情
                        </button>
                        <button
                          className="btn ghost"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => openContactModal(m.userId, m.userName)}
                        >
                          联系记录
                        </button>
                        <button
                          className="btn ghost"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--red)' }}
                          onClick={() => openReturnConfirm(m.userId, m.userName)}
                        >
                          标记返回
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======== detail modal ======== */}
      {detailLoading && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="muted" style={{ padding: 40, textAlign: 'center' }}>加载中…</p>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-card member-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{detail.userName} — 党员档案</h3>
              <button className="modal-close" onClick={closeDetail}>✕</button>
            </div>

            <div className="member-detail-body">
              {/* 基础信息 */}
              <div className="detail-section">
                <h4 className="detail-section-title">基础信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">姓名</span>
                    <span className="detail-value">{detail.userName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">性别</span>
                    <span className="detail-value">{genderLabel(detail.gender)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">民族</span>
                    <span className="detail-value">{detail.ethnicity || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">出生日期</span>
                    <span className="detail-value">{detail.birthDate || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">身份证号</span>
                    <span className="detail-value">{detail.idCard || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">手机号</span>
                    <span className="detail-value">{detail.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 组织信息 */}
              <div className="detail-section">
                <h4 className="detail-section-title">组织信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">所属支部</span>
                    <span className="detail-value">{detail.branchName || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">党员状态</span>
                    <span className="detail-value">
                      <span className={`badge ${badgeClass(detail.memberStatus)}`}>
                        {detail.memberStatus ? STATUS_LABEL[detail.memberStatus] : '—'}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">入党时间</span>
                    <span className="detail-value">{detail.joinDate || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">转正时间</span>
                    <span className="detail-value">{detail.formalDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 流动信息 */}
              {detail.memberStatus === 'FLOATING' && (
                <div className="detail-section">
                  <h4 className="detail-section-title">流动信息</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">流入地</span>
                      <span className="detail-value">{detail.floatingLocation || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">流出时间</span>
                      <span className="detail-value">{detail.floatingStartDate || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">流出原因</span>
                      <span className="detail-value">{detail.floatingReason || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">预计返回时间</span>
                      <span className="detail-value">
                        {detail.floatingExpectedReturn ? (
                          <span className={isReturningSoon(detail.floatingExpectedReturn) ? 'text-warning' : ''}>
                            {detail.floatingExpectedReturn}
                          </span>
                        ) : '—'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">紧急联系电话</span>
                      <span className="detail-value">{detail.floatingContact || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 学历职业 */}
              <div className="detail-section">
                <h4 className="detail-section-title">学历与职业</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">学历</span>
                    <span className="detail-value">{detail.education || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">学位</span>
                    <span className="detail-value">{detail.degree || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">工作单位</span>
                    <span className="detail-value">{detail.workplace || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">职务</span>
                    <span className="detail-value">{detail.position || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 联系记录时间线 */}
              <div className="detail-section">
                <h4 className="detail-section-title">联系记录</h4>
                {detailContacts.length === 0 ? (
                  <p className="muted" style={{ fontSize: '0.85rem' }}>暂无联系记录</p>
                ) : (
                  <div className="contact-timeline">
                    {detailContacts.map((c) => (
                      <div key={c.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-date">{c.contactDate}</span>
                            <span className="badge" style={{ fontSize: '0.72rem' }}>
                              {CONTACT_METHOD_LABEL[c.contactMethod] ?? c.contactMethod}
                            </span>
                          </div>
                          <p className="timeline-summary">{c.summary || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== outflow register modal ======== */}
      {showOutflowModal && (
        <div className="modal-overlay" onClick={() => !outflowSaving && setShowOutflowModal(false)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>流出登记</h3>
              <button
                className="modal-close"
                onClick={() => setShowOutflowModal(false)}
                disabled={outflowSaving}
              >
                ✕
              </button>
            </div>
            <div className="member-detail-body">
              {outflowError && <div className="form-error" style={{ marginBottom: 12 }}>{outflowError}</div>}
              <div className="form-grid">
                <label className="span-2">
                  选择党员
                  <select
                    value={outflowUserId ?? ''}
                    onChange={(e) => setOutflowUserId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">请选择一名非流动状态的党员</option>
                    {allMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName} — {m.branchName || '—'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  流入地
                  <input
                    type="text"
                    placeholder="如：上海市浦东新区"
                    value={outflowLocation}
                    onChange={(e) => setOutflowLocation(e.target.value)}
                  />
                </label>
                <label>
                  流出时间
                  <input
                    type="date"
                    value={outflowStartDate}
                    onChange={(e) => setOutflowStartDate(e.target.value)}
                  />
                </label>
                <label className="span-2">
                  流出原因
                  <input
                    type="text"
                    placeholder="如：因工作需要长期驻外"
                    maxLength={200}
                    value={outflowReason}
                    onChange={(e) => setOutflowReason(e.target.value)}
                  />
                </label>
                <label>
                  预计返回时间
                  <input
                    type="date"
                    value={outflowExpectedReturn}
                    onChange={(e) => setOutflowExpectedReturn(e.target.value)}
                  />
                </label>
                <label>
                  紧急联系电话
                  <input
                    type="text"
                    placeholder="手机号码"
                    maxLength={20}
                    value={outflowContact}
                    onChange={(e) => setOutflowContact(e.target.value)}
                  />
                </label>
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="btn ghost"
                  onClick={() => setShowOutflowModal(false)}
                  disabled={outflowSaving}
                >
                  取消
                </button>
                <button
                  className="btn primary"
                  onClick={handleOutflowSubmit}
                  disabled={outflowSaving}
                >
                  {outflowSaving ? '提交中…' : '确认流出'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== contact records modal ======== */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>联系记录 — {contactUserName}</h3>
              <button className="modal-close" onClick={() => setShowContactModal(false)}>✕</button>
            </div>
            <div className="member-detail-body">
              {/* add contact form */}
              <div className="detail-section">
                <h4 className="detail-section-title">新增联系记录</h4>
                {contactError && <div className="form-error" style={{ marginBottom: 10 }}>{contactError}</div>}
                <div className="form-grid">
                  <label>
                    联系时间
                    <input
                      type="date"
                      value={contactDate}
                      onChange={(e) => setContactDate(e.target.value)}
                    />
                  </label>
                  <label>
                    联系方式
                    <select
                      value={contactMethod}
                      onChange={(e) => setContactMethod(e.target.value as ContactMethod)}
                    >
                      <option value="PHONE">电话</option>
                      <option value="WECHAT">微信</option>
                      <option value="VISIT">走访</option>
                      <option value="LETTER">信函</option>
                    </select>
                  </label>
                  <label className="span-2">
                    内容摘要
                    <textarea
                      rows={2}
                      placeholder="简要描述本次联系的内容"
                      maxLength={500}
                      value={contactSummary}
                      onChange={(e) => setContactSummary(e.target.value)}
                    />
                  </label>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn primary"
                    onClick={handleAddContact}
                    disabled={contactSaving || !contactDate.trim()}
                  >
                    {contactSaving ? '保存中…' : '添加记录'}
                  </button>
                </div>
              </div>

              {/* contact list */}
              <div className="detail-section">
                <h4 className="detail-section-title">
                  历史记录（{contacts.length}）
                </h4>
                {contactsLoading ? (
                  <p className="muted">加载中…</p>
                ) : contacts.length === 0 ? (
                  <p className="muted" style={{ fontSize: '0.85rem' }}>暂无联系记录</p>
                ) : (
                  <div className="contact-timeline">
                    {contacts.map((c) => (
                      <div key={c.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-date">{c.contactDate}</span>
                            <span className="badge" style={{ fontSize: '0.72rem' }}>
                              {CONTACT_METHOD_LABEL[c.contactMethod] ?? c.contactMethod}
                            </span>
                            <span style={{ flex: 1 }} />
                            <button
                              className="btn ghost"
                              style={{ padding: '2px 6px', fontSize: '0.72rem', color: 'var(--red)' }}
                              onClick={() => handleDeleteContact(c.id)}
                            >
                              删除
                            </button>
                          </div>
                          <p className="timeline-summary">{c.summary || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== return confirm dialog ======== */}
      {showReturnConfirm && (
        <div className="modal-overlay" onClick={() => !returnSaving && setShowReturnConfirm(false)}>
          <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认转回</h3>
              <button
                className="modal-close"
                onClick={() => setShowReturnConfirm(false)}
                disabled={returnSaving}
              >
                ✕
              </button>
            </div>
            <div className="member-detail-body">
              <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
                确认将 <strong>{returnUserName}</strong> 从<strong>流动党员</strong>状态转回<strong>正式党员</strong>状态吗？
              </p>
              <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 20px' }}>
                此操作将清除该党员的流出时间、流出原因、流入地等流动相关信息。
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="btn ghost"
                  onClick={() => setShowReturnConfirm(false)}
                  disabled={returnSaving}
                >
                  取消
                </button>
                <button
                  className="btn danger"
                  onClick={handleReturn}
                  disabled={returnSaving}
                >
                  {returnSaving ? '处理中…' : '确认转回'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
