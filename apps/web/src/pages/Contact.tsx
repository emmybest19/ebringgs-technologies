import { useState, type FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, MessageSquare, MapPin, Clock, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'ebringgstechnologies@gmail.com', href: 'mailto:ebringgstechnologies@gmail.com' },
  { icon: MessageSquare, label: 'WhatsApp / Chat', value: 'Start a conversation', href: '#' },
  { icon: MapPin, label: 'Location', value: 'Remote-first. Based in West Africa.', href: null },
  { icon: Clock, label: 'Response time', value: 'Within 1 business day', href: null },
];

export default function Contact() {
  useSEO({ title: 'Contact Us', description: 'Get in touch with the E-Bringgs team. We respond within 1 business day.' });

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          reply_to: form.email,
          subject: form.subject,
          message: form.message,
        },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY },
      );
      setSent(true);
    } catch {
      setError('Failed to send message. Please try emailing us directly at ebringgstechnologies@gmail.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <section className="bg-linear-to-br from-slate-900 to-teal-950 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Get in touch</h1>
        <p className="text-slate-300 text-lg max-w-xl mx-auto">Have a question, project idea, or just want to say hello? We'd love to hear from you.</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact information</h2>
          <div className="space-y-5 mb-10">
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="p-2.5 bg-teal-50 dark:bg-teal-950 rounded-xl shrink-0">
                  <Icon size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                  {href ? (
                    <a href={href} className="text-gray-700 dark:text-slate-300 font-medium hover:text-teal-600 transition-colors text-sm">{value}</a>
                  ) : (
                    <p className="text-gray-700 dark:text-slate-300 text-sm">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-teal-50 dark:bg-teal-950 rounded-2xl p-6 border border-teal-100 dark:border-teal-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">For consulting engagements</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
              For larger projects, partnerships or enterprise inquiries, please email us directly at{' '}
              <a href="mailto:ebringgstechnologies@gmail.com" className="text-teal-600 font-medium">ebringgstechnologies@gmail.com</a>{' '}
              with a brief description of your needs.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          {sent ? (
            <div className="text-center py-10">
              <div className="inline-flex p-4 bg-green-50 dark:bg-green-950 rounded-2xl mb-4"><CheckCircle2 size={36} className="text-green-500" /></div>
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">Message sent!</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Thanks for reaching out. We'll reply within 1 business day.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Send us a message</h2>
              {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject</label>
                  <select name="subject" value={form.subject} onChange={handleChange} required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 outline-none text-sm bg-white">
                    <option value="">Select a topic...</option>
                    <option>Service inquiry</option>
                    <option>Course / learning question</option>
                    <option>Partnership or collaboration</option>
                    <option>Technical support</option>
                    <option>Billing question</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm resize-none" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Send message
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
