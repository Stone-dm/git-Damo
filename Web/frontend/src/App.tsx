import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { BranchesPage } from './pages/BranchesPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { HomePage } from './pages/HomePage';
import { KnowledgePage } from './pages/KnowledgePage';
import { LoginPage } from './pages/LoginPage';
import { ResourceCenterPage } from './pages/ResourceCenterPage';
import { UsersPage } from './pages/UsersPage';
import { SilkTransitionProvider } from './transition/SilkTransition';

function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="boot">加载中…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <SilkTransitionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="workbench" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="resource-center" element={<ResourceCenterPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="exams" element={<Navigate to="/tasks" replace />} />
              <Route path="knowledge" element={<KnowledgePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SilkTransitionProvider>
    </AuthProvider>
  );
}
