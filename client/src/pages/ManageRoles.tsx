import { useState } from 'react';
import { trpc } from '../trpc';

export default function ManageRoles() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const utils = trpc.useUtils();
  const roles = trpc.jobRole.list.useQuery();
  const createMutation = trpc.jobRole.create.useMutation({
    onSuccess: () => { utils.jobRole.list.invalidate(); resetForm(); },
    onError: (err) => setError(err.message),
  });
  const updateMutation = trpc.jobRole.update.useMutation({
    onSuccess: () => { utils.jobRole.list.invalidate(); resetForm(); },
    onError: (err) => setError(err.message),
  });
  const deleteMutation = trpc.jobRole.delete.useMutation({
    onSuccess: () => utils.jobRole.list.invalidate(),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName('');
    setError('');
  };

  const startEdit = (role: any) => {
    setEditId(role.id);
    setName(role.name);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, name });
    } else {
      await createMutation.mutateAsync({ name });
    }
  };

  const handleDelete = (id: number, roleName: string) => {
    if (confirm(`Delete role "${roleName}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Job Roles</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          + Add Role
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editId ? 'Edit' : 'Add'} Job Role</h2>
          {error && <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Role Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Guardian, Cook, Receptionist"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
              {editId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors">
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role Name</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(roles.data as any[] || []).length === 0 ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">No job roles yet. Add one to get started.</td></tr>
            ) : (
              (roles.data as any[] || []).map((role: any) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{role.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(role)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Edit</button>
                    <button onClick={() => handleDelete(role.id, role.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
