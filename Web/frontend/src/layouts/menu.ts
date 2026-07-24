import type { Role } from '../api/types';

export interface MenuItem {
  path: string;
  label: string;
  roles: Role[];
}

export const MENU_ITEMS: MenuItem[] = [
  { path: '/', label: '工作台', roles: ['ADMIN', 'SECRETARY', 'MEMBER'] },
  { path: '/users', label: '用户管理', roles: ['ADMIN', 'SECRETARY'] },
  { path: '/branches', label: '支部管理', roles: ['ADMIN'] },
  { path: '/learning', label: '学习资料', roles: ['ADMIN', 'SECRETARY', 'MEMBER'] },
  { path: '/exams', label: '考试管理', roles: ['ADMIN', 'SECRETARY', 'MEMBER'] },
  { path: '/knowledge', label: '知识库', roles: ['ADMIN', 'SECRETARY', 'MEMBER'] },
  { path: '/recommend', label: '智能推荐', roles: ['ADMIN', 'SECRETARY', 'MEMBER'] },
  { path: '/assistant', label: '学习助手', roles: ['ADMIN', 'SECRETARY', 'MEMBER'] },
];

export function menusForRole(role: Role): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.roles.includes(role));
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: '系统管理员',
  SECRETARY: '支部书记',
  MEMBER: '普通党员',
};
