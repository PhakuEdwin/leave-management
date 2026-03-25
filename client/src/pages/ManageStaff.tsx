import { useState, useRef } from 'react';
import { trpc } from '../trpc';

export default function ManageStaff() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: '', password: '', firstName: '', lastName: '', email: '',
    role: 'staff' as 'admin' | 'staff', leaveBalance: 21, employeeTitle: '',
  });

  const [showNewTitle, setShowNewTitle] = useState(false);
  const [newTitleName, setNewTitleName] = useState('');
  const newTitleRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const staff = trpc.user.list.useQuery();
  const jobRoles = trpc.jobRole.list.useQuery();
  const createMutation = trpc.user.create.useMutation({ onSuccess: () => { utils.user.list.invalidate(); resetForm(); } });
  const updateMutation = trpc.user.update.useMutation({ onSuccess: () => { utils.user.list.invalidate(); resetForm(); } });
  const deleteMutation = trpc.user.delete.useMutation({ onSuccess: () => utils.user.list.invalidate() });
  const createJobTitle = trpc.jobRole.create.useMutation({
    onSuccess: (_data, variables) => {
      utils.jobRole.list.invalidate();
      setForm(f => ({ ...f, employeeTitle: variables.name }));
      setShowNewTitle(false);
      setNewTitleName('');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ username: '', password: '', firstName: '', lastName: '', email: '', role: 'staff', leaveBalance: 21, employeeTitle: '' });
  };

  const startEdit = (u: any) => {
    setEditId(u.id);
    setForm({ username: u.username, password: '', firstName: u.firstName, lastName: u.lastName, email: u.email || '', role: u.role, leaveBalance: u.leaveBalance, employeeTitle: u.employeeTitle || '' });
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="staff@example.com"
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
              <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
              {showNewTitle ? (
                <div className="flex gap-2">
                  <input
                    ref={newTitleRef}
                    type="text"
                    value={newTitleName}
                    onChange={e => setNewTitleName(e.target.value)}
                    placeholder="Enter new job title"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTitleName.trim()) createJobTitle.mutate({ name: newTitleName.trim() }); } }}
                  />
                  <button
                    type="button"
                    onClick={() => { if (newTitleName.trim()) createJobTitle.mutate({ name: newTitleName.trim() }); }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                  >Save</button>
                  <button
                    type="button"
                    onClick={() => { setShowNewTitle(false); setNewTitleName(''); }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                  >Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={form.employeeTitle}
                    onChange={e => setForm(f => ({ ...f, employeeTitle: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Job Title --</option>
                    {(jobRoles.data as any[] || []).map((r: any) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewTitle(true)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm whitespace-nowrap"
                  >+ New</button>
                </div>
              )}
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
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Job Title</th>
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
                <td className="px-4 py-3 text-sm text-gray-600">{u.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.employeeTitle || '-'}</td>
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
