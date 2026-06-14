import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Apple's JS SDK is attached to the global window. Minimal typing — enough
// to call init + signIn without pulling extra packages.
interface AppleIDAuth {
  init(opts: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }): void;
  signIn(): Promise<{
    authorization: { id_token: string; code: string; state?: string };
    user?: { name?: { firstName?: string; lastName?: string } };
  }>;
}
declare global {
  interface Window {
    AppleID?: { auth: AppleIDAuth };
  }
}

interface SocialAuthButtonsProps {
  onSuccess: (role?: string) => void;
  role?: 'student' | 'client';
  referralCode?: string;
}

export default function SocialAuthButtons({ onSuccess, role, referralCode }: SocialAuthButtonsProps) {
  const { loginWithGoogle, loginWithApple } = useAuthStore();
  const [appleBusy, setAppleBusy] = useState(false);
  const appleReady = useRef(false);

  // Lazy-load Apple's JS SDK only when configured.
  useEffect(() => {
    if (!APPLE_CLIENT_ID || appleReady.current) return;
    const init = () => {
      window.AppleID?.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: APPLE_REDIRECT_URI || window.location.origin,
        usePopup: true,
      });
      appleReady.current = true;
    };
    if (window.AppleID) return init();
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, []);

  const handleGoogleCredential = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error('Google sign-in failed.');
      return;
    }
    try {
      await loginWithGoogle(response.credential, { role, referralCode });
      toast.success('Welcome!');
      onSuccess(useAuthStore.getState().user?.role);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Google sign-in failed. Please try again.';
      toast.error(msg);
    }
  };

  const handleAppleClick = async () => {
    if (!APPLE_CLIENT_ID) {
      toast.error('Apple sign-in is not configured yet.');
      return;
    }
    if (!window.AppleID) {
      toast.error('Apple sign-in is still loading. Try again in a moment.');
      return;
    }
    setAppleBusy(true);
    try {
      const result = await window.AppleID.auth.signIn();
      const idToken = result.authorization?.id_token;
      if (!idToken) throw new Error('Apple did not return an ID token.');
      const fullName = [result.user?.name?.firstName, result.user?.name?.lastName]
        .filter(Boolean)
        .join(' ') || undefined;
      await loginWithApple(idToken, { name: fullName, role, referralCode });
      toast.success('Welcome!');
      onSuccess(useAuthStore.getState().user?.role);
    } catch (err) {
      // Apple's SDK rejects on user-cancel — only surface real backend errors.
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg) toast.error(msg);
    } finally {
      setAppleBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Google — official rendered button, sized to our row */}
      <div className="flex items-stretch [&>div]:flex-1 [&>div>div]:w-full!">
        {GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={handleGoogleCredential}
            onError={() => toast.error('Google sign-in was cancelled.')}
            text="continue_with"
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        ) : (
          <DisabledButton label="Google sign-in not configured" />
        )}
      </div>

      {/* Apple — custom button (Apple has no React component) */}
      <button
        type="button"
        onClick={handleAppleClick}
        disabled={appleBusy || !APPLE_CLIENT_ID}
        className="flex items-center justify-center gap-3 py-3 rounded-lg bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 transition-colors text-sm font-semibold text-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {appleBusy ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <AppleGlyph />
        )}
        <span>Continue with Apple</span>
      </button>
    </div>
  );
}

function DisabledButton({ label }: { label: string }) {
  return (
    <div className="w-full flex items-center justify-center py-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
      {label}
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.03-3.18 2.6-4.7 2.71-4.78-1.48-2.17-3.78-2.46-4.6-2.49-1.96-.2-3.83 1.16-4.83 1.16-1.01 0-2.55-1.13-4.19-1.1-2.16.03-4.14 1.25-5.25 3.18-2.25 3.9-.57 9.65 1.61 12.81 1.07 1.55 2.34 3.28 4 3.21 1.6-.06 2.21-1.04 4.14-1.04s2.48 1.04 4.17 1c1.72-.03 2.81-1.56 3.86-3.12 1.22-1.78 1.72-3.52 1.74-3.61-.04-.02-3.34-1.28-3.36-5.07zM13.84 3.07c.88-1.06 1.47-2.54 1.31-4.01-1.27.05-2.8.85-3.7 1.91-.81.93-1.52 2.43-1.33 3.87 1.41.11 2.85-.71 3.72-1.77z" />
    </svg>
  );
}
