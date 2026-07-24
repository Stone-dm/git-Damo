import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { AssistantPage } from './pages/AssistantPage';
import { BranchesPage } from './pages/BranchesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamsPage } from './pages/ExamsPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { LearningPage } from './pages/LearningPage';
import { LoginPage } from './pages/LoginPage';
import { RecommendPage } from './pages/RecommendPage';
import { UsersPage } from './pages/UsersPage';

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="learning" element={<LearningPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="recommend" element={<RecommendPage />} />
            <Route path="assistant" element={<AssistantPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
