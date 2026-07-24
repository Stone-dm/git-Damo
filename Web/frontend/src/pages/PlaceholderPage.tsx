import { useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../layouts/menu';

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const item = MENU_ITEMS.find((m) => m.path === pathname);
  const title = item?.label ?? '页面';

  return (
    <div className="page">
      <h2>{title}</h2>
      <p className="muted">占位页面，Task 10 将接入实际业务功能。</p>
    </div>
  );
}
