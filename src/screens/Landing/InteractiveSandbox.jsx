import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Wallet, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  RotateCcw,
  Plus,
  ArrowRight
} from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

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
    <section id="sandbox" className="py-20 lg:py-28 bg-church-canvas border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-100 text-xs font-bold text-church-rose uppercase tracking-wider mb-3 shadow-church-soft">
            <Play size={13} className="fill-church-rose" />
            <span>Interactive Live Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Don't just read about it. <span className="text-gradient-coram">Run it.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            Test a working demo of Coram Deo right now in your browser. Complete three real church missions with zero sign-up or credit card.
          </p>
        </div>

        {/* Sandbox Mission Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-church-soft gap-1">
            <button
              onClick={() => setActiveTab('treasury')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'treasury'
                  ? 'bg-church-charcoal text-white shadow-church-soft'
                  : 'text-church-slate hover:text-church-charcoal'
              }`}
            >
              <Wallet size={16} />
              <span>1. Record Sunday Tithes</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-church-charcoal text-white shadow-church-soft'
                  : 'text-church-slate hover:text-church-charcoal'
              }`}
            >
              <QrCode size={16} />
              <span>2. QR Entrance Scan</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'report'
                  ? 'bg-church-charcoal text-white shadow-church-soft'
                  : 'text-church-slate hover:text-church-charcoal'
              }`}
            >
              <FileText size={16} />
              <span>3. Board Statement Export</span>
            </button>
          </div>
        </div>

        {/* Sandbox Working Canvas */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200/80 shadow-church-elevated p-6 sm:p-10 relative overflow-hidden">
          
          {/* Top Demo Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-church-emerald animate-pulse" />
              <span className="text-xs font-bold text-church-charcoal">Demo Church Session: Church of the Nazarene</span>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-church-rose hover:underline"
            >
              Sign in to real account →
            </button>
          </div>

          {/* Mission 1: Record Tithe Envelope */}
          {activeTab === 'treasury' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                
                {/* Form to enter envelope */}
                <form onSubmit={handleRecordEnvelope} className="space-y-4 bg-church-canvas p-5 rounded-2xl border border-gray-100">
                  <div className="text-xs font-black text-church-charcoal uppercase tracking-wider">
                    Enter Sunday Giving Envelope
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-church-slate mb-1">Member / Family</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-gray-200 text-church-charcoal focus:outline-none focus:border-church-rose"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-church-slate mb-1">Fund</label>
                      <select
                        value={selectedFund}
                        onChange={(e) => setSelectedFund(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-gray-200 text-church-charcoal focus:outline-none focus:border-church-rose"
                      >
                        <option value="Tithes">Tithes</option>
                        <option value="Offering">Loose Offering</option>
                        <option value="Missions">Missions Fund</option>
                        <option value="Building">Building Fund</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-church-slate mb-1">Amount (₱)</label>
                      <input
                        type="number"
                        value={envelopeAmount}
                        onChange={(e) => setEnvelopeAmount(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-gray-200 text-church-charcoal focus:outline-none focus:border-church-rose"
                        required
                      />
                    </div>
                  </div>

                  <GradientButton
                    type="submit"
                    size="sm"
                    className="w-full justify-center shadow-church-glow"
                    icon={Plus}
                  >
                    Record Envelope to Ledger
                  </GradientButton>

                  {envelopeSaved && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 size={14} className="text-church-emerald" />
                      <span>Saved! Ledger & Sunday Total updated instantly.</span>
                    </div>
                  )}
                </form>

                {/* Real-time Ledger Preview */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-church-charcoal to-gray-900 text-white shadow-church-soft">
                    <div className="text-xs font-bold text-white/70 uppercase">Total Sunday Giving Recorded</div>
                    <div className="text-3xl font-black mt-1 text-white">
                      ₱{tithesTotal.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      ✓ {envelopesCount} Envelopes audited & saved
                    </div>
                  </div>

                  <div className="text-xs text-church-slate leading-relaxed">
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
                <div className="text-xs font-bold uppercase tracking-wider text-church-emerald">
                  Sunday Service Attendance Scanner
                </div>
                <h3 className="text-xl font-black text-church-charcoal">
                  Simulate Entrance Kiosk Camera
                </h3>
                <p className="text-xs text-church-slate leading-relaxed">
                  Click the button below to simulate scanning a church member’s mobile QR code badge as they enter through the sanctuary doors.
                </p>

                <GradientButton
                  size="md"
                  onClick={handleSimulateScan}
                  disabled={scanning}
                  className="shadow-church-glow"
                  icon={QrCode}
                >
                  {scanning ? 'Scanning QR code...' : 'Scan Member Phone Badge'}
                </GradientButton>
              </div>

              <div className="bg-church-canvas p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <div className="text-xs font-bold text-church-slate mb-1">Sanctuary Live Count</div>
                <div className="text-4xl font-black text-church-charcoal mb-4">
                  {scannedCount}
                </div>

                {recentScannedMember ? (
                  <div className="w-full p-3 rounded-xl bg-white border border-emerald-100 shadow-church-soft text-left animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-church-emerald" />
                      <span className="text-xs font-black text-church-charcoal">{recentScannedMember.name}</span>
                    </div>
                    <div className="text-[10px] text-church-slate mt-0.5">
                      Badge: {recentScannedMember.badgeId} • Verified {recentScannedMember.time}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-church-slate py-2">
                    Waiting for first simulated scan...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mission 3: One-Click Board Report */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-black text-church-charcoal">Board-Ready Financial Statement</h3>
                  <p className="text-xs text-church-slate">Generated in 1 second. Clean, audited, and ready to print or email.</p>
                </div>
                <GradientButton
                  size="sm"
                  onClick={() => setReportGenerated(true)}
                  className="shadow-church-glow"
                >
                  Generate Statement
                </GradientButton>
              </div>

              {reportGenerated ? (
                <div className="bg-church-canvas p-6 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                    <div>
                      <div className="text-sm font-black text-church-charcoal">CHURCH OF THE NAZARENE</div>
                      <div className="text-[10px] text-church-slate">Weekly Stewardship & Financial Summary • October 2026</div>
                    </div>
                    <StatusPill variant="success" size="xs">Board Ready</StatusPill>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-church-slate block">Total Tithes & Offerings:</span>
                      <span className="font-extrabold text-church-charcoal text-sm">₱65,500.00</span>
                    </div>
                    <div>
                      <span className="text-church-slate block">Disbursements & Expenses:</span>
                      <span className="font-extrabold text-church-charcoal text-sm">₱18,240.00</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-church-slate">
                    <span>Certified True & Correct: Church Treasurer</span>
                    <span className="text-church-rose font-bold cursor-pointer hover:underline">Download Official PDF</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-church-canvas rounded-2xl border border-dashed border-gray-200">
                  <FileText size={28} className="mx-auto text-church-slate mb-2" />
                  <div className="text-xs font-bold text-church-charcoal">Click "Generate Statement" above to preview</div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Callout to Register or Sign In */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-church-slate text-center sm:text-left">
              Like what you see? You can configure your own church in about 10 minutes.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-church-charcoal hover:text-church-rose transition-colors"
              >
                Sign In
              </button>
              <GradientButton
                size="sm"
                onClick={() => navigate('/register?source=sandbox')}
                className="shadow-church-glow"
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
