import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { getActiveAuth, getActiveDb } from '../../firebase';
import GradientButton from '../ui/GradientButton';
import { 
  Mail, 
  CheckCircle2, 
  RotateCw, 
  ArrowRight, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';

export default function VerifyEmail() {
  const { currentUser, userProfile, churchData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registeredEmail = location.state?.email || currentUser?.email || 'your email';
  const registeredChurchName = location.state?.churchName || churchData?.name || userProfile?.churchName || 'Your Church';
  const churchId = location.state?.churchId || churchData?.id || userProfile?.churchId;

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 60-second resend cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle email verification check
  const handleCheckStatus = async () => {
    setError('');
    setMessage('');
    setChecking(true);

    try {
      const auth = getActiveAuth();
      const user = auth.currentUser;

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Reload auth token to fetch updated emailVerified boolean
      await user.reload();

      if (user.emailVerified) {
        const db = getActiveDb();

        // 1. Promote user and userAccounts to pending_approval with emailVerified: true
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            emailVerified: true,
            status: 'pending_approval',
            verifiedAt: serverTimestamp(),
            updatedAt: new Date().toISOString()
          });

          await updateDoc(doc(db, 'userAccounts', user.uid), {
            emailVerified: true,
            status: 'pending_approval',
            verifiedAt: serverTimestamp(),
            updatedAt: new Date().toISOString()
          });
        } catch (uErr) {
          console.warn('User status sync noted:', uErr);
        }

        // 2. Promote church to pending_approval
        if (churchId) {
          try {
            await updateDoc(doc(db, 'churches', churchId), {
              emailVerified: true,
              status: 'pending_approval',
              approvalStatus: 'pending_approval',
              updatedAt: serverTimestamp()
            });
          } catch (cErr) {
            console.warn('Church status sync noted:', cErr);
          }
        }

        setMessage('Email verified successfully! Transitioning to approval review...');
        setTimeout(() => {
          navigate('/approval-pending', { replace: true });
        }, 1200);
      } else {
        setError('We have not detected your verification yet. Please open the link sent to your email, then click check again.');
      }
    } catch (err) {
      console.error('Error verifying email status:', err);
      setError(err.message || 'Unable to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  // Handle resend verification email
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setMessage('');
    setResending(true);

    try {
      const auth = getActiveAuth();
      const user = auth.currentUser;

      if (!user) {
        setError('Your session expired. Please log in again.');
        return;
      }

      await sendEmailVerification(user);
      setMessage(`A fresh verification link has been sent to ${user.email}.`);
      setCooldown(60);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few moments before trying again.');
        setCooldown(60);
      } else {
        setError(err.message || 'Failed to resend verification email.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F9] via-[#FAF7F2] to-[#F5F8FA] flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-coram flex items-center justify-center text-white font-black text-lg shadow-church-glow group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="text-lg font-black tracking-tight text-church-charcoal">
            Coram<span className="text-church-rose">Deo</span>
          </span>
        </Link>

        <button
          onClick={handleSignOut}
          className="text-xs font-bold text-church-slate hover:text-church-rose flex items-center gap-1.5 transition-colors"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="max-w-lg mx-auto w-full my-auto py-8">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-church-card border border-white/80 relative overflow-hidden">
          
          {/* Decorative background glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-church-rose/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-church-purple/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-church-rose/15 to-church-purple/20 text-church-rose flex items-center justify-center shadow-church-soft">
                <Mail size={32} className="text-church-rose" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-church-emerald text-white flex items-center justify-center shadow-md">
                <Clock size={13} />
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-church-rose/10 text-church-rose text-[11px] font-bold tracking-wide uppercase mb-3">
              <ShieldCheck size={13} />
              <span>Identity Verification Required</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-xs sm:text-sm text-church-slate mt-2 max-w-sm leading-relaxed">
              To safeguard your church workspace from unauthorized creation, please confirm your email address.
            </p>
          </div>

          {/* Registered Identity Card */}
          <div className="mt-6 p-4 rounded-2xl bg-church-sand/40 border border-church-navy/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-church-slate font-medium flex items-center gap-1.5">
                <Building2 size={14} className="text-church-navy" />
                Church Workspace:
              </span>
              <span className="font-bold text-church-charcoal">{registeredChurchName}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/50">
              <span className="text-church-slate font-medium flex items-center gap-1.5">
                <Mail size={14} className="text-church-rose" />
                Verification Sent To:
              </span>
              <span className="font-bold text-church-rose font-mono text-[11px] truncate max-w-[200px]">
                {registeredEmail}
              </span>
            </div>
          </div>

          {/* Stepper Status Indicators */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-church-slate mb-3">
              Onboarding Governance Progress
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-church-charcoal font-semibold">
                  <CheckCircle2 size={16} className="text-church-emerald" />
                  <span>1. Workspace Provisioned</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-church-emerald">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-church-charcoal font-semibold">
                  <div className="w-4 h-4 rounded-full border-2 border-church-rose border-t-transparent animate-spin" />
                  <span>2. Confirm Email Address</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-church-rose">
                  Awaiting Confirmation
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-church-slate/70">
                <div className="flex items-center gap-2 font-medium">
                  <Clock size={16} className="text-gray-300" />
                  <span>3. Super Admin Platform Review</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                  Next Step
                </span>
              </div>
            </div>
          </div>

          {/* Inline Alert / Feedback */}
          {error && (
            <div className="mt-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mt-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <GradientButton
              type="button"
              onClick={handleCheckStatus}
              loading={checking}
              size="lg"
              className="w-full cursor-pointer shadow-church-glow"
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCw size={16} className={checking ? 'animate-spin' : ''} />
                <span>I've Verified My Email — Continue</span>
                <ArrowRight size={16} />
              </span>
            </GradientButton>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full py-2.5 rounded-full border border-gray-200 text-xs font-bold text-church-charcoal hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              <Mail size={14} />
              <span>
                {cooldown > 0 
                  ? `Resend link available in ${cooldown}s` 
                  : resending 
                    ? 'Dispatching email...' 
                    : 'Resend Verification Link'}
              </span>
            </button>
          </div>

          {/* Guidance note */}
          <p className="text-[11px] text-center text-church-slate mt-5 leading-relaxed">
            Did not receive the email? Check your <strong>Spam or Junk folder</strong>, or verify that the email address above was typed correctly.
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-church-slate">
        <p>&copy; {new Date().getFullYear()} CoramDeo Platform. Two-stage security & governance enabled.</p>
      </footer>

    </div>
  );
}
