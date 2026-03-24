import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';

const leaveTypes = ['Normal Leave', 'Study / Exam Leave', 'Family Responsibility'] as const;

function calculateBusinessDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function RequestLeave() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [leaveType, setLeaveType] = useState<typeof leaveTypes[number]>('Normal Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const me = trpc.auth.me.useQuery();
  const createMutation = trpc.leave.create.useMutation();

  const totalDays = startDate && endDate ? calculateBusinessDays(startDate, endDate) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }
    if (totalDays < 1) {
      setError('Leave period must include at least 1 business day');
      return;
    }

    try {
      await createMutation.mutateAsync({ leaveType, startDate, endDate, totalDays, reason });
      setSuccess(true);
      utils.leave.myRequests.invalidate();
      utils.auth.me.invalidate();
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-800">Leave Request Submitted!</h2>
          <p className="text-green-600 mt-2">Your request has been sent for approval. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm">
        {/* Header matching the paper form */}
        <div className="text-center p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">Dr P Malatji</h1>
          <h2 className="text-lg font-semibold text-gray-700 mt-2">Leave Application Form</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          {/* Employee Info (auto-filled) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 font-medium">
                {me.data?.firstName || '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 font-medium">
                {me.data?.lastName || '—'}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-700 mb-4">Leave Application Details</h3>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Leave Type</label>
            <div className="space-y-2">
              {leaveTypes.map(type => (
                <label key={type} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  leaveType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="leaveType"
                    checked={leaveType === type}
                    onChange={() => setLeaveType(type)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-800">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Leave Period */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Leave Period</h3>
            <p className="text-xs text-gray-400 mb-3">Format: DD/MM/YYYY</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Leave To Begin</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Leave End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            {totalDays > 0 && (
              <div className="mt-3 text-center">
                <span className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold text-lg">
                  {totalDays} business day{totalDays > 1 ? 's' : ''}
                </span>
                {leaveType === 'Normal Leave' && me.data && (
                  <div className="text-xs text-gray-500 mt-1">
                    Annual balance: {me.data.leaveBalance} days | After: {me.data.leaveBalance - totalDays} days
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Brief reason for leave..."
            />
          </div>

          <div className="text-xs text-gray-400 border-t pt-4">
            This form must be completed and approved before the commencement of leave period.
            Please inform the administration department as soon as possible if there are any issues
            regarding the leave days available.
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || totalDays < 1}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
