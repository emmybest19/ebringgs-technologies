import { useEffect, useState } from 'react';
import { Trophy, Medal, Gift } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import GiftVoucherCard from '../../components/GiftVoucherCard';
import { POINT_TO_NAIRA, formatNaira } from './_utils';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  points: number;
  nairaValue: number;
}

const badgeColors: Record<string, string> = {
  'Top Performer': 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  'Perfect Attendance': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  'Fast Learner': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  'Team Player': 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  'Creative Thinker': 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  'Consistent': 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
  'Rising Star': 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
};

export default function StudentLeaderboard() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/points/leaderboard')
      .then(({ data }) => setLeaderboard(Array.isArray(data?.data?.leaderboard) ? data.data.leaderboard : []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const currentUserName = user.name;
  const currentUserPoints = user.points ?? 0;
  const podium = [leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Leaderboard</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main leaderboard */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <h2 className="font-bold text-gray-900 dark:text-white">Student Rankings</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-slate-500">Your balance</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {currentUserPoints} pts ({formatNaira(currentUserPoints)})
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500">Loading rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy size={32} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="font-medium text-gray-500 dark:text-slate-400">No rankings yet</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Be the first to earn points!</p>
            </div>
          ) : (
            <>
              {podium.length >= 1 && (
                <div className="flex items-end justify-center gap-4 px-6 pt-8 pb-6">
                  {podium.map((s, i) => {
                    const heights = ['h-24', 'h-32', 'h-20'];
                    const sizes = ['w-14 h-14', 'w-18 h-18', 'w-14 h-14'];
                    const textSizes = ['text-sm', 'text-base', 'text-sm'];
                    const medalColors = ['text-slate-400', 'text-amber-500', 'text-amber-700'];
                    return (
                      <div key={s.id} className="flex flex-col items-center">
                        <div className={`${sizes[i]} rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-300 font-bold ${textSizes[i]} mb-2 ring-2 ${s.rank === 1 ? 'ring-amber-400' : 'ring-gray-200 dark:ring-slate-700'}`}>
                          {s.initials}
                        </div>
                        <Medal size={16} className={`${medalColors[i]} mb-1`} />
                        <p className="text-xs font-semibold text-gray-900 dark:text-white text-center">{s.name.split(' ')[0]}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{s.points} pts</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{formatNaira(s.points)}</p>
                        <div className={`${heights[i]} w-20 bg-linear-to-t ${s.rank === 1 ? 'from-amber-200 to-amber-100 dark:from-amber-900 dark:to-amber-950' : 'from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-850'} rounded-t-lg mt-2 flex items-center justify-center`}>
                          <span className="text-lg font-extrabold text-gray-400 dark:text-slate-500">#{s.rank}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <ul className="divide-y divide-gray-50 dark:divide-slate-800">
                {leaderboard.map((s) => (
                  <li key={s.id} className={`flex items-center gap-4 px-6 py-4 ${s.name === currentUserName ? 'bg-teal-50 dark:bg-teal-950' : 'hover:bg-gray-50 dark:hover:bg-slate-800'} transition-colors`}>
                    <span className={`w-8 text-center font-bold text-sm ${s.rank <= 3 ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                      #{s.rank}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-300 font-bold text-xs shrink-0">
                      {s.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {s.name} {s.name === currentUserName && <span className="text-xs text-teal-600 dark:text-teal-400">(you)</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{s.points} pts</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{formatNaira(s.points)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Redeem your points */}
          <div className="bg-linear-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-sm p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={18} />
              <h3 className="font-bold">Redeem your points</h3>
            </div>
            <p className="text-emerald-100 text-sm mb-4">
              Use your points as a discount on your next program enrollment.
            </p>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 mb-3">
              <p className="text-xs text-emerald-100 mb-1">Conversion rate</p>
              <p className="text-base font-bold">1 point = ₦{POINT_TO_NAIRA}</p>
            </div>
            <p className="text-[11px] text-emerald-100">
              Discount is applied automatically at checkout. No cash withdrawal, points only convert to enrollment credit.
            </p>
          </div>

          {/* How to earn points */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">How to earn points</h3>
            <div className="space-y-3 text-sm">
              {[
                { action: 'Attend a live class', pts: 5 },
                { action: 'Submit an assignment', pts: 10 },
                { action: 'Pass an assignment review', pts: 8 },
                { action: '7-day attendance streak', pts: 20 },
                { action: '30-day streak bonus', pts: 50 },
                { action: 'Referral signs up & enrolls', pts: 50 },
              ].map((r) => (
                <div key={r.action} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-slate-400">{r.action}</span>
                  <div className="text-right">
                    <span className="font-semibold text-teal-600 dark:text-teal-400 text-xs">+{r.pts} pts</span>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{formatNaira(r.pts)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gift voucher */}
          <GiftVoucherCard availablePoints={currentUserPoints} onPointsChange={fetchMe} />

          {/* Badges */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Available badges</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(badgeColors).map(([badge, color]) => (
                <span key={badge} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>{badge}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
