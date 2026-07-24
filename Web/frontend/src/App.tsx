import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

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
            <Route path="users" element={<PlaceholderPage />} />
            <Route path="branches" element={<PlaceholderPage />} />
            <Route path="learning" element={<PlaceholderPage />} />
            <Route path="exams" element={<PlaceholderPage />} />
            <Route path="knowledge" element={<PlaceholderPage />} />
            <Route path="recommend" element={<PlaceholderPage />} />
            <Route path="assistant" element={<PlaceholderPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
