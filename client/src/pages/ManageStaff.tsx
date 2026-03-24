import { useState } from 'react';
import { trpc } from '../trpc';

export default function ManageStaff() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: '', password: '', firstName: '', lastName: '',
    role: 'staff' as 'admin' | 'staff', leaveBalance: 21,
  });

  const utils = trpc.useUtils();
  const staff = trpc.user.list.useQuery();
  const createMutation = trpc.user.create.useMutation({ onSuccess: () => { utils.user.list.invalidate(); resetForm(); } });
  const updateMutation = trpc.user.update.useMutation({ onSuccess: () => { utils.user.list.invalidate(); resetForm(); } });
  const deleteMutation = trpc.user.delete.useMutation({ onSuccess: () => utils.user.list.invalidate() });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ username: '', password: '', firstName: '', lastName: '', role: 'staff', leaveBalance: 21 });
  };

  const startEdit = (u: any) => {
    setEditId(u.id);
    setForm({ username: u.username, password: '', firstName: u.firstName, lastName: u.lastName, role: u.role, leaveBalance: u.leaveBalance });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      const { username: _u, ...rest } = form;
      await updateMutation.mutateAsync({ id: editId, ...rest, password: rest.password || undefined });
    } else {
      await createMutation.mutateAsync(form);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete ${name}? This will also delete all their leave requests.`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Staff</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          + Add Staff Member
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editId ? 'Edit' : 'Add'} Staff Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                disabled={!!editId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required={!editId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password {editId && <span className="text-gray-400">(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required={!editId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'staff' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Leave Balance (days)</label>
              <input
                type="number"
                value={form.leaveBalance}
                onChange={e => setForm(f => ({ ...f, leaveBalance: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                {editId ? 'Update' : 'Create'} Staff Member
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Username</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Leave Balance</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(staff.data as any[] || []).map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-800">{u.leaveBalance}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(u)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Edit</button>
                  <button onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
