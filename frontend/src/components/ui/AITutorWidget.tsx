import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

const STORAGE_KEY = 'ai-tutor-history';

function loadHistory(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-12) : [];
  } catch { return []; }
}

function saveHistory(history: ChatTurn[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-12))); } catch { /* ignore */ }
}

export default function AITutorWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>(() => loadHistory());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveHistory(history);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (!open) return;
    api.get('/ai-tutor/quota')
      .then(({ data }) => setRemaining(data?.data?.remaining ?? null))
      .catch(() => {});
  }, [open]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    setError('');
    setSending(true);
    const newHistory: ChatTurn[] = [...history, { role: 'user', text: question }];
    setHistory(newHistory);
    setInput('');

    try {
      const { data } = await api.post('/ai-tutor/ask', {
        question,
        history: history.slice(-10),
      });
      const answer = data?.data?.answer || 'No response.';
      setHistory([...newHistory, { role: 'model', text: answer }]);
      if (typeof data?.data?.remaining === 'number') setRemaining(data.data.remaining);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message
        || 'Could not reach the tutor. Try again in a moment.';
      setError(msg);
      setHistory(newHistory.slice(0, -1));
      setInput(question);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Ask the AI tutor"
        aria-label="Open AI tutor"
      >
        <Sparkles size={22} />
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="font-bold">AI Tutor</p>
                    <p className="text-xs text-teal-100">
                      {remaining !== null ? `${remaining} questions left today` : 'Ask anything'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-slate-950">
                {history.length === 0 && (
                  <div className="text-center py-8">
                    <Bot size={32} className="text-teal-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Hi! I'm your AI tutor.</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                      Stuck on a concept? Ask me anything — I'm here 24/7.
                    </p>
                    <div className="space-y-2 text-left">
                      {[
                        'Explain JavaScript closures with an example',
                        'What\'s the difference between SQL and NoSQL?',
                        'How do I center a div in CSS?',
                        'Walk me through React hooks',
                      ].map((q) => (
                        <button key={q} onClick={() => setInput(q)}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-white dark:hover:bg-slate-900 text-gray-700 dark:text-slate-300 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {history.map((turn, i) => (
                  <Message key={i} turn={turn} />
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
              <form onSubmit={handleSend} className="border-t border-gray-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask anything…"
                    disabled={sending}
                    rows={1}
                    className="flex-1 max-h-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                  />
                  <button type="submit" disabled={sending || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
                    <Send size={16} />
                  </button>
                </div>
                {history.length > 0 && (
                  <button onClick={clearChat}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
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

function Message({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user';
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-gray-200 dark:bg-slate-700' : 'bg-teal-100 dark:bg-teal-950'
      }`}>
        {isUser ? <UserIcon size={14} className="text-gray-600 dark:text-slate-300" /> : <Bot size={14} className="text-teal-600" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
        isUser
          ? 'bg-teal-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-800 rounded-tl-sm'
      }`}>
        {turn.text}
      </div>
    </div>
  );
}
