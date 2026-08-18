import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Loader2, Check, ArrowRight, ArrowLeft,
  GraduationCap, Briefcase, Mail, Lock, User, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@ebringgs/auth';
import { useSEO } from '@ebringgs/ui';
import SocialAuthButtons, { SOCIAL_AUTH_ENABLED } from '../components/auth/SocialAuthButtons';

/**
 * Sign-up wizard.
 *
 * DARK ONLY, deliberately. Every colour here is unconditional rather than a
 * `dark:` variant, so the page renders as designed regardless of the theme
 * store. The light-mode treatment is still to be specified; when it lands,
 * these become the dark half of a pair.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
type Role = 'student' | 'client';

const STEPS = [
  { id: 1, label: 'Role' },
  { id: 2, label: 'Name' },
  { id: 3, label: 'Email' },
  { id: 4, label: 'Security' },
  { id: 5, label: 'Confirm' },
];

const BRAND_MARK = '/ebrings/short.png';

// The selling points don't change as you advance — the wizard already tells
// you where you are, so re-listing different benefits each step just adds
// noise to read past.
const FEATURES = [
  'Structured learning programs paired with real projects',
  'Professional engineering & digital strategy design services',
  'Continuous expert tech mentorship from industry leaders',
  'Collaborative, vibrant Pan-African developer network',
];

const panelContent: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Join a community that builds the future',
    subtitle: "Whether you're here to learn or to build, you're in the right place. Set up your profile to start mapping your journey.",
  },
  2: {
    title: 'Tell us who you are',
    subtitle: "We personalize your ebringgs experience based on your name and background. Let's start with the basics.",
  },
  3: {
    title: 'Stay connected',
    subtitle: 'Receive critical course updates, project coordination pings, and live session links direct to your verified channels.',
  },
  4: {
    title: 'Keep your account secure',
    subtitle: 'A strong password protects your progress, your certificates, and your payment history.',
  },
  5: {
    title: "You're almost in",
    subtitle: 'Review your details and launch your journey with ebringgs technologies.',
  },
};

const formContent: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'How will you use E-Bringgs?', subtitle: 'Choose the option that best describes you. This helps customize your portal.' },
  2: { title: 'What should we call you?', subtitle: 'Please enter your real legal name to ensure certificate authenticity.' },
  3: { title: 'Your email address', subtitle: "We'll send a verification link here next." },
  4: { title: 'Secure your account', subtitle: 'Choose a password you can remember but nobody else can guess.' },
  5: { title: 'Review and confirm', subtitle: 'Check everything reads right before we create your account.' },
};

// ─── Brand mark ─────────────────────────────────────────────────────────────
// The source file is 3:2 with the artwork centred in transparent padding, so
// it renders oversized inside a clipped box to sit flush with its container.
function BrandMark({ height }: { height: number }) {
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden shrink-0"
      style={{ height, width: height }}
    >
      <img
        src={BRAND_MARK}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ height: height * 1.14, width: 'auto', maxWidth: 'none' }}
      />
    </span>
  );
}

function Wordmark({ height = 34 }: { height?: number }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark height={height} />
      <span className="text-2xl font-extrabold tracking-tight text-white">ebringgs</span>
    </span>
  );
}

// ─── Stepper ────────────────────────────────────────────────────────────────
// Completed nodes are clickable so you can jump back and correct an earlier
// answer. This is the only way back through the wizard — the design has no
// separate Back button on the desktop layout.
function Stepper({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  return (
    <div className="flex items-start justify-center gap-1 sm:gap-2">
      {STEPS.map((s, idx) => {
        const done = current > s.id;
        const active = current === s.id;
        const reached = done || active;

        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => done && onJump(s.id)}
                disabled={!done}
                aria-current={active ? 'step' : undefined}
                aria-label={`Step ${s.id}: ${s.label}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  reached
                    ? 'bg-cyan-400 text-slate-950'
                    : 'border border-slate-700 text-slate-600'
                } ${done ? 'cursor-pointer hover:bg-cyan-300' : 'cursor-default'}`}
              >
                {s.id}
              </button>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  active ? 'text-cyan-400' : done ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {s.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <span
                className={`mt-4 h-px w-6 sm:w-10 shrink-0 transition-colors ${
                  done ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Left Panel ─────────────────────────────────────────────────────────────
function LeftPanel({ currentStep }: { currentStep: number }) {
  const content = panelContent[currentStep];
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="relative hidden overflow-hidden bg-[#0a1210] lg:flex lg:w-1/2">
      {/* Flat field with two very low-opacity brand glows — the same treatment
          as the sign-in panel, so the two pages read as one system. */}
      <div className="absolute inset-0 bg-[radial-gradient(110%_75%_at_18%_30%,rgba(34,211,238,0.10),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(85%_55%_at_85%_92%,rgba(13,148,136,0.08),transparent_60%)]" />

      <div className="relative z-10 flex w-full flex-col px-12 py-14 xl:px-16">
        <Link to="/" className="shrink-0 self-start">
          <Wordmark />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-12">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Step {currentStep} of {STEPS.length}
            </p>
            <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-[width] duration-500 ease-out"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>

            <div
              className={`transition-all duration-500 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
              }`}
            >
              <h2 className="mt-10 text-4xl font-extrabold leading-[1.12] tracking-tight text-white xl:text-5xl">
                {content.title}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-400 xl:text-lg">
                {content.subtitle}
              </p>
            </div>

            <ul className="mt-12 space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-cyan-400/10">
                    <Check size={12} className="text-cyan-400" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="shrink-0 text-xs text-slate-600">
          © {new Date().getFullYear()} ebringgs inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ─── Field wrapper ──────────────────────────────────────────────────────────
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm text-slate-300">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-[#111823] px-4 py-3.5 text-sm text-white ' +
  'placeholder-slate-600 outline-none transition-colors focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10';

// ─── Main Register Page ─────────────────────────────────────────────────────
export default function Register() {
  useSEO({ title: 'Create account', description: 'Create your E-Bringgs account — join a cohort or hire our team.', noIndex: true });

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  // Collected per the design but NOT submitted — /auth/register accepts only
  // name, email, password, role and referralCode. Wiring this through needs a
  // backend field first.
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');

  const { register, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-cyan-400'][passwordStrength];

  const canProceed = (() => {
    switch (step) {
      case 1: return true; // role always has a default
      case 2: return firstName.trim().length >= 2 && lastName.trim().length >= 2;
      case 3: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case 4: return password.length >= 8;
      case 5: return agreeTerms;
      default: return false;
    }
  })();

  const goTo = (target: number) => {
    if (animating || target === step) return;
    setSlideDir(target > step ? 'left' : 'right');
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setTimeout(() => setAnimating(false), 50);
    }, 180);
  };

  const next = () => { if (canProceed && step < STEPS.length) goTo(step + 1); };
  const back = () => { if (step > 1) goTo(step - 1); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < STEPS.length && canProceed) {
      e.preventDefault();
      next();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed || isLoading) return;
    try {
      await register(fullName, email.trim(), password, role, referralCode.trim() || undefined);
      logout();
      toast.success('Account created! Please sign in to continue.');
      navigate('/login', { state: { email: email.trim() } });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })?.response?.data;
      const msg = res?.errors?.map(e => e.message).join('. ') || res?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  const slideClass = animating
    ? slideDir === 'left' ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4'
    : 'opacity-100 translate-x-0';

  const form = formContent[step];

  return (
    <div className="flex min-h-screen bg-[#080c11]">
      <LeftPanel currentStep={step} />

      {/* ── Right panel (form) ──────────────────────────────────────── */}
      <div className="flex min-h-screen w-full flex-col lg:w-1/2 lg:border-l lg:border-white/[0.06]">
        {/* Mobile header — the left panel is hidden below lg, so the brand
            and the step progress have to appear here instead. */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 lg:hidden">
          <Link to="/">
            <Wordmark height={26} />
          </Link>
          <Link to="/login" className="text-sm font-medium text-cyan-400">Sign in</Link>
        </div>

        <div className="flex flex-1 flex-col px-6 py-10 lg:px-14 lg:py-14">
          <Stepper current={step} onJump={goTo} />

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-lg py-12" onKeyDown={handleKeyDown}>
              <div className={`transition-all duration-300 ease-out ${slideClass}`}>
                <h1 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {form.title}
                </h1>
                <p className="mt-3 text-center text-sm text-slate-400">
                  {form.subtitle}
                </p>

                <div className="mt-10">
                  {/* ── Step 1: Role ────────────────────────────────── */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {SOCIAL_AUTH_ENABLED && (
                        <>
                          <SocialAuthButtons
                            role={role}
                            referralCode={referralCode.trim() || undefined}
                            onSuccess={(socialRole) => {
                              const adminUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined) || 'https://admin.ebringgs.com';
                              const teacherUrl = (import.meta.env.VITE_TEACHER_URL as string | undefined) || 'https://teachers.ebringgs.com';
                              if (socialRole === 'admin') window.location.href = adminUrl;
                              else if (socialRole === 'teacher') window.location.href = teacherUrl;
                              else if (socialRole === 'client') navigate('/client');
                              else navigate('/dashboard');
                            }}
                          />
                          <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-slate-800" />
                            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
                              or pick a role to sign up with email
                            </span>
                            <div className="h-px flex-1 bg-slate-800" />
                          </div>
                        </>
                      )}

                      {([
                        { id: 'student', Icon: GraduationCap, title: 'Student', body: 'I want to learn software development, product management, UI/UX design, or data science.' },
                        { id: 'client', Icon: Briefcase, title: 'Client', body: 'I need professional consulting, development services, custom digital products, or integrations.' },
                      ] as const).map(({ id, Icon, title, body }) => {
                        const selected = role === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setRole(id)}
                            aria-pressed={selected}
                            className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                              selected
                                ? 'border-cyan-400 bg-cyan-400/[0.04]'
                                : 'border-slate-800 bg-[#0e141c] hover:border-slate-700'
                            }`}
                          >
                            <span
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                selected ? 'bg-cyan-400/10 text-cyan-400' : 'bg-slate-800/60 text-slate-500'
                              }`}
                            >
                              <Icon size={22} />
                            </span>
                            <span className="flex-1">
                              <span className="block font-bold text-white">{title}</span>
                              <span className="mt-1 block text-sm leading-relaxed text-slate-400">{body}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Step 2: Name ────────────────────────────────── */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <Field label="First name">
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          autoFocus
                          placeholder="e.g., John"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Last name">
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g., Doe"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  )}

                  {/* ── Step 3: Email ───────────────────────────────── */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <Field label="Email address">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Mail size={18} />
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                            placeholder="john.doe@example.com"
                            className={`${inputClass} pl-12`}
                          />
                        </div>
                      </Field>
                      <Field label="Phone number" hint="Optional (for SMS pings)">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+234 803 123 4567"
                          className={inputClass}
                        />
                      </Field>
                      {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                        <p className="text-xs text-amber-400">Please enter a valid email address</p>
                      )}
                    </div>
                  )}

                  {/* ── Step 4: Security ────────────────────────────── */}
                  {step === 4 && (
                    <div className="space-y-5">
                      <Field label="Password" hint="Minimum 8 characters">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Lock size={18} />
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            placeholder="••••••••"
                            className={`${inputClass} pl-12 pr-12`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </Field>

                      {password.length > 0 && (
                        <div>
                          <div className="flex h-1.5 gap-1.5">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-colors duration-300 ${
                                  i <= passwordStrength ? strengthColor : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{strengthLabel} password</p>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {[
                              { label: '8+ characters', met: password.length >= 8 },
                              { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                              { label: 'Number', met: /[0-9]/.test(password) },
                              { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
                            ].map((hint) => (
                              <div key={hint.label} className="flex items-center gap-2">
                                <Check
                                  size={12}
                                  strokeWidth={3}
                                  className={`shrink-0 ${hint.met ? 'text-cyan-400' : 'text-slate-700'}`}
                                />
                                <span className={`text-xs ${hint.met ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {hint.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Step 5: Confirm ─────────────────────────────── */}
                  {step === 5 && (
                    <div>
                      <div className="space-y-3">
                        {[
                          { label: 'Account type', value: role === 'student' ? 'Student' : 'Client', Icon: role === 'student' ? GraduationCap : Briefcase, editable: 1 },
                          { label: 'Full name', value: fullName, Icon: User, editable: 2 },
                          { label: 'Email', value: email, Icon: Mail, editable: 3 },
                          { label: 'Password', value: '••••••••', Icon: Shield, editable: 4 },
                        ].map(({ label, value, Icon, editable }) => (
                          <div
                            key={label}
                            className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0e141c] p-4"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                              <Icon size={16} className="text-cyan-400" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                              <span className="block truncate text-sm font-medium text-white">{value}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => goTo(editable)}
                              className="text-xs font-medium text-cyan-400 opacity-0 transition-opacity hover:underline focus:opacity-100 group-hover:opacity-100"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Referral code — students earn points, clients earn naira credit */}
                      <div className="mt-6 rounded-xl border border-slate-800 bg-[#0e141c] p-4">
                        <label className="block">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">Referral code</span>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Optional
                            </span>
                          </div>
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="Enter friend's code (e.g. K7M2X9P3)"
                            maxLength={8}
                            className={`${inputClass} font-mono uppercase tracking-wider`}
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            {role === 'student'
                              ? 'Got a code from a friend? Enter it here so they earn rewards when you enrol in a program.'
                              : 'Got a code from a friend? Enter it here so they earn ₦20,000 credit when your first project payment clears.'}
                          </p>
                        </label>
                      </div>

                      {/* Terms */}
                      <label className="mt-6 flex cursor-pointer select-none items-start gap-3">
                        <span className="relative mt-0.5">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="peer sr-only"
                          />
                          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-slate-700 transition-colors peer-checked:border-cyan-400 peer-checked:bg-cyan-400">
                            {agreeTerms && <Check size={12} strokeWidth={3} className="text-slate-950" />}
                          </span>
                        </span>
                        <span className="text-sm leading-snug text-slate-400">
                          I agree to the{' '}
                          <Link to="/terms" className="font-medium text-cyan-400 hover:underline">Terms of Service</Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="font-medium text-cyan-400 hover:underline">Privacy Policy</Link>
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Continue / Submit ──────────────────────────────── */}
              <div className="mt-8">
                {step < STEPS.length ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canProceed}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-colors ${
                      canProceed
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                        : 'cursor-not-allowed bg-slate-800 text-slate-600'
                    }`}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canProceed || isLoading}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-colors ${
                      canProceed && !isLoading
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                        : 'cursor-not-allowed bg-slate-800 text-slate-600'
                    }`}
                  >
                    {isLoading
                      ? <><Loader2 size={18} className="animate-spin" /> Creating account…</>
                      : 'Create my account'}
                  </button>
                )}

                {/* Below lg the stepper nodes are cramped, so give small
                    screens an explicit way back through the wizard. */}
                {step > 1 && (
                  <button
                    type="button"
                    onClick={back}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-slate-400 transition-colors hover:text-white lg:hidden"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
              </div>

              <p className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-cyan-400 hover:underline">Sign in</Link>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-3 text-xs text-slate-500">
            <Link to="/contact" className="transition-colors hover:text-slate-300">Help</Link>
            <span aria-hidden="true">•</span>
            <Link to="/privacy" className="transition-colors hover:text-slate-300">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
