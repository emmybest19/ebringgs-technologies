import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, BarChart3, BookOpen, Layers, Smartphone, Brain, Map,
  Loader2, ArrowRight, MessageSquare, ShoppingCart,
} from 'lucide-react';
import { useServices } from '../../services/queries';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  code: Code2, smartphone: Smartphone, 'bar-chart': BarChart3,
  brain: Brain, 'book-open': BookOpen, layout: Layers, map: Map,
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

export default function StudentServices() {
  const { data: services = [], isLoading: loading } = useServices();
  const navigate = useNavigate();

  const productized = services.filter((s) => s.productized);
  const customOnly = services.filter((s) => !s.productized);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Services</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Need something built or designed alongside your training? Buy a productized package or request a custom quote.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Sparkles className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No services available right now.</p>
        </div>
      ) : (
        <>
          {productized.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Productized packages
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {productized.map((s) => {
                  const Icon = iconMap[s.icon] || Code2;
                  return (
                    <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors flex flex-col">
                      <div className="w-11 h-11 bg-teal-50 dark:bg-teal-950 rounded-xl flex items-center justify-center mb-3">
                        <Icon size={20} className="text-teal-600" />
                      </div>
                      <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">{s.category}</p>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{s.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3 flex-1">{s.description}</p>

                      {typeof s.price === 'number' && (
                        <div className="mb-3">
                          <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                            {formatNGN(s.price)}
                            <span className="ml-1 text-xs font-medium text-gray-400 dark:text-slate-500">+ 7.5% VAT</span>
                          </p>
                          {s.timeline && <p className="text-xs text-gray-500 dark:text-slate-400">{s.timeline}</p>}
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/dashboard/services/${s.id}`}
                          className="text-center w-full py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                        >
                          View details
                        </Link>
                        <button
                          onClick={() => navigate(`/checkout?type=service&id=${s.id}`)}
                          className="w-full py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={14} /> Purchase
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {customOnly.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Custom engagements
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {customOnly.map((s) => {
                  const Icon = iconMap[s.icon] || Code2;
                  return (
                    <Link
                      key={s.id}
                      to={`/dashboard/services/${s.id}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors block"
                    >
                      <div className="w-11 h-11 bg-teal-50 dark:bg-teal-950 rounded-xl flex items-center justify-center mb-3">
                        <Icon size={20} className="text-teal-600" />
                      </div>
                      <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">{s.category}</p>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{s.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">{s.description}</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-800">
                        Request a quote <ArrowRight size={14} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-8 bg-linear-to-br from-teal-600 to-emerald-700 rounded-2xl shadow-sm p-6 text-white flex items-center gap-4">
        <MessageSquare size={28} />
        <div className="flex-1">
          <p className="font-bold">Don't see what you need?</p>
          <p className="text-teal-100 text-sm">Talk to us directly and we'll work something out.</p>
        </div>
        <Link
          to="/contact"
          className="px-5 py-2.5 bg-white text-teal-700 font-semibold text-sm rounded-xl hover:bg-teal-50 transition-colors shrink-0"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
