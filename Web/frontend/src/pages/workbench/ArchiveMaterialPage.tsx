import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  createArchive,
  deleteArchive,
  listArchives,
  listBranches,
  listBranchUsers,
  updateArchive,
} from '../../api/branches';
import type { ArchiveCategory, BranchArchiveView, BranchView, UserView } from '../../api/types';
import { ApiError } from '../../api/client';

// ---- constants ----

const CATEGORY_LABEL: Record<ArchiveCategory, string> = {
  MEETING_BRANCH: '支部党员大会',
  MEETING_COMMITTEE: '支委会',
  MEETING_GROUP: '党小组会',
  PARTY_LECTURE: '党课',
  THEME_DAY: '主题党日',
  ORG_LIFE: '组织生活会',
  ELECTION: '换届选举',
  PLAN_SUMMARY: '计划总结',
  SUPERIOR_DOC: '上级文件',
};

const CATEGORY_ICON: Record<ArchiveCategory, string> = {
  MEETING_BRANCH: '\u{1F4CB}',
  MEETING_COMMITTEE: '\u{1F4DD}',
  MEETING_GROUP: '\u{1F465}',
  PARTY_LECTURE: '\u{1F4D6}',
  THEME_DAY: '\u{1F3D7}️',
  ORG_LIFE: '\u{1F91D}',
  ELECTION: '\u{1F5F3}️',
  PLAN_SUMMARY: '\u{1F4CA}',
  SUPERIOR_DOC: '\u{1F4C4}',
};

const CATEGORIES: ArchiveCategory[] = [
  'MEETING_BRANCH', 'MEETING_COMMITTEE', 'MEETING_GROUP',
  'PARTY_LECTURE', 'THEME_DAY', 'ORG_LIFE',
  'ELECTION', 'PLAN_SUMMARY', 'SUPERIOR_DOC',
];

const CATEGORY_COLORS: Record<ArchiveCategory, string> = {
  MEETING_BRANCH: '#3b82f6',
  MEETING_COMMITTEE: '#6366f1',
  MEETING_GROUP: '#22c55e',
  PARTY_LECTURE: '#f59e0b',
  THEME_DAY: '#ef4444',
  ORG_LIFE: '#8b5cf6',
  ELECTION: '#ec4899',
  PLAN_SUMMARY: '#14b8a6',
  SUPERIOR_DOC: '#6b7280',
};

/** 三会一课类别 */
const TRI_ONE_CATEGORIES: ArchiveCategory[] = [
  'MEETING_BRANCH', 'MEETING_COMMITTEE', 'MEETING_GROUP', 'PARTY_LECTURE',
];

function isTriOne(cat: ArchiveCategory): boolean {
  return TRI_ONE_CATEGORIES.includes(cat);
}

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return d.slice(0, 10);
}

// ---- component ----

export function ArchiveMaterialPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  // ---- branches ----
  const [branches, setBranches] = useState<BranchView[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchUsers, setBranchUsers] = useState<UserView[]>([]);

  // ---- data ----
  const [archives, setArchives] = useState<BranchArchiveView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- filter ----
  const [activeCategory, setActiveCategory] = useState<ArchiveCategory | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchText, setSearchText] = useState('');

  // ---- expanded card ----
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ---- modal ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState<ArchiveCategory>('MEETING_BRANCH');
  const [formTitle, setFormTitle] = useState('');
  const [formRecordDate, setFormRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formContent, setFormContent] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null);

  // ---- 三会一课 form fields ----
  const [formHostUserId, setFormHostUserId] = useState<number | ''>('');
  const [formRecorderUserId, setFormRecorderUserId] = useState<number | ''>('');
  const [formExpected, setFormExpected] = useState('');
  const [formActual, setFormActual] = useState('');
  const [formAbsent, setFormAbsent] = useState('');
  const [formTopics, setFormTopics] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- load branches ----
  useEffect(() => {
    listBranches().then(setBranches).catch(() => {});
  }, []);

  // auto-select branch for secretary
  useEffect(() => {
    if (user?.role === 'SECRETARY' && user.branchId) {
      setSelectedBranchId(user.branchId);
    } else if (user?.role === 'ADMIN' && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [user, branches, selectedBranchId]);

  // load branch users
  useEffect(() => {
    if (selectedBranchId) {
      listBranchUsers(selectedBranchId).then(setBranchUsers).catch(() => setBranchUsers([]));
    }
  }, [selectedBranchId]);

  const branchName = useMemo(() => {
    if (!selectedBranchId) return '—';
    return branches.find((b) => b.id === selectedBranchId)?.name ?? `支部 #${selectedBranchId}`;
  }, [branches, selectedBranchId]);

  // ---- load archives ----
  const loadArchives = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listArchives(selectedBranchId, {
        category: activeCategory ?? undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setArchives(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, activeCategory, dateFrom, dateTo]);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  // ---- category counts ----
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of CATEGORIES) counts[c] = 0;
    for (const a of archives) counts[a.category] = (counts[a.category] || 0) + 1;
    return counts;
  }, [archives]);

  // ---- stats ----
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = archives.filter((a) => {
      const d = new Date(a.recordDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const dates = archives.map((a) => new Date(a.recordDate).getTime());
    const latest = dates.length > 0 ? new Date(Math.max(...dates)) : null;
    return {
      total: archives.length,
      thisMonth,
      latestDate: latest ? latest.toISOString().slice(0, 10) : null,
    };
  }, [archives]);

  // ---- filtered list ----
  const filteredArchives = useMemo(() => {
    if (!searchText.trim()) return archives;
    const q = searchText.trim().toLowerCase();
    return archives.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.content && a.content.toLowerCase().includes(q)),
    );
  }, [archives, searchText]);

  // ---- reset form ----
  const resetForm = (cat?: ArchiveCategory) => {
    setFormCategory(cat ?? 'MEETING_BRANCH');
    setFormTitle('');
    setFormRecordDate(new Date().toISOString().slice(0, 10));
    setFormContent('');
    setFormFile(null);
    setFormFilePreview(null);
    setFormHostUserId('');
    setFormRecorderUserId('');
    setFormExpected('');
    setFormActual('');
    setFormAbsent('');
    setFormTopics('');
    setFormLocation('');
    setFormError(null);
  };

  // ---- modal helpers ----
  const openCreate = (cat?: ArchiveCategory) => {
    setEditingId(null);
    resetForm(cat);
    setModalOpen(true);
  };

  const openEdit = (a: BranchArchiveView) => {
    setEditingId(a.id);
    setFormCategory(a.category);
    setFormTitle(a.title);
    setFormRecordDate(a.recordDate);
    setFormContent(a.content ?? '');
    setFormFile(null);
    setFormFilePreview(a.fileUrl ? a.fileName : null);
    setFormHostUserId(a.hostUserId ?? '');
    setFormRecorderUserId(a.recorderUserId ?? '');
    setFormExpected(a.expectedCount != null ? String(a.expectedCount) : '');
    setFormActual(a.actualCount != null ? String(a.actualCount) : '');
    setFormAbsent(a.absentCount != null ? String(a.absentCount) : '');
    setFormTopics(a.topics ?? '');
    setFormLocation(a.location ?? '');
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      setFormError('请输入材料标题');
      return;
    }
    if (!selectedBranchId) {
      setFormError('请先选择支部');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const fd = new FormData();
    fd.set('category', formCategory);
    fd.set('title', formTitle.trim());
    fd.set('recordDate', formRecordDate);
    if (formContent.trim()) fd.set('content', formContent.trim());
    if (formFile) fd.set('file', formFile);

    // 三会一课结构化字段
    if (isTriOne(formCategory)) {
      if (formHostUserId) fd.set('hostUserId', String(formHostUserId));
      if (formRecorderUserId) fd.set('recorderUserId', String(formRecorderUserId));
      if (formExpected.trim()) fd.set('expectedCount', formExpected.trim());
      if (formActual.trim()) fd.set('actualCount', formActual.trim());
      if (formAbsent.trim()) fd.set('absentCount', formAbsent.trim());
      if (formTopics.trim()) fd.set('topics', formTopics.trim());
      if (formLocation.trim()) fd.set('location', formLocation.trim());
    }

    try {
      if (editingId) {
        await updateArchive(selectedBranchId, editingId, fd);
      } else {
        await createArchive(selectedBranchId, fd);
      }
      closeModal();
      await loadArchives();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedBranchId || !window.confirm('确定删除该归档材料吗？')) return;
    try {
      await deleteArchive(selectedBranchId, id);
      if (expandedId === id) setExpandedId(null);
      await loadArchives();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const getFileUrl = (branchId: number, archiveId: number) => {
    return `/api/branches/${branchId}/archives/${archiveId}/file`;
  };

  // ---- render ----
  return (
    <div className="page">
      <h2>材料归档</h2>
      <p className="muted">
        {branchName} — 管理和查阅支部组织生活的全部归档材料
      </p>

      {/* branch selector for ADMIN */}
      {user?.role === 'ADMIN' && branches.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={selectedBranchId ?? ''}
            onChange={(e) => {
              setSelectedBranchId(e.target.value ? Number(e.target.value) : null);
              setActiveCategory(null);
              setExpandedId(null);
            }}
            style={{ maxWidth: 240 }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* main layout */}
      <div className="archive-layout">
        {/* left: category nav */}
        <aside className="archive-sidebar">
          <button
            className={`archive-cat-btn ${activeCategory === null ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            <span className="archive-cat-icon">{'\u{1F4C1}'}</span>
            <span className="archive-cat-label">全部材料</span>
            <span className="archive-cat-badge">{archives.length}</span>
          </button>

          <div className="archive-cat-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`archive-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{ borderLeftColor: activeCategory === cat ? CATEGORY_COLORS[cat] : 'transparent' }}
              >
                <span className="archive-cat-icon">{CATEGORY_ICON[cat]}</span>
                <span className="archive-cat-label">{CATEGORY_LABEL[cat]}</span>
                <span className="archive-cat-badge" style={{ background: CATEGORY_COLORS[cat] + '18', color: CATEGORY_COLORS[cat] }}>
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="archive-stats">
            <div className="archive-stat-item">
              <div className="archive-stat-num">{stats.total}</div>
              <div className="archive-stat-label">总归档数</div>
            </div>
            <div className="archive-stat-item">
              <div className="archive-stat-num">{stats.thisMonth}</div>
              <div className="archive-stat-label">本月新增</div>
            </div>
            <div className="archive-stat-item">
              <div className="archive-stat-num" style={{ fontSize: '0.9rem' }}>
                {stats.latestDate ?? '—'}
              </div>
              <div className="archive-stat-label">最近归档日期</div>
            </div>
          </div>
        </aside>

        {/* right: content */}
        <main className="archive-content">
          <div className="archive-toolbar">
            <input
              type="text"
              className="filter-input"
              placeholder="搜索标题或内容…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <label className="archive-date-label">
              从
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="archive-date-label">
              至
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            {(dateFrom || dateTo) && (
              <button className="btn ghost" onClick={() => {
                const d = new Date(); d.setFullYear(d.getFullYear() - 1);
                setDateFrom(d.toISOString().slice(0, 10));
                setDateTo(new Date().toISOString().slice(0, 10));
              }}>重置</button>
            )}
            {canManage && (
              <button className="btn primary" onClick={() => openCreate(activeCategory ?? undefined)}>
                + 新增归档
              </button>
            )}
          </div>

          {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}

          {loading ? (
            <div className="panel" style={{ marginTop: 16 }}><p className="muted">加载中…</p></div>
          ) : filteredArchives.length === 0 ? (
            <div className="panel" style={{ marginTop: 16, textAlign: 'center', padding: '60px 20px' }}>
              <p className="muted" style={{ fontSize: '1.1rem' }}>{'\u{1F4C1}'} 暂无归档材料</p>
              <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
                {canManage ? '点击「新增归档」开始添加支部材料' : '暂无该分类的归档材料'}
              </p>
            </div>
          ) : (
            <div className="archive-card-list">
              {filteredArchives.map((a) => {
                const isExpanded = expandedId === a.id;
                const triOne = isTriOne(a.category);
                const attendance = a.expectedCount != null && a.expectedCount > 0
                  ? Math.round(((a.actualCount ?? 0) / a.expectedCount) * 100) : null;

                return (
                  <div key={a.id} className={`archive-card ${isExpanded ? 'expanded' : ''}`}>
                    <div className="archive-card-header" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                      <div className="archive-card-main">
                        <div className="archive-card-title">{a.title}</div>
                        <div className="archive-card-meta">
                          <span className="badge" style={{ background: CATEGORY_COLORS[a.category] + '18', color: CATEGORY_COLORS[a.category], fontSize: '0.72rem' }}>
                            {CATEGORY_ICON[a.category]} {CATEGORY_LABEL[a.category]}
                          </span>
                          <span className="archive-card-date">{'\u{1F4C5}'} {a.recordDate}</span>
                          {triOne && a.location && <span className="archive-card-date">{'\u{1F4CD}'} {a.location}</span>}
                          {triOne && attendance != null && (
                            <span className="archive-card-date" style={{ color: attendance >= 80 ? '#22c55e' : '#ef4444' }}>
                              {'\u{1F465}'} 出勤 {attendance}%
                            </span>
                          )}
                          <span className="archive-card-date" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                            上传于 {formatDate(a.uploadedAt)}
                          </span>
                          {a.fileUrl && <span title="有附件">{'\u{1F4CE}'}</span>}
                        </div>
                      </div>
                      <span className="archive-card-chevron">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div className="archive-card-body">
                        {/* 三会一课结构化展示 */}
                        {triOne && (
                          <div className="archive-meeting-info">
                            <div className="archive-meeting-header">
                              {'\u{1F4CB}'} {CATEGORY_LABEL[a.category]} — 会议记录
                            </div>
                            <div className="archive-meeting-grid">
                              {a.recordDate && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">会议时间</span>
                                  <span>{a.recordDate}</span>
                                </div>
                              )}
                              {a.location && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">会议地点</span>
                                  <span>{a.location}</span>
                                </div>
                              )}
                              {a.hostUserName && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">主持人</span>
                                  <span>{a.hostUserName}</span>
                                </div>
                              )}
                              {a.recorderUserName && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">记录人</span>
                                  <span>{a.recorderUserName}</span>
                                </div>
                              )}
                              {a.expectedCount != null && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">应到人数</span>
                                  <span>{a.expectedCount} 人</span>
                                </div>
                              )}
                              {a.actualCount != null && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">实到人数</span>
                                  <span>{a.actualCount} 人</span>
                                </div>
                              )}
                              {a.absentCount != null && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">缺席人数</span>
                                  <span>{a.absentCount} 人</span>
                                </div>
                              )}
                              {attendance != null && (
                                <div className="archive-meeting-field">
                                  <span className="archive-meeting-label">出勤率</span>
                                  <span style={{ color: attendance >= 80 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                                    {attendance}%
                                  </span>
                                </div>
                              )}
                              {a.topics && (
                                <div className="archive-meeting-field" style={{ gridColumn: '1 / -1' }}>
                                  <span className="archive-meeting-label">会议议题</span>
                                  <span>{a.topics}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* content */}
                        {a.content ? (
                          <div className="archive-card-content" style={triOne ? { borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 4 } : undefined}>
                            {a.content}
                          </div>
                        ) : !triOne ? (
                          <p className="muted" style={{ fontSize: '0.85rem' }}>暂无文本内容</p>
                        ) : null}

                        {/* attachment */}
                        {a.fileUrl && a.fileName && (
                          <div className="archive-card-file">
                            <span>{'\u{1F4CE}'} 附件：{a.fileName}</span>
                            <a
                              href={getFileUrl(a.branchId, a.id)}
                              className="btn primary"
                              style={{ padding: '3px 12px', fontSize: '0.78rem', marginLeft: 10 }}
                              target="_blank" rel="noreferrer"
                            >
                              下载
                            </a>
                          </div>
                        )}

                        {canManage && (
                          <div className="archive-card-actions">
                            <button className="btn ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => openEdit(a)}>
                              编辑
                            </button>
                            <button className="btn danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleDelete(a.id)}>
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ======== create / edit modal ======== */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card archive-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: '95%' }}>
            <div className="modal-header">
              <h3>{editingId ? '编辑归档材料' : '新增归档材料'}</h3>
              <button className="modal-close" onClick={closeModal}>{'✕'}</button>
            </div>

            {formError && <div className="form-error" style={{ margin: '0 20px 8px' }}>{formError}</div>}

            <div className="archive-form">
              <label>
                <span className="task-form-label">归档类别</span>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as ArchiveCategory)}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICON[cat]} {CATEGORY_LABEL[cat]}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="task-form-label">材料标题 *</span>
                <input type="text" placeholder="请输入材料标题" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </label>

              <label>
                <span className="task-form-label">记录日期</span>
                <input type="date" value={formRecordDate} onChange={(e) => setFormRecordDate(e.target.value)} />
              </label>

              {/* 三会一课结构化字段 */}
              {isTriOne(formCategory) && (
                <div className="archive-meeting-form">
                  <div className="archive-form-section-title">{'\u{1F4CB}'} 会议信息</div>

                  <div className="archive-form-row">
                    <label style={{ flex: 1 }}>
                      <span className="task-form-label">主持人</span>
                      <select value={formHostUserId} onChange={(e) => setFormHostUserId(e.target.value ? Number(e.target.value) : '')}>
                        <option value="">选择主持人</option>
                        {branchUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className="task-form-label">记录人</span>
                      <select value={formRecorderUserId} onChange={(e) => setFormRecorderUserId(e.target.value ? Number(e.target.value) : '')}>
                        <option value="">选择记录人</option>
                        {branchUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="archive-form-row">
                    <label style={{ flex: 1 }}>
                      <span className="task-form-label">应到人数</span>
                      <input type="number" min="0" placeholder="0" value={formExpected} onChange={(e) => setFormExpected(e.target.value)} />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className="task-form-label">实到人数</span>
                      <input type="number" min="0" placeholder="0" value={formActual} onChange={(e) => setFormActual(e.target.value)} />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className="task-form-label">缺席人数</span>
                      <input type="number" min="0" placeholder="0" value={formAbsent} onChange={(e) => setFormAbsent(e.target.value)} />
                    </label>
                  </div>

                  <label>
                    <span className="task-form-label">会议议题</span>
                    <input type="text" placeholder="多个议题用逗号分隔，如：学习党章、讨论发展党员" value={formTopics} onChange={(e) => setFormTopics(e.target.value)} />
                  </label>

                  <label>
                    <span className="task-form-label">会议地点</span>
                    <input type="text" placeholder="如：三楼会议室" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                  </label>
                </div>
              )}

              <label>
                <span className="task-form-label">{isTriOne(formCategory) ? '主要内容（会议记录）' : '内容'}</span>
                <textarea rows={isTriOne(formCategory) ? 6 : 5} placeholder={isTriOne(formCategory) ? '会议主要内容、发言摘要、决议事项等…' : '会议纪要、活动总结等…'} value={formContent} onChange={(e) => setFormContent(e.target.value)} />
              </label>

              <label>
                <span className="task-form-label">附件上传（可选，PDF/图片/Word）</span>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp" onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFormFile(f);
                  setFormFilePreview(f ? f.name : null);
                }} />
                {formFilePreview && !formFile && (
                  <p className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                    当前附件：{formFilePreview}（选择新文件以替换）
                  </p>
                )}
              </label>

              <div className="form-actions" style={{ marginTop: 12 }}>
                <button className="btn primary" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? '保存中…' : editingId ? '保存修改' : '创建归档'}
                </button>
                <button className="btn ghost" onClick={closeModal}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
