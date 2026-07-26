import { useCallback, useEffect, useState } from 'react';
import { ApiError, getToken } from '../../api/client';
import { listBranches } from '../../api/branches';
import { getMemberProfileByUserId, listMemberDocuments, listMemberProfiles, uploadMemberDocument, deleteMemberDocument } from '../../api/member-profiles';
import type { BranchView, DocType, MemberDocumentView, MemberProfileView } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const STATUS_LABEL: Record<string, string> = {
  FORMAL: '正式党员',
  PROBATIONARY: '预备党员',
  FLOATING: '流动党员',
};

const DOC_TYPE_LABEL: Record<string, string> = {
  APPLICATION: '入党申请书',
  TALK_RECORD: '谈话记录',
  THOUGHT_REPORT: '思想汇报',
  CULTIVATION_FORM: '培养考察表',
  TRAINING_CERT: '党校结业证书',
  POLITICAL_REVIEW: '政治审查材料',
  AUTOBIOGRAPHY: '个人自传',
  PUBLIC_NOTICE: '公示材料',
  VOLUNTEER_FORM: '入党志愿书',
  PROBATION_REPORT: '预备期思想汇报',
  PROBATION_FORM: '预备党员考察鉴定表',
  CONVERSION_APPLICATION: '转正申请书',
};

interface StageGroup {
  label: string;
  icon: string;
  color: string;
  docTypes: DocType[];
}

const STAGE_GROUPS: StageGroup[] = [
  {
    label: '入党申请人阶段',
    icon: '📝',
    color: '#3b82f6',
    docTypes: ['APPLICATION', 'TALK_RECORD'],
  },
  {
    label: '入党积极分子阶段',
    icon: '🌱',
    color: '#22c55e',
    docTypes: ['THOUGHT_REPORT', 'CULTIVATION_FORM', 'TRAINING_CERT'],
  },
  {
    label: '发展对象阶段',
    icon: '🔍',
    color: '#f59e0b',
    docTypes: ['POLITICAL_REVIEW', 'AUTOBIOGRAPHY', 'PUBLIC_NOTICE'],
  },
  {
    label: '预备党员阶段',
    icon: '⭐',
    color: '#8b5cf6',
    docTypes: ['VOLUNTEER_FORM', 'PROBATION_REPORT', 'PROBATION_FORM'],
  },
  {
    label: '正式党员阶段',
    icon: '🏅',
    color: '#ef4444',
    docTypes: ['CONVERSION_APPLICATION'],
  },
];

export function ArchivePage() {
  const { user } = useAuth();
  const isSecretary = user?.role === 'SECRETARY';
  const canManage = user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const [members, setMembers] = useState<MemberProfileView[]>([]);
  const [branches, setBranches] = useState<BranchView[]>([]);
  const [filterBranch, setFilterBranch] = useState<number | null>(
    () => (user?.role === 'SECRETARY' ? user.branchId : null),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // detail modal
  const [detail, setDetail] = useState<MemberProfileView | null>(null);
  const [detailDocs, setDetailDocs] = useState<MemberDocumentView[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUserId, setUploadUserId] = useState<number | null>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = useCallback(async (branchId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMemberProfiles(
        branchId != null ? { branchId } : undefined,
      );
      setMembers(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSecretary && user?.branchId != null) {
      setFilterBranch(user.branchId);
    }
  }, [isSecretary, user?.branchId]);

  useEffect(() => {
    load(filterBranch);
  }, [load, filterBranch]);

  useEffect(() => {
    listBranches()
      .then(setBranches)
      .catch(() => {});
  }, []);

  const openDetail = async (userId: number) => {
    setDetailLoading(true);
    setDetail(null);
    setDetailDocs([]);
    try {
      const [d, docs] = await Promise.all([
        getMemberProfileByUserId(userId),
        listMemberDocuments(userId),
      ]);
      setDetail(d);
      setDetailDocs(docs);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadDoc = (userId: number, docId: number) => {
    const token = getToken();
    const downloadUrl = `/api/member-profiles/${userId}/documents/${docId}/file?token=${encodeURIComponent(token ?? '')}`;
    window.open(downloadUrl, '_blank');
  };

  const openUploadModal = (userId: number) => {
    setUploadUserId(userId);
    setUploadDocType('');
    setUploadTitle('');
    setUploadFile(null);
    setUploadError(null);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!uploadUserId || !uploadDocType || !uploadTitle.trim() || !uploadFile) return;
    setUploadSaving(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('docType', uploadDocType);
      fd.append('title', uploadTitle.trim());
      fd.append('file', uploadFile);
      await uploadMemberDocument(uploadUserId, fd);
      setShowUploadModal(false);
      // refresh documents if detail is still open
      if (detail && detail.userId === uploadUserId) {
        const docs = await listMemberDocuments(uploadUserId);
        setDetailDocs(docs);
      }
    } catch (err) {
      setUploadError(errMsg(err));
    } finally {
      setUploadSaving(false);
    }
  };

  const handleDeleteDoc = async (userId: number, docId: number) => {
    if (!window.confirm('确定删除该档案材料？此操作不可撤销。')) return;
    try {
      await deleteMemberDocument(userId, docId);
      const docs = await listMemberDocuments(userId);
      setDetailDocs(docs);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page">
      <h2>档案管理</h2>
      <p className="muted">
        {isSecretary
          ? '查看和管理本支部党员的详细档案信息'
          : '查看和管理全体党员的详细档案信息'}
      </p>

      {/* filter bar */}
      <div className="archive-toolbar">
        {isSecretary ? (
          <span className="archive-filter-label">本支部档案</span>
        ) : (
          <label>
            <span className="archive-filter-label">按支部筛选：</span>
            <select
              value={filterBranch ?? ''}
              onChange={(e) =>
                setFilterBranch(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">全部支部</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          共 {members.length} 人
        </span>
      </div>

      {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* member list */}
      <div className="panel" style={{ marginTop: 12 }}>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : members.length === 0 ? (
          <p className="muted">暂无党员档案数据</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>支部</th>
                  <th>党员状态</th>
                  <th>性别</th>
                  <th>民族</th>
                  <th>学历</th>
                  <th>入党时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId}>
                    <td className="archive-name-cell">{m.userName}</td>
                    <td>{m.branchName || '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          m.memberStatus === 'FORMAL'
                            ? 'status-open'
                            : m.memberStatus === 'FLOATING'
                              ? 'status-pending'
                              : 'status-draft'
                        }`}
                      >
                        {m.memberStatus
                          ? STATUS_LABEL[m.memberStatus]
                          : '—'}
                      </span>
                    </td>
                    <td>{m.gender === 'MALE' ? '男' : m.gender === 'FEMALE' ? '女' : '—'}</td>
                    <td>{m.ethnicity || '—'}</td>
                    <td>{m.education || '—'}</td>
                    <td>{m.joinDate || '—'}</td>
                    <td>
                      <button
                        className="btn ghost"
                        style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                        onClick={() => openDetail(m.userId)}
                      >
                        查看档案
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* detail modal overlay */}
      {detailLoading && (
        <div className="modal-overlay" onClick={() => setDetailLoading(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="muted">加载中…</p>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-card member-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {detail.userName} — 党员档案
                <span className="muted" style={{ fontSize: '0.82rem', fontWeight: 400, marginLeft: 10 }}>
                  （档案材料 {detailDocs.length}/12）
                </span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {canManage && (
                  <button
                    className="btn ghost"
                    style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                    onClick={() => openUploadModal(detail.userId)}
                    title="上传材料"
                  >
                    📎 上传材料
                  </button>
                )}
                <button
                  className="modal-close"
                  onClick={() => setDetail(null)}
                >
                  ✕
                </button>
              </div>
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
                    <span className="detail-value">
                      {detail.gender === 'MALE' ? '男' : detail.gender === 'FEMALE' ? '女' : '—'}
                    </span>
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
                      {detail.memberStatus
                        ? STATUS_LABEL[detail.memberStatus]
                        : '—'}
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
                  {detail.memberStatus === 'FLOATING' && (
                    <div className="detail-item">
                      <span className="detail-label">流入地</span>
                      <span className="detail-value">
                        {detail.floatingLocation || '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

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

              {/* 档案材料 */}
              <div className="detail-section">
                <h4 className="detail-section-title">档案材料</h4>
                {STAGE_GROUPS.map((stage) => {
                  const stageDocs = detailDocs.filter((d) =>
                    stage.docTypes.includes(d.docType as DocType),
                  );
                  const stageEmpty = stageDocs.length === 0;
                  return (
                    <div key={stage.label} className={`doc-stage ${stageEmpty ? 'doc-stage-empty' : ''}`}>
                      <div className="doc-stage-header" style={{ borderLeftColor: stage.color }}>
                        <span className="doc-stage-icon">{stage.icon}</span>
                        <span className="doc-stage-label">{stage.label}</span>
                        {stageEmpty && (
                          <span className="doc-stage-empty-hint">该阶段暂无材料</span>
                        )}
                      </div>
                      <div className="doc-stage-items">
                        {stage.docTypes.map((dt) => {
                          const docsOfType = stageDocs.filter((d) => d.docType === dt);
                          const hasDoc = docsOfType.length > 0;
                          return (
                            <div
                              key={dt}
                              className={`doc-type-row ${hasDoc ? 'has-doc' : 'no-doc'}`}
                              onClick={() => {
                                if (hasDoc) handleDownloadDoc(detail.userId, docsOfType[0].id);
                              }}
                            >
                              <span className="doc-type-check">
                                {hasDoc ? '✅' : '⬜'}
                              </span>
                              <span className="doc-type-name">
                                {DOC_TYPE_LABEL[dt] ?? dt}
                              </span>
                              {hasDoc ? (
                                <>
                                  <span className="doc-type-file">
                                    {docsOfType[0].fileName}
                                    <span className="doc-type-time">{docsOfType[0].uploadedAt}</span>
                                  </span>
                                  {canManage && (
                                    <button
                                      className="btn ghost doc-delete-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDoc(detail.userId, docsOfType[0].id);
                                      }}
                                      title="删除材料"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="doc-type-missing">未上传</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== upload document modal ======== */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploadSaving && setShowUploadModal(false)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上传档案材料</h3>
              <button
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
                disabled={uploadSaving}
              >
                ✕
              </button>
            </div>
            <div className="member-detail-body">
              {uploadError && (
                <div className="form-error" style={{ marginBottom: 12 }}>{uploadError}</div>
              )}
              <div className="form-grid">
                <label className="span-2">
                  材料类型
                  <select
                    value={uploadDocType}
                    onChange={(e) => {
                      setUploadDocType(e.target.value);
                      if (!uploadTitle) {
                        setUploadTitle(DOC_TYPE_LABEL[e.target.value] ?? '');
                      }
                    }}
                  >
                    <option value="">请选择材料类型</option>
                    {STAGE_GROUPS.map((stage) => (
                      <optgroup key={stage.label} label={`${stage.icon} ${stage.label}`}>
                        {stage.docTypes.map((dt) => (
                          <option key={dt} value={dt}>
                            {DOC_TYPE_LABEL[dt]}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  材料标题
                  <input
                    type="text"
                    placeholder="如：2024年度思想汇报"
                    maxLength={200}
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </label>
                <label className="span-2">
                  选择文件
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setUploadFile(f);
                      if (f && !uploadTitle) {
                        const name = f.name.replace(/\.[^.]+$/, '');
                        setUploadTitle(name);
                      }
                    }}
                  />
                </label>
                {uploadFile && (
                  <div className="muted" style={{ fontSize: '0.82rem', gridColumn: '1 / -1' }}>
                    已选择：{uploadFile.name}（{(uploadFile.size / 1024).toFixed(1)} KB）
                  </div>
                )}
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="btn ghost"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadSaving}
                >
                  取消
                </button>
                <button
                  className="btn primary"
                  onClick={handleUpload}
                  disabled={uploadSaving || !uploadDocType || !uploadTitle.trim() || !uploadFile}
                >
                  {uploadSaving ? '上传中…' : '确认上传'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
