import { useState } from 'react';
import {
  Search, Shield, UserX, ChevronDown, Plus, X, Eye, EyeOff,
  Loader2, Copy, Check, GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { UserRole } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import {
  useAdminUsers,
  useUpdateUserRole,
  useCreateTeacher,
  type CreateTeacherInput,
} from '../../services/queries';

const roleColors: Record<UserRole, string> = {
  admin: 'text-red-600 bg-red-50 dark:bg-red-950',
  teacher: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  student: 'text-teal-600 bg-teal-50 dark:bg-teal-950',
  client: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
};

export default function AdminUsers() {
  const { data: users = [], isLoading: loading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);

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

  const teacherCount = users.filter(u => u.role === 'teacher').length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {users.length} registered · {teacherCount} {teacherCount === 1 ? 'teacher' : 'teachers'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateTeacher(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Teacher
        </button>
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
          <table className="w-full min-w-180">
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
                        <option value="teacher">Teacher</option>
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

      {showCreateTeacher && (
        <CreateTeacherModal onClose={() => setShowCreateTeacher(false)} />
      )}
    </div>
  );
}

/* ─── Create teacher modal ─────────────────────────────────────────── */

function CreateTeacherModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTeacher();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState<'creds' | null>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    const rand = new Uint32Array(12);
    crypto.getRandomValues(rand);
    for (let i = 0; i < 12; i++) out += chars[rand[i] % chars.length];
    setPassword(out);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Name, email, and a password of at least 8 characters are required.');
      return;
    }
    const payload: CreateTeacherInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      ...(title.trim() ? { title: title.trim() } : {}),
    };
    create.mutate(payload, {
      onSuccess: () => {
        setCreatedCreds({ email: payload.email, password: payload.password });
        toast.success('Teacher account created.');
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || 'Could not create teacher account.');
      },
    });
  };

  const copyCreds = async () => {
    if (!createdCreds) return;
    const text = `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}\nLogin: ${window.location.origin}/teacher/login`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied('creds');
      toast.success('Credentials copied');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Copy failed — select the text manually.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
              <GraduationCap size={18} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Add a teacher</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">They'll sign in at /teacher/login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {createdCreds ? (
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-xl">
              <Check size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-300">
                <p className="font-semibold mb-0.5">Account created.</p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Share these credentials with the teacher — they won't be shown again.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Email</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{createdCreds.email}</p>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Password</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{createdCreds.password}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={copyCreds}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
              >
                {copied === 'creds' ? <Check size={14} /> : <Copy size={14} />}
                Copy all
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Ada Lovelace"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ada@e-bringgs.ng"
                autoComplete="off"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
                >
                  Generate strong password
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                You'll share this with the teacher out-of-band. They can change it later.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Title <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {create.isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create teacher'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
