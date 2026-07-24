import { useAuth } from '../auth/AuthContext';
import { menusForRole, ROLE_LABEL } from '../layouts/menu';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const menus = menusForRole(user.role);

  return (
    <div className="page">
      <h2>工作台</h2>
      <p className="muted">
        欢迎，{user.name}（{ROLE_LABEL[user.role]} / {user.role}）
      </p>
      <div className="panel">
        <h3>当前角色可见菜单</h3>
        <ul className="menu-preview">
          {menus.map((item) => (
            <li key={item.path}>
              {item.label}
              <span className="path">{item.path}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel meta">
        <div>
          <span className="label">用户名</span>
          <span>{user.username}</span>
        </div>
        <div>
          <span className="label">支部 ID</span>
          <span>{user.branchId ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
