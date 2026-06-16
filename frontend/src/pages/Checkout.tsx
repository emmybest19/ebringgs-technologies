import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, CheckCircle2, Gift, Ticket, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { useService, useInitializePayment } from '../services/queries';
import InstallmentSelector, { type InstallmentChoice } from '../components/payments/InstallmentSelector';
import Logo from '../components/Logo';

const INSTALLMENT_PRICE_FLOOR_KOBO = 200_000 * 100; // ₦200,000 in kobo

const POINT_TO_NAIRA = 100;

interface Plan {
  id?: string;
  name: string;
  price: number;       // in naira (full units)
  duration: string;
  description: string;
}

const planDetails: Record<string, Plan> = {
  // ─── Tutoring catalog — IDs match backend/src/config/tutoring.catalog.ts ─
  // Keep prices and durations in sync with that file (server is the source
  // of truth for what users actually pay; this map is just for display).
  // Software Development — Frontend
  'frontend-cohort':  { name: 'Frontend Development — Cohort',           price: 200000, duration: '12 weeks', description: 'Live cohort: HTML, CSS, JS, TS, React + Tailwind. Ship two real apps.' },
  'frontend-mentor':  { name: 'Frontend Development — 1-on-1 Mentorship', price: 400000, duration: '12 weeks', description: 'Private frontend mentorship, your goals and your pace.' },
  // Software Development — Backend
  'backend-cohort':   { name: 'Backend Development — Cohort',            price: 220000, duration: '12 weeks', description: 'Live cohort: Node, Express, MongoDB, auth, payments, deployment.' },
  'backend-mentor':   { name: 'Backend Development — 1-on-1 Mentorship', price: 420000, duration: '12 weeks', description: 'Private backend mentorship around a real API project.' },
  // Software Development — Full-Stack
  'fullstack-cohort': { name: 'Full-Stack Development — Cohort',         price: 300000, duration: '14 weeks', description: 'Full-stack cohort: React frontend + Node API, end to end.' },
  'fullstack-mentor': { name: 'Full-Stack Development — 1-on-1 Mentorship', price: 500000, duration: '14 weeks', description: 'Private full-stack mentorship around a real product.' },
  // Mobile App Development
  'mobile-dev-cohort': { name: 'Mobile App Development — Cohort',        price: 250000, duration: '10 weeks', description: 'Cross-platform mobile with Flutter or React Native, shipped to TestFlight + Play internal.' },
  'mobile-dev-mentor': { name: 'Mobile App Development — 1-on-1 Mentorship', price: 450000, duration: '10 weeks', description: 'Private mobile mentorship around a real app of yours.' },
  // Data Analysis
  'data-analysis-cohort': { name: 'Data Analysis — Cohort',              price: 180000, duration: '10 weeks', description: 'Excel → SQL → Python → Power BI. Land a junior data analyst role.' },
  'data-analysis-mentor': { name: 'Data Analysis — 1-on-1 Mentorship',   price: 350000, duration: '10 weeks', description: 'Private data analysis mentorship using your own dataset.' },
  // Research Writing
  'research-writing-cohort': { name: 'Research Writing — Cohort',        price: 120000, duration: '8 weeks',  description: 'Topic refinement, literature review, methodology, writing style.' },
  'research-writing-mentor': { name: 'Research Writing — 1-on-1 Mentorship', price: 280000, duration: '8 weeks', description: 'Private mentorship on your dissertation / chapter / manuscript.' },
  // UI/UX Design
  'uiux-cohort':      { name: 'UI/UX Design — Cohort',                  price: 150000, duration: '8 weeks',  description: 'Product design from research to high-fidelity Figma prototypes.' },
  'uiux-mentor':      { name: 'UI/UX Design — 1-on-1 Mentorship',       price: 300000, duration: '8 weeks',  description: 'Private design mentorship + portfolio critique.' },
  // Office Automation
  'office-automation-cohort': { name: 'Office Automation — Cohort',     price: 100000, duration: '6 weeks',  description: 'Word, Excel, PowerPoint, Outlook, OneDrive / Google Drive — the everyday tools the working world runs on.' },
  'office-automation-mentor': { name: 'Office Automation — 1-on-1 Mentorship', price: 200000, duration: '6 weeks', description: 'Private Office training built around your actual work.' },

  // ─── Legacy / backwards-compat IDs ────────────────────────────────────
  // Keep these so any historical cohort documents or saved transactions
  // still resolve to a sensible display. New purchases should never use
  // these — the tutoring catalog is the source of truth going forward.
  'frontend-starter':         { name: 'Frontend, Starter (legacy)',          price: 75000,  duration: '8 weeks',  description: 'Legacy track — use frontend-cohort instead.' },
  'backend-starter':          { name: 'Backend, Starter (legacy)',           price: 80000,  duration: '8 weeks',  description: 'Legacy track — use backend-cohort instead.' },
  'fullstack-starter':        { name: 'Full-Stack, Starter (legacy)',        price: 100000, duration: '10 weeks', description: 'Legacy track — use fullstack-cohort instead.' },
  'mobile-dev-starter':       { name: 'Mobile, Starter (legacy)',            price: 85000,  duration: '8 weeks',  description: 'Legacy track — use mobile-dev-cohort instead.' },
  'research-writing-starter': { name: 'Research Writing, Starter (legacy)',  price: 50000,  duration: '6 weeks',  description: 'Legacy track — use research-writing-cohort instead.' },
  'web-dev-starter':  { name: 'Web Dev, Starter (legacy)',     price: 75000,  duration: '8 weeks',  description: 'Legacy, use frontend-cohort or fullstack-cohort.' },
  'web-dev-cohort':   { name: 'Web Dev, Live Cohort (legacy)', price: 250000, duration: '12 weeks', description: 'Legacy, use frontend-cohort or fullstack-cohort.' },
  'web-dev-mentor':   { name: 'Web Dev, Mentorship (legacy)',  price: 450000, duration: '12 weeks', description: 'Legacy, use frontend-mentor or fullstack-mentor.' },
  'uiux-starter':     { name: 'UI/UX, Starter (legacy)',       price: 60000,  duration: '6 weeks',  description: 'Legacy — use uiux-cohort instead.' },
  student:            { name: 'Student',     price: 75000,  duration: '8 weeks',  description: 'Live classes + community access' },
  cohort:             { name: 'Cohort Pro',  price: 250000, duration: '12 weeks', description: 'Intensive live cohort + mentorship + career coaching' },
  mentorship:         { name: 'Mentorship',  price: 450000, duration: '12 weeks', description: 'Weekly 1-on-1 mentor sessions + personalised roadmap' },
};

function formatNGN(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
}

interface CheckoutItem {
  type: 'plan' | 'service';
  id: string;
  name: string;
  description: string;
  duration: string;
  priceKobo: number;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [error, setError] = useState('');

  const purchaseType = (searchParams.get('type') === 'service' ? 'service' : 'plan') as 'plan' | 'service';
  const itemId = searchParams.get('id') || searchParams.get('plan') || 'student';

  // Redirect to login first if not authenticated.
  useEffect(() => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/checkout?${searchParams.toString()}`);
      navigate(`/login?next=${next}`);
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Service lookup only fires when this is a service purchase.
  const {
    data: serviceData,
    isLoading: serviceLoading,
    isError: serviceErrored,
  } = useService(purchaseType === 'service' ? itemId : undefined);

  const [itemError, setItemError] = useState('');

  // Derive the checkout item from the plan map (synchronous) or the service
  // query (async). Both yield the same CheckoutItem shape so the rest of
  // the component doesn't have to branch.
  let item: CheckoutItem | null = null;
  let itemLoading = false;

  if (purchaseType === 'plan') {
    const plan = planDetails[itemId] || planDetails.student;
    item = {
      type: 'plan',
      id: itemId,
      name: plan.name,
      description: plan.description,
      duration: plan.duration,
      priceKobo: plan.price * 100,
    };
  } else {
    itemLoading = serviceLoading;
    if (serviceData && serviceData.productized && typeof serviceData.price === 'number') {
      item = {
        type: 'service',
        id: serviceData.id,
        name: serviceData.title,
        description: serviceData.description,
        duration: serviceData.timeline || 'Custom timeline',
        priceKobo: serviceData.price * 100,
      };
    }
  }

  // Surface service-fetch failures consistently with the old behavior.
  useEffect(() => {
    if (purchaseType !== 'service') return;
    if (serviceErrored) setItemError('Could not load service details.');
    else if (!serviceLoading && serviceData && (!serviceData.productized || typeof serviceData.price !== 'number')) {
      setItemError('This service is not available for direct purchase.');
    } else {
      setItemError('');
    }
  }, [purchaseType, serviceErrored, serviceLoading, serviceData]);

  const [availablePoints, setAvailablePoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Client referral credit (naira). Separate from points; clients only.
  const availableCreditNaira = (user?.role === 'client' && user.referralCreditNaira) ? user.referralCreditNaira : 0;
  const [useCredit, setUseCredit] = useState(availableCreditNaira > 0);

  // Voucher redemption
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<null | { code: string; nairaValue: number; note?: string }>(null);
  const [voucherError, setVoucherError] = useState('');

  // Installment payments, 1× (default) | 2× | 3×
  const [installmentChoice, setInstallmentChoice] = useState<InstallmentChoice>(1);
  const [autoChargeConsent, setAutoChargeConsent] = useState(false);

  // Load points balance once we know the price
  useEffect(() => {
    if (!item) return;
    api.get('/points/me')
      .then(({ data }) => {
        const pts = data?.data?.points ?? 0;
        setAvailablePoints(pts);
        const maxApplicable = Math.floor(item.priceKobo / 100 / POINT_TO_NAIRA);
        setPointsToRedeem(Math.min(pts, maxApplicable));
      })
      .catch(() => setAvailablePoints(0));
  }, [item]);

  if (itemLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 max-w-md text-center">
          <p className="text-gray-700 dark:text-slate-300 mb-6">{itemError || 'This item is not available.'}</p>
          <Link to={purchaseType === 'service' ? '/services' : '/pricing'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
            {purchaseType === 'service' ? 'Browse services' : 'Back to pricing'}
          </Link>
        </div>
      </div>
    );
  }

  const priceKobo = item.priceKobo;
  const effectivePoints = usePoints ? Math.min(pointsToRedeem, availablePoints) : 0;
  const pointsDiscountKobo = effectivePoints * POINT_TO_NAIRA * 100;
  const voucherDiscountKobo = appliedVoucher ? Math.min(appliedVoucher.nairaValue * 100, priceKobo - pointsDiscountKobo) : 0;
  // Credit applies after points + voucher, capped at the remaining bill.
  const creditDiscountKobo = useCredit
    ? Math.max(0, Math.min(availableCreditNaira * 100, priceKobo - pointsDiscountKobo - voucherDiscountKobo))
    : 0;
  const effectiveCreditNaira = Math.floor(creditDiscountKobo / 100);
  const totalDiscountKobo = pointsDiscountKobo + voucherDiscountKobo + creditDiscountKobo;
  const finalKobo = Math.max(priceKobo - totalDiscountKobo, 0);

  // Installment eligibility, services use the server-decorated flag; training
  // plans + projects use the same ₦200,000 floor the server enforces.
  const installmentEligible = item.type === 'service'
    ? serviceData?.installmentEligible === true
    : priceKobo >= INSTALLMENT_PRICE_FLOOR_KOBO;

  // What gets charged today (installment 1 when splitting; the full discounted
  // amount otherwise). Mirror of the backend calc in paystack.controller.ts.
  const perInstallmentKobo = Math.round(priceKobo / installmentChoice);
  const chargeNowKobo = installmentChoice > 1
    ? Math.max(100, perInstallmentKobo - totalDiscountKobo)
    : finalKobo;

  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setVoucherChecking(true);
    setVoucherError('');
    try {
      const { data } = await api.get(`/vouchers/lookup/${encodeURIComponent(code)}`);
      setAppliedVoucher({
        code: data.data.code,
        nairaValue: data.data.nairaValue,
        note: data.data.note,
      });
      toast.success(`Voucher applied: ₦${data.data.nairaValue.toLocaleString()} off`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Invalid voucher code.';
      setVoucherError(msg);
      setAppliedVoucher(null);
    } finally {
      setVoucherChecking(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError('');
  };

  const initializePayment = useInitializePayment();

  const handlePaystackCheckout = () => {
    if (!user) return;
    if (installmentChoice > 1 && !autoChargeConsent) {
      setError('Please tick the auto-charge consent box to continue with installments.');
      return;
    }
    setError('');

    const payload = {
      callbackUrl: `${window.location.origin}/payment/success`,
      ...(effectivePoints > 0 ? { pointsToRedeem: effectivePoints } : {}),
      ...(appliedVoucher ? { voucherCode: appliedVoucher.code } : {}),
      ...(effectiveCreditNaira > 0 ? { referralCreditToUseNaira: effectiveCreditNaira } : {}),
      ...(installmentChoice > 1
        ? { installments: installmentChoice, autoChargeConsent }
        : {}),
      // Service vs plan branching, server uses the catalog price when
      // serviceId is set, otherwise trusts amount/description from the body.
      ...(item.type === 'service'
        ? { serviceId: item.id }
        : { amount: item.priceKobo, description: `${item.name} (${item.duration})`, planId: item.id }),
    };

    initializePayment.mutate(payload, {
      onSuccess: (data) => { window.location.href = data.authorizationUrl; },
      onError: () => setError('Could not initialise checkout. Please try again.'),
    });
  };

  // Keep `processing` semantics for the existing button, the navigation
  // away on success leaves the spinner showing until the new page loads.
  const processing = initializePayment.isPending || initializePayment.isSuccess;

  // Checkout is reachable from multiple places: /pricing, public /services/:id,
  // /client/services/:id, and /dashboard/services/:id (tutoring). Hardcoding a
  // single back path sent users to the wrong page (the public home in some
  // flows). Use browser history so we always return to whatever they clicked
  // from. Label stays generic for the same reason.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(item.type === 'service' ? `/services/${item.id}` : '/pricing');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
        {/* Order summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="mb-6">
            <Logo variant="mark" size={40} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Order summary</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Review your selection before payment</p>

          <div className="bg-teal-50 dark:bg-teal-950 rounded-xl p-5 mb-6 border border-teal-100 dark:border-teal-900">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900 px-2 py-0.5 rounded-full">{item.duration}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{item.description}</p>
            <div className="flex items-baseline justify-between border-t border-teal-100 dark:border-teal-900 pt-4">
              <span className="text-sm text-gray-600 dark:text-slate-400">Total due today</span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatNGN(priceKobo)}</span>
            </div>
            {item.type === 'service' && (
              <p className="text-xs text-teal-700 dark:text-teal-400 mt-2">After payment we'll ask a few quick questions to kick off your project.</p>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{user.email}</p>
              </div>
            </div>
          )}

          <ul className="mt-5 space-y-2.5">
            {(item.type === 'service'
              ? ['Secure payment via Paystack', 'Brief us in 5 minutes after payment', 'We start within 1 business day']
              : ['Secure payment via Paystack', '7-day money-back guarantee', 'All classes taught live']
            ).map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <CheckCircle2 size={15} className="text-green-500 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Complete payment</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
            You'll be securely redirected to Paystack to complete your payment.
          </p>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 mb-6">{error}</div>
          )}

          {/* Installment selector, 1×/2×/3× */}
          <InstallmentSelector
            totalKobo={priceKobo}
            value={installmentChoice}
            onChange={setInstallmentChoice}
            consent={autoChargeConsent}
            onConsentChange={setAutoChargeConsent}
            eligible={installmentEligible}
          />

          {/* Gift voucher */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                <Ticket size={13} className="text-teal-700 dark:text-teal-400" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Have a gift voucher?</span>
            </div>
            {appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800">
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono font-semibold text-gray-900 dark:text-white block truncate">
                    {appliedVoucher.code}
                  </code>
                  <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-0.5">
                    ₦{appliedVoucher.nairaValue.toLocaleString()} discount applied
                  </p>
                  {appliedVoucher.note && (
                    <p className="text-[10px] italic text-gray-400 dark:text-slate-500 mt-1">"{appliedVoucher.note}"</p>
                  )}
                </div>
                <button
                  onClick={removeVoucher}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                  title="Remove voucher"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(''); }}
                    placeholder="GIFT-XXXX-XXXX"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm font-mono uppercase placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 outline-none"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={voucherChecking || !voucherInput.trim()}
                    className="px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-60"
                  >
                    {voucherChecking ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {voucherError && <p className="text-xs text-red-600 mt-1">{voucherError}</p>}
              </>
            )}
          </div>

          {availableCreditNaira > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-4 border border-gray-200 dark:border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCredit}
                  onChange={(e) => setUseCredit(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-teal-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                      <Gift size={13} className="text-teal-700 dark:text-teal-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Apply referral credit
                    </span>
                    <span className="ml-auto text-xs font-semibold text-gray-700 dark:text-slate-300 tabular-nums">
                      ₦{availableCreditNaira.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 ml-9">
                    {effectiveCreditNaira > 0
                      ? <>Applies <span className="font-semibold text-teal-700 dark:text-teal-400">₦{effectiveCreditNaira.toLocaleString()}</span> to this purchase. The rest stays on your account.</>
                      : 'Earned by referring friends who become clients.'}
                  </p>
                </div>
              </label>
            </div>
          )}

          {availablePoints > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-6 border border-gray-200 dark:border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-teal-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                      <Gift size={13} className="text-teal-700 dark:text-teal-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Apply reward points
                    </span>
                    <span className="ml-auto text-xs font-semibold text-gray-700 dark:text-slate-300 tabular-nums">
                      {availablePoints} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 ml-9">
                    Worth <span className="font-semibold text-teal-700 dark:text-teal-400">₦{(availablePoints * POINT_TO_NAIRA).toLocaleString()}</span> off any purchase.
                  </p>
                </div>
              </label>
              {usePoints && (
                <div className="mt-4 pl-7">
                  <input
                    type="range"
                    min={0}
                    max={Math.min(availablePoints, Math.floor(priceKobo / 100 / POINT_TO_NAIRA))}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="w-full accent-teal-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                    <span>0 pts</span>
                    <span className="font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                      {pointsToRedeem} pts = ₦{(pointsToRedeem * POINT_TO_NAIRA).toLocaleString()} off
                    </span>
                    <span>{Math.min(availablePoints, Math.floor(priceKobo / 100 / POINT_TO_NAIRA))} pts</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-6 mb-6 border border-gray-100 dark:border-slate-800 text-center">
            {totalDiscountKobo > 0 && (
              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatNGN(priceKobo)}</span>
                </div>
                {effectivePoints > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-slate-300">
                    <span>Points discount</span>
                    <span className="font-medium tabular-nums">-{formatNGN(pointsDiscountKobo)}</span>
                  </div>
                )}
                {voucherDiscountKobo > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-slate-300">
                    <span>Voucher discount</span>
                    <span className="font-medium tabular-nums">-{formatNGN(voucherDiscountKobo)}</span>
                  </div>
                )}
                {creditDiscountKobo > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-slate-300">
                    <span>Referral credit</span>
                    <span className="font-medium tabular-nums">-{formatNGN(creditDiscountKobo)}</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">{formatNGN(chargeNowKobo)}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {installmentChoice > 1
                ? `Charged today · ${formatNGN(finalKobo)} total over ${installmentChoice} months`
                : `One-time payment · ${item.duration}`}
            </p>
          </div>

          <button
            onClick={handlePaystackCheckout}
            disabled={processing}
            className="w-full py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            {processing
              ? 'Redirecting...'
              : installmentChoice > 1
                ? `Pay ${formatNGN(chargeNowKobo)} today with Paystack`
                : `Pay ${formatNGN(finalKobo)} with Paystack`}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-4 flex items-center justify-center gap-1.5">
            <Lock size={11} /> Secured by Paystack. Your card details are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
