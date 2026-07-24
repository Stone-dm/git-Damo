export type Role = 'ADMIN' | 'SECRETARY' | 'MEMBER';

export interface UserView {
  id: number;
  username: string;
  name: string;
  role: Role;
  branchId: number | null;
}

export interface LoginResponse {
  token: string;
  user: UserView;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
