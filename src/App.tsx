import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateReport } from './pages/CreateReport';
import { ReportDetail } from './pages/ReportDetail';
import { CreateTicket } from './pages/CreateTicket';
import { TicketDetail } from './pages/TicketDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/new"
        element={
          <ProtectedRoute>
            <CreateReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:reportId"
        element={
          <ProtectedRoute>
            <ReportDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute>
            <CreateTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:ticketId"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
