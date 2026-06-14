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
  // ─── Current tracks (kept in sync with Pricing.tsx trainingCategories) ─
  // Frontend Development
  'frontend-starter': { name: 'Frontend — Starter',         price: 75000,  duration: '8 weeks',  description: 'Live instructor-led HTML, CSS, JS, TS, React + Tailwind classes' },
  'frontend-cohort':  { name: 'Frontend — Live Cohort',     price: 250000, duration: '12 weeks', description: 'Intensive 12-week React cohort — build & ship a real app' },
  'frontend-mentor':  { name: 'Frontend — Mentorship',      price: 450000, duration: '12 weeks', description: 'Weekly 1-on-1 sessions with a senior frontend engineer' },
  // Backend Development
  'backend-starter':  { name: 'Backend — Starter',          price: 80000,  duration: '8 weeks',  description: 'Live classes building REST APIs with Node, Express, MongoDB' },
  'backend-cohort':   { name: 'Backend — Live Cohort',      price: 270000, duration: '12 weeks', description: 'Ship a real production API — auth, payments, deployment' },
  'backend-mentor':   { name: 'Backend — Mentorship',       price: 480000, duration: '12 weeks', description: 'Weekly 1-on-1 sessions with a senior backend engineer' },
  // Full-Stack Development
  'fullstack-starter': { name: 'Full-Stack — Starter',      price: 100000, duration: '10 weeks', description: 'Live classes covering both halves of a modern web app' },
  'fullstack-cohort':  { name: 'Full-Stack — Live Cohort',  price: 320000, duration: '14 weeks', description: 'Ship a real full-stack product to production' },
  'fullstack-mentor':  { name: 'Full-Stack — Mentorship',   price: 550000, duration: '14 weeks', description: 'Weekly 1-on-1 sessions with a senior full-stack engineer' },
  // Mobile App Development
  'mobile-dev-starter': { name: 'Mobile — Starter',         price: 85000,  duration: '8 weeks',  description: 'Live instructor-led React Native + Expo classes' },
  'mobile-dev-cohort':  { name: 'Mobile — Live Cohort',     price: 280000, duration: '10 weeks', description: 'Intensive 10-week cohort — build & ship a real app to TestFlight + Play' },
  'mobile-dev-mentor':  { name: 'Mobile — Mentorship',      price: 500000, duration: '12 weeks', description: 'Weekly 1-on-1 sessions with a senior mobile engineer' },
  // Research Writing
  'research-writing-starter': { name: 'Research Writing — Starter',    price: 50000,  duration: '6 weeks',  description: 'Live classes on academic writing, citations, methodology' },
  'research-writing-cohort':  { name: 'Research Writing — Live Cohort', price: 150000, duration: '8 weeks',  description: '8-week intensive — methodology + journal-ready writing' },
  'research-writing-mentor':  { name: 'Research Writing — Mentorship', price: 320000, duration: '12 weeks', description: 'Personal mentorship — your paper, your timeline' },

  // ─── Legacy IDs (backwards compatibility for existing cohorts) ─────────
  // These map to the closest current track. Don't remove unless you've
  // migrated every Cohort document in the DB to a new planId.
  'web-dev-starter':  { name: 'Web Dev — Starter (legacy)',     price: 75000,  duration: '8 weeks',  description: 'Legacy — use frontend-starter or fullstack-starter for new cohorts' },
  'web-dev-cohort':   { name: 'Web Dev — Live Cohort (legacy)', price: 250000, duration: '12 weeks', description: 'Legacy — use frontend-cohort or fullstack-cohort for new cohorts' },
  'web-dev-mentor':   { name: 'Web Dev — Mentorship (legacy)',  price: 450000, duration: '12 weeks', description: 'Legacy — use frontend-mentor or fullstack-mentor for new cohorts' },
  'uiux-starter':     { name: 'UI/UX — Starter (legacy)',   price: 60000,  duration: '6 weeks',  description: 'Legacy — UI/UX track has been retired' },
  'uiux-cohort':      { name: 'UI/UX — Cohort (legacy)',    price: 200000, duration: '8 weeks',  description: 'Legacy — UI/UX track has been retired' },
  'uiux-mentor':      { name: 'UI/UX — Mentorship (legacy)', price: 380000, duration: '10 weeks', description: 'Legacy — UI/UX track has been retired' },
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

  // Voucher redemption
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<null | { code: string; nairaValue: number; note?: string }>(null);
  const [voucherError, setVoucherError] = useState('');

  // Installment payments — 1× (default) | 2× | 3×
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
  const totalDiscountKobo = pointsDiscountKobo + voucherDiscountKobo;
  const finalKobo = Math.max(priceKobo - totalDiscountKobo, 0);

  // Installment eligibility — services use the server-decorated flag; training
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
      ...(installmentChoice > 1
        ? { installments: installmentChoice, autoChargeConsent }
        : {}),
      // Service vs plan branching — server uses the catalog price when
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

  // Keep `processing` semantics for the existing button — the navigation
  // away on success leaves the spinner showing until the new page loads.
  const processing = initializePayment.isPending || initializePayment.isSuccess;

  const backLink = item.type === 'service' ? `/services/${item.id}` : '/pricing';
  const backLabel = item.type === 'service' ? 'Back to service' : 'Back to pricing';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
        {/* Order summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <Link to={backLink} className="inline-flex items-center gap-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> {backLabel}
          </Link>

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

          {/* Installment selector — 1×/2×/3× */}
          <InstallmentSelector
            totalKobo={priceKobo}
            value={installmentChoice}
            onChange={setInstallmentChoice}
            consent={autoChargeConsent}
            onConsentChange={setAutoChargeConsent}
            eligible={installmentEligible}
          />

          {/* Gift voucher */}
          <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 rounded-xl p-5 mb-4 border border-purple-100 dark:border-purple-900">
            <div className="flex items-center gap-1.5 mb-3">
              <Ticket size={14} className="text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Have a gift voucher?</span>
            </div>
            {appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300 block truncate">
                    {appliedVoucher.code}
                  </code>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ₦{appliedVoucher.nairaValue.toLocaleString()} discount applied
                  </p>
                  {appliedVoucher.note && (
                    <p className="text-[10px] italic text-gray-400 dark:text-slate-500">"{appliedVoucher.note}"</p>
                  )}
                </div>
                <button
                  onClick={removeVoucher}
                  className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900 rounded text-gray-400 hover:text-red-600"
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
                    className="flex-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm font-mono uppercase placeholder-gray-400"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={voucherChecking || !voucherInput.trim()}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60"
                  >
                    {voucherChecking ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {voucherError && <p className="text-xs text-red-600 mt-1">{voucherError}</p>}
              </>
            )}
          </div>

          {availablePoints > 0 && (
            <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-xl p-5 mb-6 border border-emerald-100 dark:border-emerald-900">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Gift size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Apply your reward points
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    You have <span className="font-bold text-emerald-600 dark:text-emerald-400">{availablePoints} points</span>
                    {' '}(worth ₦{(availablePoints * POINT_TO_NAIRA).toLocaleString()})
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
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                    <span>0 pts</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Points discount</span>
                    <span>-{formatNGN(pointsDiscountKobo)}</span>
                  </div>
                )}
                {voucherDiscountKobo > 0 && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400 font-medium">
                    <span>Voucher discount</span>
                    <span>-{formatNGN(voucherDiscountKobo)}</span>
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
