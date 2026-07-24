import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import {
  createBranch,
  deleteBranch,
  listBranches,
} from '../api/branches';
import type { BranchView } from '../api/types';
import { useAuth } from '../auth/AuthContext';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function BranchesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BranchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canWrite = user?.role === 'ADMIN';

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listBranches());
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createBranch({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('确认删除该支部？')) return;
    setError(null);
    try {
      await deleteBranch(id);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <div className="page">
      <h2>支部管理</h2>
      <p className="muted">管理系统支部信息（仅管理员可写）。</p>

      {error ? <div className="form-error">{error}</div> : null}

      {canWrite ? (
        <div className="panel">
          <h3>新建支部</h3>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              名称
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="span-2">
              描述
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={submitting}
              >
                {submitting ? '提交中…' : '创建'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="panel">
        <h3>支部列表</h3>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted">暂无支部</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名称</th>
                  <th>描述</th>
                  {canWrite ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.name}</td>
                    <td>{b.description || '—'}</td>
                    {canWrite ? (
                      <td>
                        <button
                          type="button"
                          className="btn ghost danger"
                          onClick={() => void onDelete(b.id)}
                        >
                          删除
                        </button>
                      </td>
                    ) : null}
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
