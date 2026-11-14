import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Wallet, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  Plus
} from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import { CathedralLogo } from '../../components/ui/icons';

export default function InteractiveSandbox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('treasury');

  // Interactive State for Mission 1: Treasury Envelope
  const [tithesTotal, setTithesTotal] = useState(48500);
  const [envelopesCount, setEnvelopesCount] = useState(32);
  const [donorName, setDonorName] = useState('Dela Cruz Family');
  const [selectedFund, setSelectedFund] = useState('Tithes');
  const [envelopeAmount, setEnvelopeAmount] = useState('3500');
  const [envelopeSaved, setEnvelopeSaved] = useState(false);

  // Interactive State for Mission 2: QR Scanner
  const [scannedCount, setScannedCount] = useState(184);
  const [recentScannedMember, setRecentScannedMember] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Interactive State for Mission 3: One-Click Report
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleRecordEnvelope = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(envelopeAmount) || 0;
    if (amountNum > 0) {
      setTithesTotal((prev) => prev + amountNum);
      setEnvelopesCount((prev) => prev + 1);
      setEnvelopeSaved(true);
      setTimeout(() => setEnvelopeSaved(false), 3000);
    }
  };

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedCount((prev) => prev + 1);
      setRecentScannedMember({
        name: 'Maria Santos & Family',
        badgeId: 'CD-8842',
        time: 'Just now'
      });
    }, 800);
  };

  return (
    <section id="sandbox" className="py-20 lg:py-28 bg-transparent border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">Interactive Live Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            Don't just read about it. <span className="bg-gradient-to-r from-[#2C4A60] via-[#4F748E] to-[#6892AD] bg-clip-text text-transparent">Run it.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            Test a working demo of Coram Deo right now in your browser. Complete three real church missions with zero sign-up or credit card.
          </p>
        </div>

        {/* Sandbox Mission Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl glass-light-pill gap-1">
            <button
              onClick={() => setActiveTab('treasury')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'treasury'
                  ? 'bg-[#162533] text-white shadow-xs'
                  : 'text-[#5A7385] hover:text-[#1E2E3D]'
              }`}
            >
              <Wallet size={16} />
              <span>1. Record Sunday Tithes</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-[#162533] text-white shadow-xs'
                  : 'text-[#5A7385] hover:text-[#1E2E3D]'
              }`}
            >
              <QrCode size={16} />
              <span>2. QR Entrance Scan</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'report'
                  ? 'bg-[#162533] text-white shadow-xs'
                  : 'text-[#5A7385] hover:text-[#1E2E3D]'
              }`}
            >
              <FileText size={16} />
              <span>3. Board Statement Export</span>
            </button>
          </div>
        </div>

        {/* Sandbox Working Canvas */}
        <div className="max-w-4xl mx-auto glass-light-card rounded-3xl p-6 sm:p-10 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)] relative overflow-hidden">
          
          {/* Top Demo Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/70 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#1E2E3D]">Demo Church Session: Church of the Nazarene</span>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-[#2C4A60] hover:underline"
            >
              Sign in to real account →
            </button>
          </div>

          {/* Mission 1: Record Tithe Envelope */}
          {activeTab === 'treasury' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                
                {/* Form to enter envelope */}
                <form onSubmit={handleRecordEnvelope} className="space-y-4 bg-white/75 backdrop-blur-md p-5 rounded-2xl border border-white/90 shadow-2xs">
                  <div className="text-xs font-black text-brand-dark uppercase tracking-wider">
                    Enter Sunday Giving Envelope
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Member / Family</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Fund</label>
                      <select
                        value={selectedFund}
                        onChange={(e) => setSelectedFund(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 focus:outline-none focus:border-brand-primary"
                      >
                        <option value="Tithes">Tithes</option>
                        <option value="Offering">Loose Offering</option>
                        <option value="Missions">Missions Fund</option>
                        <option value="Building">Building Fund</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Amount (₱)</label>
                      <input
                        type="number"
                        value={envelopeAmount}
                        onChange={(e) => setEnvelopeAmount(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 focus:outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                  </div>

                  <GradientButton
                    type="submit"
                    size="sm"
                    variant="primary"
                    className="w-full justify-center shadow-xs"
                    icon={Plus}
                  >
                    Record Envelope to Ledger
                  </GradientButton>

                  {envelopeSaved && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in border border-emerald-200/60">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Saved! Ledger & Sunday Total updated instantly.</span>
                    </div>
                  )}
                </form>

                {/* Real-time Ledger Preview */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-sm">
                    <div className="text-xs font-bold text-white/70 uppercase">Total Sunday Giving Recorded</div>
                    <div className="text-3xl font-black mt-1 text-white">
                      ₱{tithesTotal.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      ✓ {envelopesCount} Envelopes audited & saved
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed">
                    Notice how easy that was? No spreadsheets, no formulas to mess up, and every entry is timestamped with the treasurer's credentials.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Mission 2: Sunday QR Kiosk Scan */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Sunday Service Attendance Scanner
                </div>
                <h3 className="text-xl font-black text-brand-dark">
                  Simulate Entrance Kiosk Camera
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click the button below to simulate scanning a church member’s mobile QR code badge as they enter through the sanctuary doors.
                </p>

                <GradientButton
                  size="md"
                  variant="primary"
                  onClick={handleSimulateScan}
                  disabled={scanning}
                  className="shadow-xs"
                  icon={QrCode}
                >
                  {scanning ? 'Scanning QR code...' : 'Scan Member Phone Badge'}
                </GradientButton>
              </div>

              <div className="bg-white/75 backdrop-blur-md p-6 rounded-2xl border border-white/90 shadow-2xs flex flex-col items-center text-center">
                <div className="text-xs font-bold text-slate-500 mb-1">Sanctuary Live Count</div>
                <div className="text-4xl font-black text-brand-dark mb-4">
                  {scannedCount}
                </div>

                {recentScannedMember ? (
                  <div className="w-full p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs text-left animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-xs font-black text-brand-dark">{recentScannedMember.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Badge: {recentScannedMember.badgeId} • Verified {recentScannedMember.time}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-2">
                    Waiting for first simulated scan...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mission 3: One-Click Board Report */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/60">
                <div>
                  <h3 className="text-lg font-black text-brand-dark">Board-Ready Financial Statement</h3>
                  <p className="text-xs text-slate-600">Generated in 1 second. Clean, audited, and ready to print or email.</p>
                </div>
                <GradientButton
                  size="sm"
                  variant="primary"
                  onClick={() => setReportGenerated(true)}
                  className="shadow-xs"
                >
                  Generate Statement
                </GradientButton>
              </div>

              {reportGenerated ? (
                <div className="bg-white/75 backdrop-blur-md p-6 rounded-2xl border border-white/90 shadow-2xs space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-start border-b border-slate-200/50 pb-3">
                    <div>
                      <div className="text-sm font-black text-brand-dark">CHURCH OF THE NAZARENE</div>
                      <div className="text-[10px] text-slate-500">Weekly Stewardship & Financial Summary • October 2026</div>
                    </div>
                    <StatusPill variant="navy" size="xs">Board Ready</StatusPill>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Tithes & Offerings:</span>
                      <span className="font-extrabold text-brand-dark text-sm">₱65,500.00</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Disbursements & Expenses:</span>
                      <span className="font-extrabold text-brand-dark text-sm">₱18,240.00</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/50 flex justify-between items-center text-xs text-slate-600">
                    <span>Certified True & Correct: Church Treasurer</span>
                    <span className="text-brand-primary font-bold cursor-pointer hover:underline">Download Official PDF</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-300">
                  <FileText size={28} className="mx-auto text-slate-400 mb-2" />
                  <div className="text-xs font-bold text-slate-600">Click "Generate Statement" above to preview</div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Callout to Register or Sign In */}
          <div className="mt-8 pt-6 border-t border-white/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600 text-center sm:text-left">
              Like what you see? You can configure your own church in about 10 minutes.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-slate-700 hover:text-brand-primary transition-colors"
              >
                Sign In
              </button>
              <GradientButton
                size="sm"
                variant="primary"
                onClick={() => navigate('/register?source=sandbox')}
                className="shadow-xs"
              >
                Create Your Church Free
              </GradientButton>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
