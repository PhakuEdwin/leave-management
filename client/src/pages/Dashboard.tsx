import { useAuth } from '../auth';
import { trpc } from '../trpc';
import { Link } from 'react-router-dom';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const me = trpc.auth.me.useQuery();
  const myRequests = trpc.leave.myRequests.useQuery();
  const pendingCount = trpc.leave.pendingCount.useQuery(undefined, { enabled: isAdmin });

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {me.data?.firstName || user?.firstName} {me.data?.lastName || user?.lastName}
        </h1>
        <p className="text-gray-500 mt-1">Staff Leave Management System</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500">Leave Balance <span className="text-gray-400">(per year)</span></div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{me.data?.leaveBalance ?? '—'}</div>
          <div className="text-sm text-gray-400">days remaining ({new Date().getFullYear()})</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500">My Requests ({new Date().getFullYear()})</div>
          <div className="text-3xl font-bold text-gray-800 mt-1">{myRequests.data?.length ?? 0}</div>
          <div className="text-sm text-gray-400">total this year</div>
        </div>
        {isAdmin && (
          <Link to="/admin/requests" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500">Pending Approval</div>
            <div className="text-3xl font-bold text-orange-500 mt-1">{pendingCount.data ?? 0}</div>
            <div className="text-sm text-gray-400">click to review</div>
          </Link>
        )}
        {!isAdmin && (
          <Link to="/request" className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-white">
            <div className="text-sm text-blue-100">Quick Action</div>
            <div className="text-xl font-bold mt-1">Request Leave</div>
            <div className="text-sm text-blue-200 mt-1">Submit a new request →</div>
          </Link>
        )}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">My Recent Requests</h2>
        </div>
        {!myRequests.data?.length ? (
          <div className="p-8 text-center text-gray-400">No leave requests yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(myRequests.data as any[]).slice(0, 10).map((req: any) => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <span className="font-medium text-gray-800">{req.leaveType}</span>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {formatDate(req.startDate)} — {formatDate(req.endDate)} · {req.totalDays} day{req.totalDays > 1 ? 's' : ''}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status]}`}>
                  {req.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
