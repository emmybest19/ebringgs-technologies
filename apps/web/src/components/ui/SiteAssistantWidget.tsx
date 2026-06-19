import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, X, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@ebringgs/api';

// Public-site AI assistant. Distinct from the StudentLayout AITutorWidget,
// that one helps cohort students with lessons (auth-gated /ai-tutor/*).
// This one helps prospective visitors navigate the site, answers business
// questions, and surfaces CTA chips that route to relevant pages. Calls
// /api/site-assistant/ask which is public + IP rate-limited.

interface Action { label: string; href: string }
interface Turn {
  role: 'user' | 'model';
  text: string;
  actions?: Action[];
}

const STORAGE_KEY = 'site-assistant-history';
const STARTERS = [
  'What programs do you offer?',
  'How much does the frontend cohort cost?',
  'When does the next cohort start?',
  "I'm a client, can you build a website for me?",
];

function loadHistory(): Turn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-12) : [];
  } catch { return []; }
}
function saveHistory(history: Turn[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-12))); } catch { /* noop */ }
}

export default function SiteAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Turn[]>(() => loadHistory());
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveHistory(history);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const send = async (questionText?: string) => {
    const question = (questionText ?? input).trim();
    if (!question || sending) return;

    setError('');
    setSending(true);
    const newHistory: Turn[] = [...history, { role: 'user', text: question }];
    setHistory(newHistory);
    setInput('');

    try {
      const { data } = await api.post('/site-assistant/ask', {
        question,
        // The backend only needs role+text; strip actions before sending.
        history: history.slice(-10).map((t) => ({ role: t.role, text: t.text })),
      });
      const answer: string = data?.data?.answer || "I'm not sure, please contact us directly.";
      const actions: Action[] = Array.isArray(data?.data?.actions) ? data.data.actions : [];
      setHistory([...newHistory, { role: 'model', text: answer, actions }]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const upstream = e.response?.data?.message;
      let msg: string;
      if (upstream && /high demand|overloaded|temporarily/i.test(upstream)) {
        msg = "Our AI is a bit busy right now. Give it a moment and try again, or message us on WhatsApp.";
      } else if (upstream) {
        msg = upstream;
      } else {
        msg = e.message
          || "Couldn't reach the assistant. Try again in a moment, or message us on WhatsApp.";
      }
      setError(msg);
      setHistory(newHistory.slice(0, -1));
      setInput(question);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  const clearChat = () => { setHistory([]); saveHistory([]); };

  return (
    <>
      {/* Floating launcher — stacks above WhatsApp (which sits at bottom-6 right-6) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open E-Bringgs assistant"
        className={`fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-linear-to-br from-teal-600 to-cyan-600 text-teal-500 shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Continuous wavy ripples — text-teal-500 above colors the rings
            (ripple-wave uses currentColor). The bot avatar overrides
            currentColor inheritance via its own teal gradient bg. */}
        <span className="ripple-wave" aria-hidden="true" />
        <span className="ripple-wave ripple-wave--delay-1" aria-hidden="true" />
        <span className="ripple-wave ripple-wave--delay-2" aria-hidden="true" />

        <Bot size={24} className="text-white relative z-10" />
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ask E-Bringgs anything
        </span>
        {/* Live dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white z-20" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 w-full sm:w-[440px] h-[80vh] sm:h-[640px] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-linear-to-br from-teal-600 to-cyan-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="font-bold">E-Bringgs Assistant</p>
                    <p className="text-xs text-teal-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Online, ask anything
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-slate-950">
                {history.length === 0 && (
                  <div className="text-center py-6">
                    <Bot size={32} className="text-teal-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Hi! I help visitors find the right program or service.</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                      Ask about cohorts, pricing, projects, schedules, anything.
                    </p>
                    <div className="space-y-2 text-left">
                      {STARTERS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-white dark:hover:bg-slate-900 text-gray-700 dark:text-slate-300 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {history.map((turn, i) => (
                  <Message
                    key={i}
                    turn={turn}
                    onActionClick={() => setOpen(false)}
                  />
                ))}

                {sending && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-teal-600" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-teal-600" />
                      <span className="text-sm text-gray-500 dark:text-slate-400">Thinking…</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900">
                    {error}
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-gray-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask anything about E-Bringgs…"
                    disabled={sending}
                    rows={1}
                    className="flex-1 max-h-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Clear chat
                  </button>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface MessageProps {
  turn: Turn;
  onActionClick: () => void;
}

function Message({ turn, onActionClick }: MessageProps) {
  const isUser = turn.role === 'user';
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-gray-200 dark:bg-slate-700' : 'bg-teal-100 dark:bg-teal-950'
      }`}>
        {isUser
          ? <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300">You</span>
          : <Bot size={14} className="text-teal-600" />}
      </div>
      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser
            ? 'bg-teal-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-800 rounded-tl-sm'
        }`}>
          {turn.text}
        </div>
        {!isUser && turn.actions && turn.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {turn.actions.map((a) => (
              <Link
                key={`${a.label}-${a.href}`}
                to={a.href}
                onClick={onActionClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-semibold transition-colors"
              >
                {a.label} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
