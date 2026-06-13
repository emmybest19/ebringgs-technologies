import { useEffect, useState } from 'react';
import { Gift, Copy, Check, X, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Voucher {
  _id: string;
  code: string;
  points: number;
  nairaValue: number;
  status: 'active' | 'redeemed' | 'expired';
  note?: string;
  expiresAt?: string;
  createdAt: string;
}

interface Props {
  availablePoints: number;
  onPointsChange?: () => void;
}

export default function GiftVoucherCard({ availablePoints, onPointsChange }: Props) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [points, setPoints] = useState(10);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadVouchers = async () => {
    try {
      const { data } = await api.get('/vouchers/me');
      setVouchers(Array.isArray(data?.data?.created) ? data.data.created : []);
    } catch {
      setVouchers([]);
    }
  };

  useEffect(() => { loadVouchers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (points < 10) {
      toast.error('Minimum gift is 10 points (₦1,000).');
      return;
    }
    if (points > availablePoints) {
      toast.error('You don\'t have enough points.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/vouchers', { points, note: note.trim() || undefined });
      toast.success('Gift voucher created!');
      setVouchers((prev) => [data.data.voucher, ...prev]);
      setShowForm(false);
      setPoints(10);
      setNote('');
      onPointsChange?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Could not create voucher.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this voucher? Your points will be refunded.')) return;
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher cancelled, points refunded.');
      setVouchers((prev) => prev.filter((v) => v._id !== id));
      onPointsChange?.();
    } catch {
      toast.error('Could not cancel voucher.');
    }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Gift points to a friend</h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800"
          >
            <Plus size={14} /> New gift
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Convert your points into a one-time discount code your friend can use at checkout. 1 point = ₦100. Minimum 10 points.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Points to gift (you have {availablePoints})
            </label>
            <input
              type="number"
              min={10}
              max={availablePoints}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
            />
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
              = ₦{(points * 100).toLocaleString()} discount
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Happy birthday!"
              className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : null}
              Create voucher
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {vouchers.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
          No vouchers yet. Click "New gift" to create one.
        </p>
      ) : (
        <ul className="space-y-2">
          {vouchers.slice(0, 5).map((v) => (
            <li key={v._id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300 flex-1 truncate">
                  {v.code}
                </code>
                {v.status === 'active' && (
                  <button
                    onClick={() => copy(v.code)}
                    title="Copy code"
                    className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded"
                  >
                    {copiedCode === v.code
                      ? <Check size={12} className="text-green-600" />
                      : <Copy size={12} className="text-gray-400" />}
                  </button>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                  v.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : v.status === 'redeemed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
                }`}>
                  {v.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-slate-400">
                  {v.points} pts · ₦{v.nairaValue.toLocaleString()}
                </span>
                {v.status === 'active' && (
                  <button
                    onClick={() => handleCancel(v._id)}
                    title="Cancel & refund"
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {v.note && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 italic">"{v.note}"</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
