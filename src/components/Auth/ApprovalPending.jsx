import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { getActiveDb } from '../../firebase';
import { 
  ShieldCheck, 
  Clock, 
  Building2, 
  CheckCircle2, 
  RotateCw, 
  LogOut, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  MailCheck
} from 'lucide-react';
import GradientButton from '../ui/GradientButton';

export default function ApprovalPending() {
  const { currentUser, userProfile, churchData, logout } = useAuth();
  const navigate = useNavigate();

  const churchId = churchData?.id || userProfile?.churchId || localStorage.getItem('activeChurchId');
  const churchName = churchData?.name || userProfile?.churchName || 'Your Church';
  const denomination = churchData?.denomination || 'Christian Ministry';
  const city = churchData?.city || 'Philippines';

  const [refreshing, setRefreshing] = useState(false);
  const [liveStatus, setLiveStatus] = useState(churchData?.status || 'pending_approval');
  const [approved, setApproved] = useState(false);

  // Real-time listener: As soon as Super Admin approves the church, automatically redirect!
  useEffect(() => {
    if (!churchId) return;

    const db = getActiveDb();
    const churchRef = doc(db, 'churches', churchId);

    const unsubscribe = onSnapshot(churchRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const status = data.status || '';
        setLiveStatus(status);

        if (status.toLowerCase() === 'active' || data.isApproved === true) {
          setApproved(true);
          setTimeout(() => {
            navigate('/admin', { replace: true });
          }, 1500);
        }
      }
    }, (err) => {
      console.warn('Real-time church status listener warning:', err);
    });

    return () => unsubscribe();
  }, [churchId, navigate]);

  // Manual status check
  const handleManualRefresh = async () => {
    if (!churchId) return;
    setRefreshing(true);
    try {
      const db = getActiveDb();
      const snap = await getDoc(doc(db, 'churches', churchId));
      if (snap.exists()) {
        const data = snap.data();
        setLiveStatus(data.status || 'pending_approval');
        if (data.status?.toLowerCase() === 'active' || data.isApproved === true) {
          setApproved(true);
          setTimeout(() => {
            navigate('/admin', { replace: true });
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
    } finally {
      setRefreshing(false);
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

      {/* Main Content Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-church-card border border-white/80 relative overflow-hidden">
          
          {/* Decorative ambient blur */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-church-purple/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center">
            {approved ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-church-emerald flex items-center justify-center shadow-church-soft mb-4 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
            ) : (
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-church-soft border border-amber-200/60">
                  <Clock size={32} className="animate-pulse" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-church-emerald text-white flex items-center justify-center shadow-md">
                  <ShieldCheck size={13} />
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold tracking-wide uppercase mb-3">
              <Clock size={13} />
              <span>
                {approved ? 'Workspace Approved!' : 'Super Admin Vetting in Progress'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight">
              {approved ? 'Welcome to CoramDeo!' : 'Workspace Under Review'}
            </h1>
            <p className="text-xs sm:text-sm text-church-slate mt-2 max-w-md leading-relaxed">
              {approved 
                ? 'Your church workspace has been approved. Launching your management dashboard now...'
                : 'Your email has been verified! Our platform administration team is reviewing your ministry registration to ensure security and tenant integrity.'}
            </p>
          </div>

          {/* Ministry Profile Overview */}
          <div className="mt-6 p-4 rounded-2xl bg-church-sand/40 border border-church-navy/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-church-slate font-medium flex items-center gap-1.5">
                <Building2 size={14} className="text-church-navy" />
                Church Organization:
              </span>
              <span className="font-bold text-church-charcoal">{churchName}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/50">
              <span className="text-church-slate font-medium">Denomination & Location:</span>
              <span className="font-semibold text-church-slate">
                {denomination} • {city}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/50">
              <span className="text-church-slate font-medium flex items-center gap-1.5">
                <MailCheck size={14} className="text-church-emerald" />
                Authorized Founder:
              </span>
              <div className="flex items-center gap-1.5 font-bold text-church-charcoal">
                <span>{currentUser?.email}</span>
                <span className="text-[10px] text-church-emerald bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Status Indicators */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-church-slate mb-3">
              Application Security Pipeline
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-church-charcoal font-semibold">
                  <CheckCircle2 size={16} className="text-church-emerald" />
                  <span>1. Workspace Provisioning</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-church-emerald">
                  Completed
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-church-charcoal font-semibold">
                  <CheckCircle2 size={16} className="text-church-emerald" />
                  <span>2. Email Identity Verification</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-church-emerald">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-church-charcoal font-semibold">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <span>3. Platform Super Admin Review</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                  Under Review
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-church-slate/70">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles size={16} className="text-gray-300" />
                  <span>4. Operational Dashboard Unlock</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                  Pending Approval
                </span>
              </div>
            </div>
          </div>

          {/* Action & Realtime Notice */}
          <div className="mt-8 space-y-3">
            {approved ? (
              <GradientButton
                type="button"
                onClick={() => navigate('/admin', { replace: true })}
                size="lg"
                className="w-full cursor-pointer shadow-church-glow"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Enter Admin Portal</span>
                  <ArrowRight size={16} />
                </span>
              </GradientButton>
            ) : (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="w-full py-3 rounded-full bg-church-charcoal hover:bg-black text-white text-xs font-bold transition-all shadow-church-soft flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Checking Review Status...' : 'Refresh Review Status'}</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-church-slate pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-time listener active — you will be redirected automatically upon approval.</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-church-slate">
        <p>&copy; {new Date().getFullYear()} CoramDeo Platform. Two-stage security & governance enabled.</p>
      </footer>

    </div>
  );
}
