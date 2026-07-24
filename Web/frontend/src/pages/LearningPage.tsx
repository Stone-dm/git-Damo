import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { listLearning } from '../api/learning';
import type { LearningView } from '../api/types';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function LearningPage() {
  const [items, setItems] = useState<LearningView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listLearning();
        if (!cancelled) setItems(data);
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
      <h2>学习资料</h2>
      <p className="muted">按角色可见范围展示学习内容。</p>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="panel">
        {loading ? (
          <p className="muted">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted">暂无学习资料</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>摘要</th>
                  <th>支部</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>{item.summary || '—'}</td>
                    <td>{item.branchId ?? '全局'}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
