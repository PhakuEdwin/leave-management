import { useState } from 'react';
import { trpc } from '../trpc';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

const statusTabs = ['pending', 'approved', 'declined', 'all'] as const;

export default function AdminRequests() {
  const [tab, setTab] = useState<typeof statusTabs[number]>('pending');
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const utils = trpc.useUtils();
  const requests = trpc.leave.all.useQuery({ status: tab });
  const processMutation = trpc.leave.process.useMutation({
    onSuccess: () => {
      utils.leave.all.invalidate();
      utils.leave.pendingCount.invalidate();
      setDeclineId(null);
      setDeclineReason('');
    },
  });

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' });
  };

  const handleApprove = (id: number) => {
    processMutation.mutate({ id, status: 'approved' });
  };

  const handleDecline = (id: number) => {
    processMutation.mutate({ id, status: 'declined', declineReason });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Leave Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
        {statusTabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {!requests.data?.length ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
            No {tab === 'all' ? '' : tab} requests
          </div>
        ) : (
          (requests.data as any[]).map((req: any) => (
            <div key={req.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${statusColors[req.status]} overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {req.firstName} {req.lastName}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status]}`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <div className="font-medium text-gray-800">{req.leaveType}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">From:</span>
                    <div className="font-medium text-gray-800">{formatDate(req.startDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>
                    <div className="font-medium text-gray-800">{formatDate(req.endDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Days:</span>
                    <div className="font-medium text-gray-800">{req.totalDays}</div>
                  </div>
                </div>

                {req.reason && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="text-gray-500">Reason:</span> {req.reason}
                  </div>
                )}

                {req.status === 'declined' && req.declineReason && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                    <span className="font-medium">Decline reason:</span> {req.declineReason}
                  </div>
                )}

                {req.processedByFirstName && (
                  <div className="mt-2 text-xs text-gray-400">
                    Processed by {req.processedByFirstName} {req.processedByLastName}
                    {req.processedAt && ` on ${new Date(req.processedAt).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })}`}
                  </div>
                )}

                {/* Action buttons for pending */}
                {req.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={processMutation.isPending}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    {declineId === req.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={declineReason}
                          onChange={e => setDeclineReason(e.target.value)}
                          placeholder="Reason for declining..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleDecline(req.id)}
                          disabled={processMutation.isPending}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => { setDeclineId(null); setDeclineReason(''); }}
                          className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeclineId(req.id)}
                        className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors"
                      >
                        ✕ Decline
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
