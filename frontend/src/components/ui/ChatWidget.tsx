import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

const quickQuestions = [
  'What programs do you offer?',
  'How much does training cost?',
  'When does the next cohort start?',
  'Do you offer payment plans?',
];

const botResponses: Record<string, string> = {
  'what programs do you offer?': 'We offer five tracks: Frontend Development, Backend Development, Full-Stack Development, Mobile App Development, and Research Writing. Each track has three tiers — Starter (live classes), Cohort (intensive group program), and Mentorship (1-on-1 sessions).',
  'how much does training cost?': 'Tracks range from ₦50,000 (Research Writing Starter) to ₦550,000 (Full-Stack Mentorship). Fixed price per tier — what you see on the pricing page is what you pay.',
  'when does the next cohort start?': 'New cohorts start every month! Check our /schedule page for exact dates, or contact us for the latest availability.',
  'do you offer payment plans?': 'Yes! We can arrange installment payments for most programs. Contact us via WhatsApp or the contact form to discuss a plan that works for you.',
};

function getBotReply(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(botResponses)) {
    if (lower.includes(key.split(' ').slice(0, 3).join(' ')) || key.includes(lower.split(' ').slice(0, 3).join(' '))) {
      return val;
    }
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return botResponses['how much does training cost?'];
  }
  if (lower.includes('program') || lower.includes('course') || lower.includes('track') || lower.includes('offer')) {
    return botResponses['what programs do you offer?'];
  }
  if (lower.includes('cohort') || lower.includes('start') || lower.includes('when')) {
    return botResponses['when does the next cohort start?'];
  }
  if (lower.includes('payment') || lower.includes('installment') || lower.includes('plan')) {
    return botResponses['do you offer payment plans?'];
  }
  return "Thanks for reaching out! For detailed questions, please contact us via the contact form or WhatsApp — we'll get back to you within 1–2 business days.";
}

function timeNow() {
  return new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: 'Hi! I\'m the E-Bringgs assistant. How can I help you today?', sender: 'bot', time: timeNow() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), text, sender: 'user', time: timeNow() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot', time: timeNow() }]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-20 right-5 z-50 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center group"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 right-5 z-50 w-[360px] max-w-[calc(100vw-40px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-teal-600 text-white px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <p className="font-bold text-sm">E-Bringgs Assistant</p>
              <p className="text-teal-200 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" /> Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-md'
                }`}>
                  {m.text}
                  <p className={`text-[10px] mt-1 ${m.sender === 'user' ? 'text-teal-200' : 'text-gray-400 dark:text-slate-500'}`}>{m.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickQuestions.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs rounded-full font-medium hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button type="submit" disabled={!input.trim()}
              className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors shrink-0">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
