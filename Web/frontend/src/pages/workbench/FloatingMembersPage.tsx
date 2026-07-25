import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { listFloatingMembers } from '../../api/member-profiles';
import type { MemberProfileView } from '../../api/types';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function FloatingMembersPage() {
  const [members, setMembers] = useState<MemberProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listFloatingMembers();
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) setError(errMsg(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <h2>流动党员管理</h2>
      <p className="muted">管理和查看所有处于流动状态的党员信息</p>

      {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="panel" style={{ marginTop: 12 }}>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : members.length === 0 ? (
          <p className="muted">暂无流动党员</p>
        ) : (
          <>
            <div className="archive-toolbar">
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                共 {members.length} 名流动党员
              </span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>原属支部</th>
                    <th>性别</th>
                    <th>民族</th>
                    <th>学历</th>
                    <th>手机号</th>
                    <th>流入地</th>
                    <th>入党时间</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.userId}>
                      <td className="archive-name-cell">{m.userName}</td>
                      <td>{m.branchName || '—'}</td>
                      <td>{m.gender === 'MALE' ? '男' : m.gender === 'FEMALE' ? '女' : '—'}</td>
                      <td>{m.ethnicity || '—'}</td>
                      <td>{m.education || '—'}</td>
                      <td>{m.phone || '—'}</td>
                      <td>{m.floatingLocation || '—'}</td>
                      <td>{m.joinDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
