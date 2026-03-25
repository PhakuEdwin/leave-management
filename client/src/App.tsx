import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RequestLeave from './pages/RequestLeave';
import Calendar from './pages/Calendar';
import AdminRequests from './pages/AdminRequests';
import ManageStaff from './pages/ManageStaff';
import ManageRoles from './pages/ManageRoles';
import { trpc } from './trpc';

function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const pendingCount = trpc.leave.pendingCount.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30000 });

  if (!user) return null;

  const navLink = (to: string, label: string, badge?: number) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
        location.pathname === to
          ? 'bg-white/20 text-white'
          : 'text-blue-100 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
      {badge && badge > 0 ? (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <span className="text-white font-bold text-lg">Staff Leave</span>
              <span className="text-blue-200 text-xs ml-2 hidden sm:inline">Dr P Malatji</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {navLink('/', 'Dashboard')}
            {navLink('/request', 'Request Leave')}
            {navLink('/calendar', 'Calendar')}
            {isAdmin && navLink('/admin/requests', 'Requests', pendingCount.data)}
            {isAdmin && navLink('/admin/staff', 'Staff')}
            {isAdmin && navLink('/admin/roles', 'Job Titles')}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-blue-200 text-sm hidden md:block">
              {user.firstName} {user.lastName}
              <span className="text-blue-300 text-xs ml-1">({user.role})</span>
            </span>
            <button onClick={logout} className="text-blue-200 hover:text-white text-sm px-3 py-1 border border-blue-400 rounded hover:bg-white/10 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/request" element={<ProtectedRoute><RequestLeave /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
            <Route path="/admin/staff" element={<AdminRoute><ManageStaff /></AdminRoute>} />
            <Route path="/admin/roles" element={<AdminRoute><ManageRoles /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
