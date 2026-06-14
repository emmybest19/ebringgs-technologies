import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, ShoppingCart, ArrowRight,
  Code2, BarChart3, BookOpen, Layers, Smartphone, Brain, Map, Loader2,
  Send, X, ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useService, useSubmitInquiry, useCaseStudies } from "../services/queries";

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  code: Code2, smartphone: Smartphone, "bar-chart": BarChart3,
  brain: Brain, "book-open": BookOpen, layout: Layers, map: Map,
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

function CustomQuoteModal({ serviceId, serviceTitle, onClose }: { serviceId: string; serviceTitle: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submitInquiry = useSubmitInquiry();
  const loading = submitInquiry.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    submitInquiry.mutate(
      { name, email, serviceId, message },
      {
        onSuccess: () => setSuccess(true),
        onError: () => setError('Failed to send inquiry. Please try again.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500">
          <X size={18} />
        </button>
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex p-4 bg-green-50 dark:bg-green-950 rounded-2xl mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Inquiry sent!</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">We'll send a tailored quote within 1–2 business days.</p>
            <button onClick={onClose} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">Close</button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Request a custom quote</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{serviceTitle}</p>
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm" />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} placeholder="Project details, timeline, budget..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm resize-none" />
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {loading ? 'Sending...' : <><Send size={15} /> Send inquiry</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: service, isLoading: loading } = useService(id);
  const { data: pastExamples = [] } = useCaseStudies(
    id ? { serviceId: id, type: 'client_work' } : {},
  );
  const [showInquiry, setShowInquiry] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-500 dark:text-slate-400 mb-4">Service not found.</p>
        <Link to="/services" className="text-teal-600 font-medium hover:underline">Back to services</Link>
      </div>
    );
  }

  const Icon = iconMap[service.icon] || Code2;

  const handlePurchase = () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/services/${service.id}`)}`);
      return;
    }
    navigate(`/checkout?type=service&id=${service.id}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-900 to-teal-950 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={14} /> All services
          </Link>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full">
                {service.category}
              </span>
              <h1 className="text-4xl font-extrabold mt-4 mb-4">{service.title}</h1>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">{service.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                {service.timeline && (
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-teal-300" /> {service.timeline}
                  </div>
                )}
                {service.productized && typeof service.price === 'number' && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-green-400" /> Fixed price
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="w-40 h-40 bg-teal-500/20 rounded-3xl flex items-center justify-center border border-teal-400/30">
                <Icon size={64} className="text-teal-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Deliverables */}
            {service.deliverables && service.deliverables.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">What you'll get</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.deliverables.map((d) => (
                    <div key={d} className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-950 rounded-xl border border-teal-100 dark:border-teal-800">
                      <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included / Not included */}
            {(service.whatsIncluded?.length || service.whatsNotIncluded?.length) ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {service.whatsIncluded && service.whatsIncluded.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500" /> Included
                    </h3>
                    <ul className="space-y-2">
                      {service.whatsIncluded.map((item) => (
                        <li key={item} className="text-sm text-gray-600 dark:text-slate-400 flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.whatsNotIncluded && service.whatsNotIncluded.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <XCircle size={16} className="text-gray-400" /> Not included
                    </h3>
                    <ul className="space-y-2">
                      {service.whatsNotIncluded.map((item) => (
                        <li key={item} className="text-sm text-gray-500 dark:text-slate-500 flex items-start gap-2">
                          <XCircle size={14} className="text-gray-300 dark:text-slate-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Process */}
            {service.process && service.process.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">How we work</h2>
                <div className="space-y-3">
                  {service.process.map((step, i) => (
                    <div key={step} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-300">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refund policy */}
            {service.refundPolicy && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-600" /> Refund policy
                </h3>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{service.refundPolicy}</p>
              </div>
            )}

            {/* Past examples */}
            {pastExamples.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Past examples</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">Real work we've delivered for this service.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {pastExamples.slice(0, 4).map((ex) => (
                    <Link key={ex._id} to={`/success-stories/${ex.slug}`}
                      className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all overflow-hidden">
                      {ex.coverImage && (
                        <div className="h-32 overflow-hidden">
                          <img src={ex.coverImage} alt={ex.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{ex.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{ex.summary}</p>
                        {ex.deliveryDays && (
                          <p className="text-xs text-teal-600 mt-2 font-medium">Delivered in {ex.deliveryDays} days</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {service.faq && service.faq.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Common questions</h2>
                <div className="space-y-4">
                  {service.faq.map(({ q, a }) => (
                    <div key={q} className="p-5 border border-gray-100 dark:border-slate-800 rounded-xl">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{q}</p>
                      <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <aside>
            <div className="bg-teal-600 rounded-2xl p-6 text-white sticky top-24">
              {service.productized && typeof service.price === 'number' ? (
                <>
                  <p className="font-bold text-lg mb-1">Ready to start?</p>
                  <p className="text-teal-100 text-sm mb-5">
                    Pay now, fill out a quick brief, and we kick off within 1 business day.
                  </p>
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">{formatNGN(service.price)}</span>
                    </div>
                    <p className="text-teal-300 text-xs mt-1">Fixed price · one-time payment</p>
                  </div>
                  <button
                    onClick={handlePurchase}
                    className="w-full py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Purchase now
                  </button>
                  {service.timeline && (
                    <div className="mt-4 flex items-center gap-2 text-teal-200 text-xs">
                      <Clock size={13} /> {service.timeline}
                    </div>
                  )}
                  {typeof service.revisionsIncluded === 'number' && (
                    <div className="mt-1 flex items-center gap-2 text-teal-200 text-xs">
                      <CheckCircle2 size={13} /> {service.revisionsIncluded} revision round{service.revisionsIncluded === 1 ? '' : 's'} included
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-lg mb-1">Custom engagement</p>
                  <p className="text-teal-100 text-sm mb-5">
                    Scope and price depend on your needs. Tell us about your project and we'll send a quote within 1–2 business days.
                  </p>
                  <button
                    onClick={() => setShowInquiry(true)}
                    className="w-full py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Request a quote <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      {showInquiry && (
        <CustomQuoteModal
          serviceId={service.id}
          serviceTitle={service.title}
          onClose={() => setShowInquiry(false)}
        />
      )}
    </div>
  );
}
