import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, BarChart3, BookOpen, Layers, Smartphone, Brain,
  Map, ArrowRight, Send, CheckCircle2, X, Loader2, ShoppingCart, MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useServices, useSubmitInquiry } from '../services/queries';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  code: Code2, smartphone: Smartphone, 'bar-chart': BarChart3,
  brain: Brain, 'book-open': BookOpen, layout: Layers, map: Map,
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

function InquiryModal({ serviceId, serviceTitle, onClose }: { serviceId: string | null; serviceTitle: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submitInquiry = useSubmitInquiry();

  const handleSubmit = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    setError('');
    submitInquiry.mutate(
      { name, email, serviceId: serviceId ?? undefined, message },
      {
        onSuccess: () => setSuccess(true),
        onError: () => setError('Failed to send inquiry. Please try again.'),
      },
    );
  };

  const loading = submitInquiry.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500">
          <X size={18} />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex p-4 bg-green-50 dark:bg-green-950 rounded-2xl mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Inquiry sent!</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">We'll be in touch within 1–2 business days with a custom quote.</p>
            <button onClick={onClose} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Request a custom quote</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{serviceTitle}</p>

            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tell us about your project</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} placeholder="Describe what you need, timeline, budget range..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm resize-none" />
              </div>
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

export default function Services() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: services = [], isLoading: loading } = useServices();
  const [activeCategory, setActiveCategory] = useState('All');
  const [inquiryService, setInquiryService] = useState<{ id: string; title: string } | null>(null);

  const productized = services.filter((s) => s.productized);
  const customOnly = services.filter((s) => !s.productized);

  const categories = ['All', ...Array.from(new Set(productized.map((s) => s.category)))];
  const filtered = activeCategory === 'All' ? productized : productized.filter((s) => s.category === activeCategory);

  const handleBuy = (serviceId: string) => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/services/${serviceId}`)}`);
      return;
    }
    navigate(`/checkout?type=service&id=${serviceId}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Header */}
      <section className="relative text-white py-24 px-4 overflow-hidden">
        <img src="/images/general/tech-team.jpg" alt="Tech team" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-teal-950/85" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Buy a service, kick off in days</h1>
          <p className="text-slate-300 text-lg">
            Productized packages with fixed scope, fixed price, and fast turnaround. Pay online, brief us, we deliver.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-10">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    activeCategory === cat
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-600'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Productized grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-slate-400">
                No packages in this category yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(service => {
                  const Icon = iconMap[service.icon] || Code2;
                  return (
                    <div key={service.id} className="card-hover-border group border border-gray-100 dark:border-slate-800 rounded-2xl hover:border-teal-100 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                      {service.img && (
                        <div className="h-44 overflow-hidden relative">
                          <img src={service.img} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute top-3 left-3">
                            <span className="text-xs font-medium text-white bg-teal-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                              {service.category}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-7 flex flex-col flex-1">
                        <div className="inline-flex p-3 bg-teal-50 dark:bg-teal-950 rounded-xl mb-4 w-fit">
                          <Icon size={22} className="text-teal-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{service.title}</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-5 flex-1">{service.description}</p>

                        {service.timeline && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                            <span className="font-semibold text-gray-700 dark:text-slate-300">Delivery:</span> {service.timeline}
                          </p>
                        )}

                        {typeof service.price === 'number' && (
                          <div className="mb-5">
                            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                              {formatNGN(service.price)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Fixed price · one-time</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <Link
                            to={`/services/${service.id}`}
                            className="text-center w-full py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                          >
                            View details
                          </Link>
                          <button
                            onClick={() => handleBuy(service.id)}
                            className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={14} /> Purchase now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom services callout */}
            {customOnly.length > 0 && (
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare size={20} className="text-teal-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Need something custom?</h2>
                </div>
                <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-2xl">
                  These engagements vary too much for fixed pricing. Tell us about your project and we'll send a tailored quote within 1–2 business days.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {customOnly.map((service) => {
                    const Icon = iconMap[service.icon] || Code2;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setInquiryService({ id: service.id, title: service.title })}
                        className="text-left bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                      >
                        <div className="inline-flex p-2.5 bg-teal-50 dark:bg-teal-950 rounded-xl mb-3">
                          <Icon size={20} className="text-teal-600" />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{service.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{service.description}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 mt-3">
                          Request quote <ArrowRight size={12} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 dark:bg-slate-950 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Not seeing what you need?</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8">Let's talk. We'll help you figure out the right approach for your goals.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
            Talk to us <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {inquiryService && (
        <InquiryModal
          serviceId={inquiryService.id}
          serviceTitle={inquiryService.title}
          onClose={() => setInquiryService(null)}
        />
      )}
    </div>
  );
}
