import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyAuthError } from '../../utils/authErrors';
import { isAdminRole } from '../../utils/adminRoles';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Phone,
  Key,
  BookOpen,
  Heart,
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getActiveAuth, getActiveApp } from '../../firebase';
import logo from '../../assets/logo.svg';
import GradientButton from '../ui/GradientButton';
import StatusPill from '../ui/StatusPill';

// ---------------------------------------------------------------------------
// Error copy constants
// ---------------------------------------------------------------------------
const ERROR_UNAUTHORIZED =
  'You do not have permission to access the admin portal. Please contact your church administrator.';
const ERROR_DISABLED =
  'Your account has been disabled. Please contact your church administrator.';
const ERROR_NO_CHURCH = 'Your account is not linked to a church yet.';

// ---------------------------------------------------------------------------
// Inline helper — run post-Firebase-Auth authorization check
// Returns { authorized: true } or { authorized: false, message: string }
// ---------------------------------------------------------------------------
async function checkAdminAuthorization(user) {
  const uid = user.uid;
  const tokenResult = await user.getIdTokenResult(true);
  const isSuperAdminClaim = Boolean(tokenResult.claims?.superAdmin);

  let snap = await getDoc(doc(db, 'users', uid));

  if (!snap.exists() && !isSuperAdminClaim) {
    return { authorized: false, message: ERROR_UNAUTHORIZED };
  }

  const data = snap.exists() ? snap.data() : {};
  const isSuperAdmin = isSuperAdminClaim || data.role === 'super_admin' || (Array.isArray(data.systemRoles) && data.systemRoles.includes('super_admin'));

  if (data.status === 'disabled') return { authorized: false, message: ERROR_DISABLED };
  if (data.status === 'pendingChurchLink') return { authorized: false, message: ERROR_NO_CHURCH };

  if (isSuperAdmin) {
    return { authorized: true, redirectUrl: '/super-admin' };
  }

  if (!isAdminRole(data.role)) return { authorized: false, message: ERROR_UNAUTHORIZED };
  if (!data.churchId) {
    return { authorized: false, message: ERROR_NO_CHURCH };
  }

  return { authorized: true, redirectUrl: '/admin' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Login() {
  const { login, loginWithGoogle, logout, isAuthorizedAdmin, isLoading, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // SMS OTP state
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Redirect if already authorized
  useEffect(() => {
    if (!isLoading && isAuthorizedAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isLoading, isAuthorizedAdmin, navigate]);

  // ------------------------------------------------------------------
  // Login submit
  // ------------------------------------------------------------------
  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const credential = await login(email, password);

      const result = await checkAdminAuthorization(credential.user);
      if (!result.authorized) {
        await logout();
        setError(result.message);
        return;
      }

      navigate(result.redirectUrl || '/admin', { replace: true });
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------------
  // Google login
  // ------------------------------------------------------------------
  async function handleGoogleLogin() {
    setError('');
    setSubmitting(true);

    try {
      const credential = await loginWithGoogle();

      const result = await checkAdminAuthorization(credential.user);
      if (!result.authorized) {
        await logout();
        setError(result.message);
        return;
      }

      navigate(result.redirectUrl || '/admin', { replace: true });
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------------
  // Forgot password submit
  // ------------------------------------------------------------------
  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetError('');
    setResetSubmitting(true);

    const identifier = resetIdentifier.trim();
    const isEmail = identifier.includes('@');

    if (isEmail) {
      try {
        await sendPasswordReset(identifier);
        setResetSuccess(true);
      } catch (err) {
        setResetError(getFriendlyAuthError(err));
      } finally {
        setResetSubmitting(false);
      }
    } else {
      // SMS flow
      try {
        if (!identifier.startsWith('+')) {
          throw new Error('Please include your country code (e.g., +63 or +1).');
        }

        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(getActiveAuth(), 'recaptcha-container', {
            size: 'invisible',
          });
        }
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(getActiveAuth(), identifier, appVerifier);
        setConfirmationResult(result);
        setOtpMode(true);
      } catch (err) {
        setResetError(getFriendlyAuthError(err));
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } finally {
        setResetSubmitting(false);
      }
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setResetError('');
    setResetSubmitting(true);

    try {
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      // 1. Verify OTP
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otpCode);
      await getActiveAuth().signInWithCredential(credential);

      // 2. Call Cloud Function to update password
      const functions = getFunctions(getActiveApp(), 'asia-southeast1');
      const resetFn = httpsCallable(functions, 'resetPasswordWithPhone');
      await resetFn({ newPassword });

      // 3. Sign out of the temporary phone session
      await signOut(getActiveAuth());
      
      setResetSuccess(true);
      setOtpMode(false);
    } catch (err) {
      setResetError(getFriendlyAuthError(err));
    } finally {
      setResetSubmitting(false);
    }
  }

  function openForgotPassword() {
    setResetIdentifier(email);
    setResetSuccess(false);
    setResetError('');
    setForgotMode(true);
    setOtpMode(false);
    setConfirmationResult(null);
  }

  function closeForgotPassword() {
    setForgotMode(false);
    setResetSuccess(false);
    setResetError('');
    setOtpMode(false);
    setConfirmationResult(null);
  }

  return (
    <div className="min-h-screen bg-church-canvas text-church-charcoal flex flex-col antialiased">
      {/* ── Top Header Navigation (Unified Landing/Registration Design) ── */}
      <header className="border-b border-gray-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-coram rounded-2xl flex items-center justify-center shadow-church-glow p-2 group-hover:scale-105 transition-transform duration-200">
              <img src={logo} alt="Coram Deo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-church-charcoal tracking-tight">CoramDeo</span>
                <span className="text-[10px] font-bold text-church-rose bg-church-rose-light px-2 py-0.5 rounded-full border border-pink-100">
                  Church Platform
                </span>
              </div>
              <span className="text-[10px] font-medium text-church-slate -mt-0.5">Faithful Stewardship & Ministry</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-church-slate">Need to register your church?</span>
            <Link 
              to="/register"
              className="text-xs font-bold text-church-charcoal hover:text-church-rose px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-church-rose/40 bg-white transition-all shadow-church-soft flex items-center gap-1.5"
            >
              <span>Register Church</span>
              <ArrowRight size={13} className="text-church-rose" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Layout Body ── */}
      <div className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Ambient background glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-100/60 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] rounded-full bg-purple-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-rose-50/70 blur-3xl pointer-events-none" />

        {/* ── Inner Content (Strict alignment with Landing max-w-7xl margins) ── */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ── Left Showcase Panel (Desktop lg:flex) ── */}
            <div className="hidden lg:flex lg:col-span-7 flex-col justify-between space-y-8 pr-4 lg:pr-6">
              <div className="space-y-4">
                <StatusPill variant="rose" dot>
                  CoramDeo Life Management Suite
                </StatusPill>
                <h1 className="text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight leading-[1.15]">
                  Where ministry and community <span className="bg-gradient-to-r from-church-rose to-church-violet bg-clip-text text-transparent">thrive together.</span>
                </h1>
                <p className="text-church-slate text-base leading-relaxed max-w-xl">
                  Designed for pastors, worship directors, secretaries, and leadership teams to steward God's house with joy, clarity, and excellence.
                </p>
              </div>

              {/* Authentic Replica: Mobile Verse of the Day Card */}
              <div className="bg-gradient-coram-hero rounded-3xl p-6 text-white shadow-church-glow relative overflow-hidden group max-w-xl">
                {/* Background watermark quote */}
                <div className="absolute -right-4 -bottom-6 text-white/10 text-9xl font-serif font-black select-none pointer-events-none">
                  &rdquo;
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase glass-pill">
                    Verse of the Day
                  </div>

                  <blockquote className="text-base md:text-lg font-medium leading-relaxed text-white/95">
                    &ldquo;The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill">
                      <BookOpen size={12} />
                      John 10:10
                    </span>
                    <span className="text-xs font-semibold text-white/80 pl-2">
                      Daily Scripture &bull; CoramDeo Life
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Ministry Pulse Micro-cards */}
              <div className="grid grid-cols-3 gap-3 max-w-xl">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-church-soft">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-church-rose flex items-center justify-center mb-2">
                    <Calendar size={16} />
                  </div>
                  <div className="text-base font-bold text-church-charcoal">Worship</div>
                  <div className="text-xs text-church-slate">Setlists & Rosters</div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-church-soft">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-church-violet flex items-center justify-center mb-2">
                    <Users size={16} />
                  </div>
                  <div className="text-base font-bold text-church-charcoal">Members</div>
                  <div className="text-xs text-church-slate">Directory & Care</div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-church-soft">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-church-emerald flex items-center justify-center mb-2">
                    <Heart size={16} />
                  </div>
                  <div className="text-base font-bold text-church-charcoal">Giving</div>
                  <div className="text-xs text-church-slate">Causes & Records</div>
                </div>
              </div>

              {/* Scriptural Footer Quote */}
              <div className="flex items-center gap-2 text-church-slate text-xs font-medium pt-2">
                <span className="w-2 h-2 rounded-full bg-church-rose" />
                <span>&ldquo;Serve one another humbly in love.&rdquo; — Galatians 5:13</span>
              </div>
            </div>

            {/* ── Right Authentication Panel ── */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
          {/* ── Main Login Card ── */}
          {!forgotMode && (
            <div className="bg-white rounded-3xl shadow-church-elevated border border-gray-100/90 p-8 sm:p-10 transition-all duration-300">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-black text-church-charcoal tracking-tight">Welcome back</h2>
                <p className="text-church-slate text-sm mt-1.5 leading-relaxed">
                  Sign in with your authorized leader account to continue.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3.5 mb-6 text-sm leading-snug">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
                {/* Email or Username */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-church-charcoal">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-church-muted">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="pastor@church.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50/60 text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/25 focus:border-church-rose transition-all duration-150"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-church-charcoal">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs text-church-rose hover:text-church-rose-hover font-bold transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-church-muted">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50/60 text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/25 focus:border-church-rose transition-all duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-church-muted hover:text-church-charcoal transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-church-rose accent-church-rose focus:ring-church-rose"
                  />
                  <span className="text-sm font-medium text-church-slate">Keep me signed in</span>
                </label>

                {/* Submit button */}
                <GradientButton
                  type="submit"
                  loading={submitting}
                  size="md"
                  className="w-full text-base font-bold tracking-tight shadow-church-glow"
                >
                  Sign In to Workspace
                </GradientButton>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs uppercase tracking-wider font-semibold text-church-muted">or continue with</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 text-church-charcoal font-bold py-3 px-4 rounded-full transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <g fill="none" fillRule="evenodd">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </g>
                </svg>
                Sign in with Google
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-church-slate mt-6 leading-relaxed">
                Authorized church leaders and staff only.<br/>
                <Link to="/privacy-policy" className="text-church-rose hover:underline font-bold mt-1 inline-block">
                  Privacy Policy &bull; Terms of Service
                </Link>
              </p>
            </div>
          )}

          {/* ── Forgot password / OTP form ── */}
          {forgotMode && (
            <div className="bg-white rounded-3xl shadow-church-elevated border border-gray-100/90 p-8 sm:p-10 transition-all duration-300">
              <button
                type="button"
                onClick={closeForgotPassword}
                className="flex items-center gap-1.5 text-xs font-bold text-church-slate hover:text-church-charcoal mb-6 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>

              <div className="mb-6">
                <StatusPill variant="rose" className="mb-2">
                  Account Recovery
                </StatusPill>
                <h2 className="text-2xl font-black text-church-charcoal tracking-tight">Reset password</h2>
                <p className="text-church-slate text-sm mt-1.5 leading-relaxed">
                  {otpMode 
                    ? `Enter the code sent to ${resetIdentifier} and your new password.` 
                    : 'Enter your registered email address or phone number.'}
                </p>
              </div>

              <div id="recaptcha-container"></div>

              {/* Success state */}
              {resetSuccess ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-4 text-sm leading-snug">
                  <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>
                    Password reset link sent! Please check your email inbox to proceed.
                  </span>
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3.5 mb-5 text-sm leading-snug">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  {otpMode ? (
                    <form onSubmit={handleOtpSubmit} className="space-y-5" noValidate>
                      <div className="space-y-1.5">
                        <label htmlFor="otpCode" className="block text-xs font-bold uppercase tracking-wider text-church-charcoal">
                          6-digit SMS Code
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-church-muted">
                            <Key size={18} />
                          </div>
                          <input
                            id="otpCode"
                            type="text"
                            required
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50/60 text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/25 focus:border-church-rose transition-all duration-150"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-church-charcoal">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-church-muted">
                            <Lock size={18} />
                          </div>
                          <input
                            id="newPassword"
                            type="password"
                            required
                            placeholder="Min 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50/60 text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/25 focus:border-church-rose transition-all duration-150"
                          />
                        </div>
                      </div>

                      <GradientButton
                        type="submit"
                        loading={resetSubmitting}
                        size="md"
                        className="w-full text-sm font-bold"
                      >
                        Verify & Reset Password
                      </GradientButton>
                    </form>
                  ) : (
                    <form onSubmit={handleResetSubmit} className="space-y-5" noValidate>
                      <div className="space-y-1.5">
                        <label htmlFor="reset-input" className="block text-xs font-bold uppercase tracking-wider text-church-charcoal">
                          Email or Phone number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-church-muted">
                            {resetIdentifier.includes('@') ? <Mail size={18} /> : <Phone size={18} />}
                          </div>
                          <input
                            id="reset-input"
                            type="text"
                            required
                            placeholder="you@church.org or +639123456789"
                            value={resetIdentifier}
                            onChange={(e) => setResetIdentifier(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50/60 text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/25 focus:border-church-rose transition-all duration-150"
                          />
                        </div>
                      </div>

                      <GradientButton
                        type="submit"
                        loading={resetSubmitting}
                        size="md"
                        className="w-full text-sm font-bold"
                      >
                        Send Reset Instructions
                      </GradientButton>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
</div>
);
}
