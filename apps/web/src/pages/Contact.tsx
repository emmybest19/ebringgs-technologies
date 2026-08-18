import { useState, type FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, MessageSquare, Globe, Clock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useSEO, schema } from '@ebringgs/ui';

/**
 * Contact page.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the rest of the redesigned public pages.
 *
 * The form posts through EmailJS from the browser; there is no backend
 * endpoint behind it.
 */

const EMAIL = 'ebringgstechnologies@gmail.com';
const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;

const channels = [
  {
    icon: Mail,
    label: 'Send an email',
    value: EMAIL,
    note: 'Direct general, cohort support & partnership inquiries.',
    href: `mailto:${EMAIL}`,
  },
  {
    icon: MessageSquare,
    label: 'Message us on WhatsApp',
    value: 'Start a conversation',
    note: 'Quickest route for cohort questions during working hours.',
    href: WHATSAPP ? `https://wa.me/${WHATSAPP.replace(/[^0-9]/g, '')}` : undefined,
  },
  {
    icon: Globe,
    label: 'Our headquarters',
    value: 'Built with passion in Africa',
    note: 'Remote-first, serving developers and tech operators worldwide.',
    href: undefined,
  },
];

const topics = [
  'Enroll in a cohort program',
  'Enterprise service enquiry',
  'Partnership or collaboration',
  'Technical support',
  'Billing question',
  'Other',
];

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-[#111823] px-4 py-3 text-sm text-white ' +
  'placeholder-slate-600 outline-none transition-colors focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10';

export default function Contact() {
  useSEO({
    title: 'Contact Us',
    description: 'Get in touch with the E-Bringgs team. We respond within 1 business day.',
    url: 'https://ebringgs.com/contact',
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: 'Contact E-Bringgs Technologies',
    jsonLd: [
      schema.organization({
        contactPoint: {
          '@type': 'ContactPoint',
          email: EMAIL,
          contactType: 'customer support',
          availableLanguage: ['English'],
        },
      }),
      schema.breadcrumb([
        { name: 'Home', url: 'https://ebringgs.com/' },
        { name: 'Contact', url: 'https://ebringgs.com/contact' },
      ]),
    ],
  });

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      setError(`Failed to send message. Please try emailing us directly at ${EMAIL}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="no-reveal relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_0%,rgba(34,211,238,0.09),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:px-6">
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            Connect with us
          </span>
          <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            Let&rsquo;s build something great together
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-400">
            Have questions about our live cohorts, enterprise service models, or partnership
            inquiries? Drop us a line and our team will get back to you within one business day.
          </p>
        </div>
      </section>

      {/* ── Channels + form ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Left column */}
          <div className="space-y-5">
            {channels.map(({ icon: Icon, label, value, note, href }) => {
              const inner = (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                    <Icon size={18} />
                  </span>
                  <span className="mt-5 block text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                    {label}
                  </span>
                  <span className="mt-1.5 block break-words text-lg font-bold text-white">{value}</span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{note}</span>
                </>
              );

              return href ? (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  className="block rounded-2xl border border-slate-800 bg-[#0e141c] p-6 transition-colors hover:border-slate-700"
                >
                  {inner}
                </a>
              ) : (
                <div key={label} className="rounded-2xl border border-slate-800 bg-[#0e141c] p-6">
                  {inner}
                </div>
              );
            })}

            <div className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-[#0e141c] p-6">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                <Clock size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Availability note</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  Our support mentors and project architects operate across GMT and EST timezones to
                  ensure constant deployment coverage.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  loading="lazy"
                  src="/images/general/coding-screen.jpg"
                  alt=""
                  aria-hidden="true"
                  className="h-48 w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#080c11]/55" />
              </div>
            </div>
          </div>

          {/* Right column — form */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e141c] p-7 sm:p-9">
            <h2 className="text-xl font-extrabold tracking-tight text-white">Send a message</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tell us about yourself and what you&rsquo;re looking to build.
            </p>

            {sent ? (
              <div className="mt-8 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6 text-center">
                <CheckCircle2 size={22} className="mx-auto text-cyan-400" />
                <p className="mt-3 text-sm font-bold text-white">Message sent</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  Thanks for reaching out — we&rsquo;ll reply within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Full name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Jane Doe"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Professional email address</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="jane@company.com"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">How can we help?</span>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select a topic…</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Your message</span>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Briefly describe your objectives, experience level, or project specifications…"
                    className={`${inputClass} resize-y`}
                  />
                </label>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  ) : (
                    <>Send message <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
