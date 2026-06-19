import { useState, useEffect } from 'react';
import { Mail, Clock, Tag, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { PageLoader, EmptyState } from '@ebringgs/ui';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  serviceId: string | null;
  serviceName: string | null;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'closed';
}

const statusConfig = {
  new:       { label: 'New',       icon: Clock,        color: 'text-amber-600 bg-amber-50' },
  contacted: { label: 'Contacted', icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' },
  closed:    { label: 'Closed',    icon: XCircle,      color: 'text-gray-500 bg-gray-100' },
};

type FilterStatus = 'all' | 'new' | 'contacted' | 'closed';

export default function AdminServiceRequests() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/inquiries');
      setInquiries(data.data.inquiries);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInquiries(); }, []);

  const updateStatus = async (id: string, status: Inquiry['status']) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/inquiries/${id}/status`, { status });
      setInquiries(prev => prev.map(inq => inq._id === id ? { ...inq, status } : inq));
    } catch {
      // If API fails (e.g. placeholder data), still update local state for UX
      setInquiries(prev => prev.map(inq => inq._id === id ? { ...inq, status } : inq));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);
  const newCount = inquiries.filter(i => i.status === 'new').length;

  const filters: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: `All (${inquiries.length})` },
    { id: 'new', label: `New (${newCount})` },
    { id: 'contacted', label: `Contacted (${inquiries.filter(i => i.status === 'contacted').length})` },
    { id: 'closed', label: `Closed (${inquiries.filter(i => i.status === 'closed').length})` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Requests</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {newCount > 0 ? `${newCount} new ${newCount === 1 ? 'inquiry' : 'inquiries'} awaiting response` : 'All inquiries reviewed'}
          </p>
        </div>
        <button onClick={loadInquiries} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-5 w-fit">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.id ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={Mail} title="No inquiries found" description="Inquiries submitted via the Services page will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => {
            const cfg = statusConfig[inq.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expanded === inq._id;
            const isUpdating = updatingId === inq._id;

            return (
              <div key={inq._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : inq._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm shrink-0">
                      {inq.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{inq.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Mail size={11} /> {inq.email}</span>
                        {inq.serviceName && (
                          <span className="flex items-center gap-1"><Tag size={11} /> {inq.serviceName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                      <StatusIcon size={11} /> {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600 text-lg select-none">{isExpanded ? '−' : '+'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 dark:border-slate-800 pt-4">
                    <p className="text-sm text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950 rounded-xl p-4 mb-4 leading-relaxed">{inq.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={`mailto:${inq.email}?subject=Re: Your E-Bringgs inquiry`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                        <Mail size={14} /> Reply via email
                      </a>
                      {inq.status !== 'contacted' && (
                        <button disabled={isUpdating} onClick={() => updateStatus(inq._id, 'contacted')}
                          className="px-4 py-2 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-medium rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 disabled:opacity-50 transition-colors">
                          {isUpdating ? 'Saving…' : 'Mark as contacted'}
                        </button>
                      )}
                      {inq.status !== 'closed' && (
                        <button disabled={isUpdating} onClick={() => updateStatus(inq._id, 'closed')}
                          className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
                          {isUpdating ? 'Saving…' : 'Close'}
                        </button>
                      )}
                      {inq.status === 'closed' && (
                        <button disabled={isUpdating} onClick={() => updateStatus(inq._id, 'new')}
                          className="px-4 py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-50 transition-colors">
                          {isUpdating ? 'Saving…' : 'Reopen'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
