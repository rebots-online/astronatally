import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  cancelNativeSignIn, describeSignInFailure, emailSignIn, emailSignUp,
  isNativeAuth, nativePhoneSignIn, resetEmailPassword, startPhoneSignIn,
  type PhoneSignInSession,
} from '../platform/firebase';
import './sign-in.css';

type AuthView = 'choose' | 'email' | 'register' | 'reset' | 'phone' | 'code';

export interface SignInPanelProps {
  onClose(): void;
  onGoogle(): Promise<void>;
  initialMethod?: 'email' | 'phone';
  googleError?: string | null;
  continueOnApp?: boolean;
}

export function SignInPanel({ onClose, onGoogle, initialMethod, googleError, continueOnApp = false }: SignInPanelProps) {
  const [view, setView] = useState<AuthView>(initialMethod ?? 'choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<PhoneSignInSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nativePendingRef = useRef(false);
  const pendingRef = useRef(false);
  const epochRef = useRef(0);
  const mountedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const id = useId();
  const native = isNativeAuth();
  const current = (epoch: number) => mountedRef.current && epoch === epochRef.current;
  const clearPhone = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current?.dispose();
    sessionRef.current = null;
    if (nativePendingRef.current) {
      nativePendingRef.current = false;
      void cancelNativeSignIn().catch(() => {});
    }
  };
  const abandon = () => {
    epochRef.current += 1;
    pendingRef.current = false;
    clearPhone();
  };
  const close = () => { abandon(); onCloseRef.current(); };
  const changeView = (next: AuthView) => {
    abandon();
    setPending(false);
    setPassword('');
    setConfirmation('');
    setCode('');
    setError(null);
    setStatus(null);
    setView(next);
  };
  const choose = (method: 'email' | 'phone') => {
    if (continueOnApp && !native) {
      window.location.assign(`https://asknatally.online/?auth=${method}`);
      return;
    }
    changeView(method);
    if (method === 'phone' && native) void requestCode();
  };
  const begin = (): number | null => {
    if (pendingRef.current) return null;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    setStatus(null);
    epochRef.current += 1;
    return epochRef.current;
  };
  const finish = (epoch: number) => {
    if (!current(epoch)) return;
    pendingRef.current = false;
    setPending(false);
  };

  useEffect(() => {
    mountedRef.current = true;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), a[href], iframe, [tabindex="0"]',
      ) ?? []).filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLIFrameElement && event.target.src.includes('/recaptcha/')) return;
      if (event.target instanceof Node && !panelRef.current?.contains(event.target)) panelRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => {
      mountedRef.current = false;
      abandon();
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[data-sign-in-focus]') ?? [])
      .find(element => element.getClientRects().length > 0)?.focus();
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [view]);

  const google = () => {
    const epoch = begin();
    if (epoch === null) return;
    // Preserve the browser gesture: call the shell before any await.
    try {
      void onGoogle().catch(cause => {
        if (current(epoch)) setError(describeSignInFailure(cause));
      }).finally(() => finish(epoch));
    } catch (cause) {
      if (current(epoch)) setError(describeSignInFailure(cause));
      finish(epoch);
    }
  };
  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (view === 'register' && password !== confirmation) {
      setError('The passwords do not match. Enter the same password in both fields.');
      return;
    }
    const epoch = begin();
    if (epoch === null) return;
    const action = view;
    try {
      if (action === 'reset') {
        await resetEmailPassword(email);
        if (current(epoch)) setStatus('If an account can receive a reset email at that address, a password reset link will arrive shortly. Check your inbox and spam folder.');
      } else if (action === 'register') await emailSignUp(email, password);
      else await emailSignIn(email, password);
    } catch (cause) {
      if (current(epoch)) {
        if (action === 'reset' && typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'auth/user-not-found') {
          setStatus('If an account can receive a reset email at that address, a password reset link will arrive shortly. Check your inbox and spam folder.');
        } else setError(describeSignInFailure(cause, 'email'));
      }
    } finally {
      if (current(epoch)) { setPassword(''); setConfirmation(''); }
      finish(epoch);
    }
  };
  const requestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (pendingRef.current) return;
    clearPhone();
    const epoch = begin();
    if (epoch === null) return;
    setCode('');
    if (native) {
      nativePendingRef.current = true;
      setStatus('Complete SMS sign-in in your system browser. Keep Natally open.');
      try { await nativePhoneSignIn(); }
      catch (cause) { if (current(epoch)) setError(describeSignInFailure(cause, 'phone')); }
      finally {
        if (current(epoch)) { nativePendingRef.current = false; setStatus(null); }
        finish(epoch);
      }
      return;
    }
    const container = recaptchaRef.current;
    if (!container) { setError('The reCAPTCHA form is unavailable. Close sign-in and try again.'); finish(epoch); return; }
    setView('phone');
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('Complete the reCAPTCHA check to request your SMS code.');
    try {
      const session = await startPhoneSignIn(phone, container, controller.signal);
      if (!current(epoch)) { session.dispose(); return; }
      sessionRef.current = session;
      abortRef.current = null;
      setView('code');
      setStatus(`A six-digit code was sent to ${phone}.`);
    } catch (cause) {
      if (current(epoch)) { setStatus(null); setError(describeSignInFailure(cause, 'phone')); }
    } finally { finish(epoch); }
  };
  const confirmCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = sessionRef.current;
    if (!session) { setError('This SMS session has expired. Request a new code.'); return; }
    const epoch = begin();
    if (epoch === null) return;
    try { await session.confirm(code); }
    catch (cause) { if (current(epoch)) setError(describeSignInFailure(cause, 'phone')); }
    finally { if (current(epoch)) setCode(''); finish(epoch); }
  };

  const title = view === 'choose' ? 'Sign in to Natally' : view === 'register' ? 'Create your account'
    : view === 'reset' ? 'Reset your password' : view === 'email' ? 'Sign in with email'
      : view === 'code' ? 'Enter your SMS code' : 'Sign in with SMS';
  const visibleError = error ?? (view === 'choose' ? googleError : null);
  return (
    <div className="sheet-backdrop sign-in-backdrop" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <section className="sheet sign-in-panel" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} ref={panelRef}>
        <header className="sheet-head sign-in-head">
          <h2 id={`${id}-title`}>{title}</h2>
          <button type="button" className="btn ghost small" onClick={close}>Close</button>
        </header>
        {view === 'choose' && (
          <div className="sign-in-choices">
            <p>Choose how you’d like to continue to your atelier.</p>
            <button type="button" className="btn primary" onClick={google} disabled={pending} data-sign-in-focus>Continue with Google</button>
            <button type="button" className="btn ghost" onClick={() => choose('email')} disabled={pending}>Continue with email</button>
            <button type="button" className="btn ghost" onClick={() => choose('phone')} disabled={pending}>Continue with SMS</button>
            {continueOnApp && <p className="sign-in-hint">Email and SMS continue on asknatally.online.</p>}
          </div>
        )}
        {(view === 'email' || view === 'register' || view === 'reset') && (
          <form className="sign-in-form" onSubmit={submitEmail}>
            {view === 'reset' && <p>Enter your email address to request a password reset link.</p>}
            <label htmlFor={`${id}-email`}>Email address</label>
            <input id={`${id}-email`} name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={pending} data-sign-in-focus />
            {view !== 'reset' && <>
              <label htmlFor={`${id}-password`}>Password</label>
              <input id={`${id}-password`} name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} required minLength={view === 'register' ? 6 : undefined} value={password} onChange={event => setPassword(event.target.value)} disabled={pending} />
            </>}
            {view === 'register' && <>
              <p className="sign-in-hint">Use at least six characters. Additional password requirements may apply.</p>
              <label htmlFor={`${id}-confirm`}>Confirm password</label>
              <input id={`${id}-confirm`} name="confirmPassword" type="password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={pending} />
            </>}
            <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Please wait…' : view === 'register' ? 'Create account' : view === 'reset' ? 'Send reset link' : 'Sign in'}</button>
            {view === 'email' && <div className="sign-in-links">
              <button type="button" className="btn ghost" onClick={() => changeView('register')}>Create account</button>
              <button type="button" className="btn ghost" onClick={() => changeView('reset')}>Forgot password?</button>
            </div>}
          </form>
        )}
        {(view === 'phone' || view === 'code') && (
          <div className="sign-in-phone">
            {native ? <>
              <p>Continue in your system browser to enter your phone number and complete the SMS check. Verification finishes in Natally.</p>
              <button type="button" className="btn primary" onClick={() => void requestCode()} disabled={pending} data-sign-in-focus>{pending ? 'Waiting for your browser…' : 'Continue with SMS in browser'}</button>
            </> : <>
              <form className="sign-in-form" onSubmit={requestCode} hidden={view !== 'phone'}>
                <label htmlFor={`${id}-phone`}>Mobile phone number</label>
                <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" required pattern="[+][1-9][0-9 .\(\)\-]{7,25}" title="Start with + and your country code, using 8–15 digits." value={phone} onChange={event => setPhone(event.target.value)} disabled={pending} data-sign-in-focus />
                <p className="sign-in-hint">Include + and your country code, followed by 8–15 digits. SMS sign-in is currently available for Canada and the United States.</p>
                <p className="sign-in-consent">By choosing Send SMS code, you consent to receive an SMS for sign-in. Message and data rates may apply. Google uses phone numbers to help prevent spam and abuse.</p>
                <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Requesting SMS…' : 'Send SMS code'}</button>
              </form>
              <div className="sign-in-recaptcha" ref={recaptchaRef} aria-label="SMS reCAPTCHA verification" />
              <form className="sign-in-form" onSubmit={confirmCode} hidden={view !== 'code'}>
                <label htmlFor={`${id}-code`}>Six-digit SMS code</label>
                <input id={`${id}-code`} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={event => setCode(event.target.value)} disabled={pending} data-sign-in-focus={view === 'code' ? true : undefined} />
                <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Verifying…' : 'Verify and sign in'}</button>
                <div className="sign-in-links">
                  <button type="button" className="btn ghost" disabled={pending} onClick={() => void requestCode()}>Resend code</button>
                  <button type="button" className="btn ghost" onClick={() => changeView('phone')}>Use a new number</button>
                </div>
              </form>
            </>}
          </div>
        )}
        <div className="sign-in-feedback" aria-live="polite" aria-atomic="true">
          {visibleError && <p className="sign-in-error" role="alert">{visibleError}</p>}
          {status && <p className="sign-in-status" role="status">{status}</p>}
        </div>
        {view !== 'choose' && <button type="button" className="btn ghost sign-in-back" onClick={() => changeView(view === 'register' || view === 'reset' ? 'email' : 'choose')}>Back</button>}
      </section>
    </div>
  );
}
