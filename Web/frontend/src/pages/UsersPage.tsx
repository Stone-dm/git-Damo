import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { createUser, deleteUser, listUsers } from '../api/users';
import type { Role, UserView } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../layouts/menu';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function UsersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listUsers());
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
      const parsedBranch =
        branchId.trim() === '' ? null : Number(branchId.trim());
      await createUser({
        username: username.trim(),
        password,
        name: name.trim(),
        role: user?.role === 'SECRETARY' ? 'MEMBER' : role,
        branchId:
          user?.role === 'SECRETARY'
            ? (user.branchId ?? null)
            : parsedBranch,
      });
      setUsername('');
      setPassword('');
      setName('');
      setRole('MEMBER');
      setBranchId('');
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('确认删除该用户？')) return;
    setError(null);
    try {
      await deleteUser(id);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  const canPickRole = user?.role === 'ADMIN';

  return (
    <div className="page">
      <h2>用户管理</h2>
      <p className="muted">查看与维护系统用户（按角色权限过滤）。</p>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="panel">
        <h3>新建用户</h3>
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            用户名
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label>
            姓名
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          {canPickRole ? (
            <label>
              角色
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SECRETARY">SECRETARY</option>
                <option value="MEMBER">MEMBER</option>
              </select>
            </label>
          ) : (
            <label>
              角色
              <input value="MEMBER" disabled />
            </label>
          )}
          {canPickRole ? (
            <label>
              支部 ID（ADMIN 可空）
              <input
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                placeholder="例如 1"
              />
            </label>
          ) : null}
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? '提交中…' : '创建'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>用户列表</h3>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted">暂无用户</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>支部</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.name}</td>
                    <td>
                      {ROLE_LABEL[u.role]} / {u.role}
                    </td>
                    <td>{u.branchId ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost danger"
                        onClick={() => void onDelete(u.id)}
                      >
                        删除
                      </button>
                    </td>
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
