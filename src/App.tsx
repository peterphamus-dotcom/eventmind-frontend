import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './Toast';
import { ThemeProvider } from './ThemeContext';
import { LowDataProvider } from './LowDataContext';
import { BannerBar } from './components/BannerBar';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { ThemeToggle } from './components/ThemeToggle';
import { LowDataToggle } from './components/LowDataToggle';
import { LowDataBanner } from './components/LowDataBanner';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { VerifyEmail } from './pages/VerifyEmail';
import { AcceptInvite } from './pages/AcceptInvite';
import { JoinViaQr } from './pages/JoinViaQr';
import { EventSelector } from './pages/EventSelector';
import { Dashboard } from './pages/Dashboard';
import { CreateReport } from './pages/CreateReport';
import { ReportDetail } from './pages/ReportDetail';
import { CreateTicket } from './pages/CreateTicket';
import { TicketDetail } from './pages/TicketDetail';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { ScheduleDetail } from './pages/ScheduleDetail';
import { Messages } from './pages/Messages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <BannerBar />}
      <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/join/:token" element={<JoinViaQr />} />
      <Route
        path="/select-event"
        element={
          <ProtectedRoute>
            <EventSelector />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Reports and tickets lists now live as tabs on the dashboard */}
      <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
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
      <Route path="/tickets" element={<Navigate to="/dashboard" replace />} />
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
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:userId"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule/:itemId"
        element={
          <ProtectedRoute>
            <ScheduleDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {user && <ScrollToTopButton />}
      <ThemeToggle />
      <LowDataToggle />
      <LowDataBanner />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LowDataProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </LowDataProvider>
    </ThemeProvider>
  );
}

export default App;
