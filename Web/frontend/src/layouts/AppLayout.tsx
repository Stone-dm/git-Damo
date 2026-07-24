import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { menusForRole, ROLE_LABEL } from './menu';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (!user) {
    return null;
  }

  const menus = menusForRole(user.role);

  return (
    <div className="app-shell">
      <header className={`topbar ${isHome ? 'topbar-transparent' : 'topbar-solid'}`}>
        <span className="brand">党校学习系统</span>
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
        <div className="user-area">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{ROLE_LABEL[user.role]}</span>
          <button type="button" className="btn ghost" onClick={logout}>
            退出登录
          </button>
        </div>
      </header>
      <main className={`content${isHome ? '' : ' content-page'}`}>
        <Outlet />
      </main>
    </div>
  );
}
