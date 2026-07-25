import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { listBranches } from '../../api/branches';
import { getMemberProfileByUserId, listMemberProfiles } from '../../api/member-profiles';
import type { BranchView, MemberProfileView } from '../../api/types';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const STATUS_LABEL: Record<string, string> = {
  FORMAL: '正式党员',
  PROBATIONARY: '预备党员',
  FLOATING: '流动党员',
};

export function ArchivePage() {
  const [members, setMembers] = useState<MemberProfileView[]>([]);
  const [branches, setBranches] = useState<BranchView[]>([]);
  const [filterBranch, setFilterBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // detail modal
  const [detail, setDetail] = useState<MemberProfileView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (branchId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMemberProfiles(
        branchId ? { branchId } : undefined,
      );
      setMembers(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
    try {
      const d = await getMemberProfileByUserId(userId);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>档案管理</h2>
      <p className="muted">查看和管理全体党员的详细档案信息</p>

      {/* filter bar */}
      <div className="archive-toolbar">
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
              <h3>{detail.userName} — 党员档案</h3>
              <button
                className="modal-close"
                onClick={() => setDetail(null)}
              >
                ✕
              </button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
