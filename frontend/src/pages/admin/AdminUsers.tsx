import { useState } from 'react';
import { Search, Shield, UserCheck, UserX, ChevronDown } from 'lucide-react';
import type { UserRole } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useAdminUsers, useUpdateUserRole } from '../../services/queries';

const roleColors: Record<UserRole, string> = {
  admin: 'text-red-600 bg-red-50 dark:bg-red-950',
  student: 'text-teal-600 bg-teal-50 dark:bg-teal-950',
  client: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
};

export default function AdminUsers() {
  const { data: users = [], isLoading: loading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const changeRole = (userId: string, role: UserRole) => {
    setUpdatingId(userId);
    updateRole.mutate(
      { userId, role },
      { onSettled: () => setUpdatingId(null) },
    );
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm dark:bg-slate-800 dark:text-white" />
      </div>

      {loading ? <PageLoader /> : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-300 font-bold text-sm shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[user.role]}`}>
                      <Shield size={11} /> {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={e => changeRole(user.id, e.target.value as UserRole)}
                        className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-700 dark:text-white focus:border-teal-500 outline-none cursor-pointer bg-white dark:bg-slate-800 disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <UserX size={32} className="mx-auto text-gray-200 dark:text-slate-700 mb-2" />
              <p className="text-gray-400 dark:text-slate-500 text-sm">No users match your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
