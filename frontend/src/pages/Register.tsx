import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, ArrowLeft,
  GraduationCap, Briefcase, User, Mail, Lock, Shield, Sparkles,
  Code2, Smartphone, BarChart3, Zap, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

// ─── Types ──────────────────────────────────────────────────────────────────
type Role = 'student' | 'client';

interface StepConfig {
  id: number;
  label: string;
  icon: typeof User;
}

const steps: StepConfig[] = [
  { id: 1, label: 'Role', icon: Sparkles },
  { id: 2, label: 'Name', icon: User },
  { id: 3, label: 'Email', icon: Mail },
  { id: 4, label: 'Password', icon: Lock },
  { id: 5, label: 'Confirm', icon: Shield },
];

// ─── Left Panel Content Per Step ────────────────────────────────────────────
const panelContent: Record<number, { title: string; subtitle: string; features: string[] }> = {
  1: {
    title: 'Join a community that builds the future',
    subtitle: 'Whether you\'re here to learn or to build — you\'re in the right place.',
    features: [
      'Structured learning programs',
      'Real-world client projects',
      'Expert mentorship & support',
      'A growing pan-African tech network',
    ],
  },
  2: {
    title: 'We\'d love to know you',
    subtitle: 'Your name helps us personalise your experience and connect you with the right people.',
    features: [
      'Personalised dashboard',
      'Custom learning paths',
      'Direct mentor matching',
      'Certificate with your name',
    ],
  },
  3: {
    title: 'Your email is your key',
    subtitle: 'We\'ll use it to send you important updates, course materials, and project notifications.',
    features: [
      'Course & session reminders',
      'Progress reports',
      'Payment receipts',
      'No spam — we promise',
    ],
  },
  4: {
    title: 'Keep your account secure',
    subtitle: 'A strong password protects your data, your progress, and your certificates.',
    features: [
      'End-to-end encryption',
      'Secure payment processing',
      'JWT-based authentication',
      'Your data is never shared',
    ],
  },
  5: {
    title: 'You\'re almost in!',
    subtitle: 'Review your details and launch your journey with E-Bringgs Technologies.',
    features: [
      'Instant access to your dashboard',
      'Start learning or request services',
      'Join live cohorts & sessions',
      'Connect with mentors today',
    ],
  },
};

// ─── Floating Icons (Left Panel Decoration) ─────────────────────────────────
const floatingIcons = [
  { Icon: Code2, top: '12%', left: '8%', delay: '0s', size: 20 },
  { Icon: Smartphone, top: '25%', right: '12%', delay: '1.5s', size: 18 },
  { Icon: BarChart3, bottom: '30%', left: '10%', delay: '3s', size: 22 },
  { Icon: Globe, bottom: '15%', right: '8%', delay: '0.8s', size: 16 },
  { Icon: Zap, top: '55%', left: '85%', delay: '2.2s', size: 14 },
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto mb-8">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-500 ease-out
                  ${isCompleted
                    ? 'bg-teal-600 text-white scale-100 shadow-lg shadow-teal-500/30'
                    : isActive
                      ? 'bg-teal-600 text-white scale-110 shadow-xl shadow-teal-500/40 ring-4 ring-teal-500/20'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 scale-100'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} className="animate-[scaleIn_0.3s_ease-out]" />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <span
                className={`
                  text-[10px] font-semibold mt-1.5 transition-colors duration-300
                  ${isActive ? 'text-teal-600 dark:text-teal-400' : isCompleted ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 -mt-4 relative overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                <div
                  className="absolute inset-y-0 left-0 bg-teal-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: currentStep > step.id ? '100%' : currentStep === step.id ? '50%' : '0%' }}
                />
              </div>
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
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-teal-950 to-cyan-950 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%2314b8a6%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      {/* Glowing orbs */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, delay, size, ...pos }, i) => (
        <div
          key={i}
          className="absolute text-teal-400/20 animate-[float_6s_ease-in-out_infinite]"
          style={{ ...pos, animationDelay: delay } as React.CSSProperties}
        >
          <Icon size={size} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16">
        {/* Logo */}
        <div className="mb-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">EB</span>
            </div>
            <span className="font-bold text-white text-xl">E-Bringgs</span>
          </Link>
        </div>

        {/* Step indicator on left (numbers) */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-teal-400 text-sm font-semibold">Step {currentStep}</span>
          <span className="text-slate-600 text-sm">/</span>
          <span className="text-slate-500 text-sm">5</span>
          <div className="ml-3 flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Animated content */}
        <div
          className={`transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            {content.title}
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            {content.subtitle}
          </p>

          <ul className="space-y-4">
            {content.features.map((feature, i) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-slate-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} className="text-teal-400" />
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

// ─── Main Register Page ─────────────────────────────────────────────────────
export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const { register, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');

  // Password strength
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
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-400'][passwordStrength];

  // Validation per step
  const canProceed = (() => {
    switch (step) {
      case 1: return true; // role always has default
      case 2: return name.trim().length >= 2;
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
    }, 200);
  };

  const next = () => { if (canProceed && step < 5) goTo(step + 1); };
  const back = () => { if (step > 1) goTo(step - 1); };

  // Enter key advances
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < 5 && canProceed) {
      e.preventDefault();
      next();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed || isLoading) return;
    try {
      await register(name.trim(), email.trim(), password, role, referralCode.trim() || undefined);
      logout();
      toast.success('Account created! Please sign in to continue.');
      navigate('/login', { state: { email: email.trim() } });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })?.response?.data;
      const msg = res?.errors?.map(e => e.message).join('. ') || res?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  // Slide animation class
  const slideClass = animating
    ? slideDir === 'left'
      ? 'opacity-0 -translate-x-6'
      : 'opacity-0 translate-x-6'
    : 'opacity-100 translate-x-0';

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950">
      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <LeftPanel currentStep={step} />

      {/* ── Right Panel (Form) ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">EB</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">E-Bringgs</span>
          </Link>
          <Link to="/login" className="text-sm text-teal-600 font-medium">Sign in</Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md" onKeyDown={handleKeyDown}>
            {/* Step indicator */}
            <StepIndicator currentStep={step} />

            {/* Step content */}
            <div
              ref={formRef}
              className={`transition-all duration-300 ease-out ${slideClass}`}
            >
              {/* ── Step 1: Role ──────────────────────────────────── */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">How will you use E-Bringgs?</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Choose the option that best describes you.</p>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`w-full group relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        role === 'student'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 shadow-lg shadow-teal-500/10'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        role === 'student' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                      }`}>
                        <GraduationCap size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">Student</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">I want to learn web development, mobile development, UI/UX design, or data analysis.</p>
                      </div>
                      {role === 'student' && (
                        <CheckCircle2 size={20} className="absolute top-4 right-4 text-teal-600" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`w-full group relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        role === 'client'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 shadow-lg shadow-teal-500/10'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        role === 'client' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                      }`}>
                        <Briefcase size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">Client</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">I need professional services — website, web app, mobile app, or design.</p>
                      </div>
                      {role === 'client' && (
                        <CheckCircle2 size={20} className="absolute top-4 right-4 text-teal-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Name ──────────────────────────────────── */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">What's your name?</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">This is how you'll appear on the platform.</p>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      placeholder="e.g. Chinedu Okafor"
                      className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
                    />
                  </div>
                  {name.length > 0 && name.trim().length < 2 && (
                    <p className="text-xs text-amber-500 mt-2">Please enter at least 2 characters</p>
                  )}
                </div>
              )}

              {/* ── Step 3: Email ─────────────────────────────────── */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">What's your email?</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">We'll send verification and important updates here.</p>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
                    />
                  </div>
                  {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                    <p className="text-xs text-amber-500 mt-2">Please enter a valid email address</p>
                  )}
                </div>
              )}

              {/* ── Step 4: Password ──────────────────────────────── */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create a password</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Must be at least 8 characters. Mix letters, numbers, and symbols for best security.</p>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      placeholder="Min. 8 characters"
                      className="w-full pl-11 pr-12 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-4">
                      <div className="flex gap-1.5 h-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-500 ${
                              i <= passwordStrength ? strengthColor : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{strengthLabel} password</p>

                      {/* Password hints */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {[
                          { label: '8+ characters', met: password.length >= 8 },
                          { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                          { label: 'Number', met: /[0-9]/.test(password) },
                          { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
                        ].map((hint) => (
                          <div key={hint.label} className="flex items-center gap-1.5">
                            <CheckCircle2
                              size={12}
                              className={`shrink-0 transition-colors ${hint.met ? 'text-green-500' : 'text-gray-300 dark:text-slate-600'}`}
                            />
                            <span className={`text-xs ${hint.met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                              {hint.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 5: Confirm ───────────────────────────────── */}
              {step === 5 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Review & create account</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Make sure everything looks good before we set you up.</p>

                  {/* Summary cards */}
                  <div className="space-y-3 mb-8">
                    {[
                      { label: 'Account type', value: role === 'student' ? 'Student' : 'Client', icon: role === 'student' ? GraduationCap : Briefcase, editable: 1 },
                      { label: 'Full name', value: name, icon: User, editable: 2 },
                      { label: 'Email', value: email, icon: Mail, editable: 3 },
                      { label: 'Password', value: '••••••••', icon: Lock, editable: 4 },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                            <ItemIcon size={16} className="text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">{item.label}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.value}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => goTo(item.editable)}
                            className="text-xs text-teal-600 dark:text-teal-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Referral code (students only, optional) */}
                  {role === 'student' && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                      <label className="block">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Referral code
                          </span>
                          <span className="text-[10px] uppercase tracking-wide font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        </div>
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Enter friend's code (e.g. K7M2X9P3)"
                          maxLength={8}
                          className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono tracking-wider uppercase"
                        />
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                          Got a code from a friend? Enter it here so they earn rewards when you enrol in a program.
                        </p>
                      </label>
                    </div>
                  )}

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer select-none mb-2">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-slate-600 peer-checked:border-teal-600 peer-checked:bg-teal-600 transition-all flex items-center justify-center">
                        {agreeTerms && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-slate-400 leading-snug">
                      I agree to the{' '}
                      <Link to="/terms" className="text-teal-600 hover:underline font-medium">Terms of Service</Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* ── Navigation Buttons ─────────────────────────────── */}
            <div className="flex items-center gap-3 mt-10">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canProceed}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    canProceed
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5'
                      : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed || isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    canProceed && !isLoading
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5'
                      : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                  ) : (
                    <><Sparkles size={16} /> Create my account</>
                  )}
                </button>
              )}
            </div>

            {/* Sign in link */}
            <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-800 dark:hover:text-teal-400 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Global CSS for animations ───────────────────────────────── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(3deg); }
          66% { transform: translateY(6px) rotate(-2deg); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
