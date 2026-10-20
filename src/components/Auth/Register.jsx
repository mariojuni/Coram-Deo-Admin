import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Globe,
  Coins,
  ShieldCheck
} from 'lucide-react';
import logo from '../../assets/logo.svg';
import GradientButton from '../ui/GradientButton';
import StatusPill from '../ui/StatusPill';
import { registerChurchAndAdmin } from '../../services/churchRegistrationService';

const LEADERSHIP_TITLES = [
  { value: 'Senior Pastor', label: 'Senior Pastor / Head Minister', systemRole: 'pastor' },
  { value: 'Associate Pastor', label: 'Associate Pastor', systemRole: 'pastor' },
  { value: 'Executive Administrator', label: 'Executive Administrator / Director', systemRole: 'church_admin' },
  { value: 'Head Treasurer', label: 'Head Treasurer / Financial Secretary', systemRole: 'finance_admin' },
  { value: 'Church Secretary', label: 'Church Secretary / Clerk', systemRole: 'secretary' },
  { value: 'Worship Director', label: 'Worship Leader / Music Director', systemRole: 'ministry_leader' }
];

const CURRENCIES = [
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (PHP ₱)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD $)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR €)' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar (CAD $)' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar (AUD $)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)' }
];

const TIERS = {
  seed: { name: 'Seed Fellowship', price: 'Free', priceNum: 0, period: 'forever', maxMembers: 'Up to 50 members', sermonStorage: '2 GB Audio Archive' },
  growth: { name: 'Growth Ministry', price: '₱3,490', priceNum: 3490, period: 'month', maxMembers: 'Up to 250 members', sermonStorage: '20 GB / mo Video & Audio' },
  kingdom: { name: 'Kingdom Network', price: '₱5,490', priceNum: 5490, period: 'month', maxMembers: 'Unlimited members', sermonStorage: '50 GB Video & Audio Storage' }
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard Step (1: Church Info, 2: Admin Profile, 3: Review & Launch)
  const [step, setStep] = useState(1);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Form State: Church
  const [churchName, setChurchName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('PHP');

  // Form State: Admin Credentials
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('Senior Pastor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State: Tier
  const [tier, setTier] = useState('growth');

  // UX Feedback
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Anti-Bot & Abuse Security State
  const [honeypot, setHoneypot] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const formLoadedAtRef = useRef(Date.now());

  // Parse contextual search parameters from Landing Page CTAs
  useEffect(() => {
    const paramTier = searchParams.get('tier')?.toLowerCase();
    if (paramTier && TIERS[paramTier]) {
      setTier(paramTier);
    }

    const paramRole = searchParams.get('role');
    const paramTitle = searchParams.get('title');
    if (paramTitle) {
      setTitle(paramTitle);
    } else if (paramRole) {
      const match = LEADERSHIP_TITLES.find(t => t.systemRole === paramRole || t.value.toLowerCase().includes(paramRole.toLowerCase()));
      if (match) setTitle(match.value);
    }
  }, [searchParams]);

  // Validation helpers
  const validateStep1 = () => {
    if (!churchName.trim()) {
      setError('Please provide your Church or Ministry Name.');
      return false;
    }
    if (!city.trim()) {
      setError('Please provide your city or municipality.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!firstName.trim()) {
      setError('Please enter your First Name.');
      return false;
    }
    if (!lastName.trim()) {
      setError('Please enter your Last Name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match. Please verify.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setIsAdvancing(true);
      setStep(2);
      setTimeout(() => setIsAdvancing(false), 750);
    } else if (step === 2 && validateStep2()) {
      setIsAdvancing(true);
      setStep(3);
      setTimeout(() => setIsAdvancing(false), 750);
    }
  };

  const handleBack = () => {
    setError('');
    setIsAdvancing(false);
    setStep(prev => Math.max(1, prev - 1));
  };

  // Currently selected leadership object
  const selectedTitleObj = LEADERSHIP_TITLES.find(t => t.value === title) || LEADERSHIP_TITLES[0];

  // Full name computed from first, middle, and last name
  const adminFullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');

  // Final submission: executes atomic church & admin provisioning
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    // Security Gate 1: Honeypot check (catches automated bot form fillers)
    if (honeypot) {
      console.warn('[Security] Bot registration attempt detected via honeypot.');
      setError('Automated submission rejected. Please refresh and try again.');
      return;
    }

    // Security Gate 2: Velocity / Submission timing check
    const elapsedMs = Date.now() - formLoadedAtRef.current;
    if (elapsedMs < 2000) {
      console.warn('[Security] Suspiciously rapid submission rejected:', elapsedMs);
      setError('Please review your details carefully before launching.');
      return;
    }

    // Security Gate 3: Authorization certification
    if (!agreedToTerms) {
      setError('Please verify and check the authorization agreement before launching your workspace.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const activeCurrencyObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
      const selectedTierObj = TIERS[tier] || TIERS.growth;

      const registrationResult = await registerChurchAndAdmin({
        churchInfo: {
          name: churchName,
          denomination: denomination,
          city: city,
          country: 'Philippines',
          currency: activeCurrencyObj.code,
          currencySymbol: activeCurrencyObj.symbol
        },
        adminInfo: {
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          name: adminFullName,
          email: email,
          password: password,
          title: title,
          systemRole: 'church_admin',
          role: 'church_admin'
        },
        tierInfo: {
          tier: tier,
          tierPrice: selectedTierObj.priceNum
        }
      });

      // Redirect to the Identity & Email Verification Gate
      navigate('/verify-email', {
        replace: true,
        state: {
          email: email.trim(),
          churchName: churchName.trim(),
          churchId: registrationResult?.churchId
        }
      });
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register church workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTier = TIERS[tier] || TIERS.growth;

  return (
    <div className="min-h-screen bg-church-canvas text-church-charcoal flex flex-col justify-between antialiased">
      
      {/* ── Top Header Navigation ── */}
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
            <span className="hidden sm:inline text-xs font-semibold text-church-slate">Already an admin?</span>
            <Link 
              to="/login"
              className="text-xs font-bold text-church-charcoal hover:text-church-rose px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-church-rose/40 bg-white transition-all shadow-church-soft"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Wizard Progress Stepper */}
        <div className="mb-10 max-w-xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Background Track: aligned exactly through the vertical center (18px) of the 36px circles */}
            <div className="absolute top-[18px] left-[18px] right-[18px] -translate-y-1/2 h-1 bg-gray-200/80 rounded-full z-0 overflow-hidden">
              {/* Active Progress Line: animates width smoothly only when going to the next step */}
              <div 
                className={`h-full bg-gradient-coram rounded-full transition-all duration-700 ease-out relative ${
                  isAdvancing ? 'shadow-[0_0_12px_rgba(255,84,126,0.7)]' : ''
                }`}
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              >
                {/* Luminous light sweep: animates ONLY when going to the next step */}
                {isAdvancing && (
                  <div className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-white/95 to-transparent animate-step-sweep" />
                )}
              </div>
            </div>

            {[
              { num: 1, label: 'Church Profile' },
              { num: 2, label: 'Administrator' },
              { num: 3, label: 'Launch' }
            ].map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center relative z-10">
                  <div 
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
                      ${isPassed 
                        ? 'bg-church-emerald text-white shadow-church-soft ring-4 ring-white' 
                        : isCurrent 
                          ? 'bg-gradient-coram text-white shadow-church-glow scale-110 ring-4 ring-pink-50' 
                          : 'bg-white text-church-slate border-2 border-gray-200'}
                    `}
                  >
                    {isPassed ? <Check size={14} strokeWidth={3} /> : s.num}
                  </div>
                  <span className={`text-[11px] font-bold mt-2 whitespace-nowrap transition-colors duration-200 ${isCurrent ? 'text-church-charcoal' : 'text-church-slate'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Card Container */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-church-elevated p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          
          {/* Header Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-church-canvas border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-2">
              Step {step} of 3
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight">
              {step === 1 && 'Tell us about your church.'}
              {step === 2 && 'Set up your administrator credentials.'}
              {step === 3 && 'Confirm & launch your workspace.'}
            </h1>
            <p className="mt-1 text-sm text-church-slate">
              {step === 1 && 'Your isolated church workspace will be generated with these localization settings.'}
              {step === 2 && 'You will be designated as the primary Church Admin with full operational privileges.'}
              {step === 3 && 'Everything is set. You can invite other leaders and record your first tithe immediately.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Anti-Bot Honeypot Traps (Off-screen & invisible to humans) ── */}
            <div 
              style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
              aria-hidden="true" 
              tabIndex={-1}
            >
              <label htmlFor="church_fax_number_hp">Leave this field empty</label>
              <input
                id="church_fax_number_hp"
                type="text"
                name="church_fax_number_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* ── STEP 1: CHURCH PROFILE ── */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                    Church Name *
                  </label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                    <input
                      type="text"
                      required
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      placeholder="e.g. Church of the Nazarene"
                      className="w-full pl-11 pr-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      City / Municipality *
                    </label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Manila"
                        className="w-full pl-11 pr-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      Denomination / Tradition (Optional)
                    </label>
                    <input
                      type="text"
                      value={denomination}
                      onChange={(e) => setDenomination(e.target.value)}
                      placeholder="e.g. Evangelical, Baptist, Nazarene"
                      className="w-full px-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                    Default Currency & Localization
                  </label>
                  <div className="relative">
                    <Coins size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all appearance-none cursor-pointer"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-church-slate mt-1 block">
                    All tithe records, donor statements, and financial exports will use this currency symbol.
                  </span>
                </div>
              </div>
            )}

            {/* ── STEP 2: ADMINISTRATOR PROFILE ── */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* ── Administrator Name: First, Middle, Last ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. David"
                        className="w-full pl-11 pr-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="e.g. Santos (Optional)"
                      className="w-full px-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Reyes"
                      className="w-full px-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                    />
                  </div>
                </div>

                {/* ── Ministry Role / Title Selection ── */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                    Ministry Role / Title *
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all cursor-pointer"
                  >
                    {LEADERSHIP_TITLES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-church-slate mt-1.5 block">
                    As the workspace creator, your account is automatically granted full Church Administrator access.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                    Official Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. pastor@nazarene.ph"
                      className="w-full pl-11 pr-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                    />
                  </div>
                  <span className="text-xs text-church-slate mt-1 block">
                    This email will be your login identifier for the Web Admin Portal.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-11 pr-11 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-church-slate hover:text-church-charcoal p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-church-slate" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-11 pr-4 py-3 bg-church-canvas border border-gray-200 rounded-2xl text-sm font-semibold text-church-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-rose/40 focus:border-church-rose transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: REVIEW & LAUNCH ── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Review Card */}
                <div className="bg-church-canvas rounded-2xl border border-gray-200 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-2">
                    <div>
                      <div className="text-xs font-bold text-church-slate uppercase tracking-wider">Church Workspace</div>
                      <div className="text-lg font-black text-church-charcoal">{churchName}</div>
                      <div className="text-xs text-church-slate">{city}, Philippines • {currency} ({CURRENCIES.find(c => c.code === currency)?.symbol})</div>
                    </div>
                    <StatusPill variant="success" size="sm">Ready to Deploy</StatusPill>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-2">
                    <div>
                      <div className="text-xs font-bold text-church-slate uppercase tracking-wider">Primary Administrator</div>
                      <div className="text-base font-bold text-church-charcoal">{adminFullName}</div>
                      <div className="text-xs text-church-slate">{title} • {email}</div>
                    </div>
                    <div className="self-start sm:self-auto flex items-center gap-2">
                      <StatusPill variant="default" size="sm">{title}</StatusPill>
                      <StatusPill variant="rose" size="sm">Church Admin</StatusPill>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-xs font-bold text-church-slate uppercase tracking-wider">Selected Plan Tier</div>
                      <div className="text-sm font-extrabold text-church-charcoal">{selectedTier.name}</div>
                      <div className="text-xs text-church-slate">{selectedTier.maxMembers} • {selectedTier.sermonStorage}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-church-charcoal">{selectedTier.price}</div>
                      <div className="text-[10px] text-church-slate">/{selectedTier.period}</div>
                    </div>
                  </div>
                </div>

                {/* What's Provisioned Checklist */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-church-slate">
                    Included in your initial setup:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-church-charcoal">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-church-emerald shrink-0" />
                      <span>Dedicated tenant workspace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-church-emerald shrink-0" />
                      <span>Initial General Tithes & Offerings fund</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-church-emerald shrink-0" />
                      <span>Full Admin Portal authorization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-church-emerald shrink-0" />
                      <span>Free mobile member companion app</span>
                    </div>
                  </div>
                </div>

                {/* Security Verification & Terms Authorization */}
                <div className="rounded-xl border border-church-navy/15 bg-gradient-to-br from-church-sand/50 to-church-cream/30 p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-church-navy focus:ring-church-navy/20 cursor-pointer"
                    />
                    <div className="text-xs text-church-charcoal leading-relaxed">
                      <span className="font-semibold">I certify and confirm:</span> I am an authorized leader/administrator representing this church organization, and I agree to the{' '}
                      <Link
                        to="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-church-rose hover:underline font-bold"
                      >
                        Privacy Policy
                      </Link>{' '}
                      and terms of ministry stewardship.
                    </div>
                  </label>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 text-[11px] text-church-slate">
                    <ShieldCheck size={14} className="text-church-emerald shrink-0" />
                    <span>
                      Protected by CoramDeo Security Layer — Multi-tenant isolation & privilege validation active.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-church-charcoal hover:bg-gray-50 flex items-center gap-1.5 transition-all shadow-church-soft"
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <Link
                  to="/"
                  className="text-xs font-bold text-church-slate hover:text-church-charcoal transition-colors"
                >
                  ← Return to Landing Page
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-full bg-church-charcoal hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-all shadow-church-soft hover:scale-[1.02] ml-auto"
                >
                  <span>Continue</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <GradientButton
                  type="submit"
                  size="md"
                  loading={loading}
                  disabled={!agreedToTerms || loading}
                  className="shadow-church-glow ml-auto cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>Launch Church Workspace</span>
                    <ArrowRight size={16} />
                  </span>
                </GradientButton>
              )}
            </div>

          </form>

        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200/80 py-6 text-center text-xs text-church-slate">
        <p>&copy; {new Date().getFullYear()} CoramDeo Platform. Living in the presence of God.</p>
      </footer>

    </div>
  );
}
