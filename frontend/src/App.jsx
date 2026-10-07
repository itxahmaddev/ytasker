import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Focus from './pages/Focus';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Tasks from './pages/Tasks';

function Loading() {
  return (
    <div className="page-loading" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// Start each route at the top and keep the tab title meaningful.
const TITLES = {
    '/login': 'Log in — Ytasker',
  '/signup': 'Create account — Ytasker',
  '/dashboard': 'Dashboard — Ytasker',
  '/tasks': 'Tasks — Ytasker',
  '/focus': 'Focus — Ytasker',
  '/profile': 'Profile — Ytasker',
  '/settings': 'Settings — Ytasker',
};

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLES[pathname] || 'Page not found — Ytasker';
  }, [pathname]);
  return null;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <RouteEffects />
      <Routes>
        <Route path="/" element={loading ? <Loading /> : <Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
