import { Calendar, Zap, AlertCircle } from 'lucide-react';

/**
 * The Checkout-page selector: 1× / 2× / 3× monthly installments.
 *
 * Pure presentational — parent owns the state (which option is selected, and
 * the auto-charge consent checkbox). Renders a 3-card radio group + the live
 * schedule preview + the required consent checkbox when 2× or 3× is chosen.
 *
 * The parent (Checkout.tsx) wires the selection into the InitializePayment
 * payload — `installments` + `autoChargeConsent`. Server validates eligibility.
 */

export type InstallmentChoice = 1 | 2 | 3;

interface Props {
  /** Full price in kobo (the item's totalAmount before any installment splitting). */
  totalKobo: number;
  /** Currently-selected option. */
  value: InstallmentChoice;
  onChange: (v: InstallmentChoice) => void;
  /** Auto-charge consent state (parent-controlled). Required true when value > 1. */
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  /**
   * Whether this item is eligible at all (e.g. price ≥ ₦200,000). When false,
   * the component renders only the 1× option and a small explanatory note —
   * keeps the layout consistent with eligible items but disables splitting.
   */
  eligible: boolean;
}

function formatNGN(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(kobo / 100);
}

function addMonths(date: Date, months: number): Date {
  // Simple +30-day step (matches the backend's installment schedule).
  return new Date(date.getTime() + months * 30 * 24 * 60 * 60 * 1000);
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function InstallmentSelector({
  totalKobo, value, onChange, consent, onConsentChange, eligible,
}: Props) {
  const perInstallment2 = Math.round(totalKobo / 2);
  const perInstallment3 = Math.round(totalKobo / 3);
  const today = new Date();

  const options: Array<{
    choice: InstallmentChoice;
    label: string;
    chargeNow: number;
    schedule: string;
    icon: typeof Zap;
  }> = [
    {
      choice: 1,
      label: 'Pay in full',
      chargeNow: totalKobo,
      schedule: `One payment of ${formatNGN(totalKobo)}`,
      icon: Zap,
    },
    {
      choice: 2,
      label: '2× monthly',
      chargeNow: perInstallment2,
      schedule: `${formatNGN(perInstallment2)} today, ${formatNGN(perInstallment2)} on ${formatShortDate(addMonths(today, 1))}`,
      icon: Calendar,
    },
    {
      choice: 3,
      label: '3× monthly',
      chargeNow: perInstallment3,
      schedule: `${formatNGN(perInstallment3)} today, then ${formatShortDate(addMonths(today, 1))} & ${formatShortDate(addMonths(today, 2))}`,
      icon: Calendar,
    },
  ];

  const visibleOptions = eligible ? options : options.slice(0, 1);

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-5 mb-4 border border-blue-100 dark:border-blue-900">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Choose your payment plan
      </p>

      <div className="space-y-2">
        {visibleOptions.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.choice;
          return (
            <label
              key={opt.choice}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selected
                  ? 'border-teal-500 bg-white dark:bg-slate-900'
                  : 'border-transparent bg-white/60 dark:bg-slate-900/40 hover:border-teal-200 dark:hover:border-teal-800'
              }`}
            >
              <input
                type="radio"
                name="installment-choice"
                checked={selected}
                onChange={() => onChange(opt.choice)}
                className="mt-1 w-4 h-4 accent-teal-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-teal-600 shrink-0" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {opt.label}
                  </span>
                  {selected && (
                    <span className="text-xs font-bold text-teal-600 ml-auto">
                      {formatNGN(opt.chargeNow)} today
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {opt.schedule}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {!eligible && (
        <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 flex items-start gap-1.5">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          Installment payments are available on items above ₦200,000.
        </p>
      )}

      {/* Auto-charge consent — required when splitting */}
      {value > 1 && (
        <label className="mt-4 flex items-start gap-2.5 cursor-pointer bg-white/60 dark:bg-slate-900/40 px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-teal-600"
          />
          <span className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
            I authorise E-Bringgs to automatically charge my card for the remaining
            installments on their due dates. I can cancel anytime by contacting support.
          </span>
        </label>
      )}
    </div>
  );
}
