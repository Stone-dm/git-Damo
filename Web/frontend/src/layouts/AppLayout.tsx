import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { menusForRole, ROLE_LABEL } from './menu';

export function AppLayout() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const menus = menusForRole(user.role);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">党校学习系统</div>
        <nav className="nav">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{ROLE_LABEL[user.role]}</span>
          </div>
          <button type="button" className="btn ghost" onClick={logout}>
            退出登录
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
