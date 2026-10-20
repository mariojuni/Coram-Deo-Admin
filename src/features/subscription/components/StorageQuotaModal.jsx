import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, HardDrive, Sparkles, ArrowRight, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useStorageQuota } from '../hooks/useStorageQuota';
import GradientButton from '../../../components/ui/GradientButton';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';

export default function StorageQuotaModal({ isOpen, onClose, fileSizeFormatted = null, targetTier = 'kingdom' }) {
  const navigate = useNavigate();
  const storage = useStorageQuota();

  if (!isOpen) return null;

  const targetPlan = SUBSCRIPTION_TIERS[targetTier] || SUBSCRIPTION_TIERS.kingdom;

  const handleGoToBilling = () => {
    onClose();
    navigate('/admin/settings/billing');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-6 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/80 text-church-slate hover:text-church-charcoal transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
            <AlertTriangle size={13} />
            <span>Cloud Storage Quota</span>
          </div>
          <h2 className="text-xl font-black text-church-navy">
            Storage Capacity Reached
          </h2>
          <p className="text-xs text-church-slate mt-0.5">
            {fileSizeFormatted 
              ? `Uploading this ${fileSizeFormatted} file will exceed your church's allocated storage limit.`
              : `Your church workspace has reached its allocated cloud storage capacity.`}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Visual Storage Meter */}
          <div className="p-4 rounded-2xl bg-church-canvas border border-gray-100">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 text-church-navy">
                <HardDrive size={14} className="text-church-rose" />
                <span>Current Plan Allocation</span>
              </span>
              <span className="text-church-charcoal">
                {storage.totalGbFormatted} / {storage.quotaGbFormatted} ({storage.usagePercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, storage.usagePercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-church-slate mt-2">
              <span>Remaining: <strong>{storage.remainingFormatted}</strong></span>
              <span>Tier: <strong>{storage.sub.tierConfig.name}</strong></span>
            </div>
          </div>

          {/* Upgrade Proposal Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                Recommended Solution
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                50 GB Storage
              </span>
            </div>
            <h4 className="text-sm font-black text-church-navy">
              Upgrade to {targetPlan.name}
            </h4>
            <p className="text-xs text-church-slate mt-0.5">
              Instantly expand your cloud storage from {storage.quotaGb} GB to 50 GB to host unlimited congregation recordings and files.
            </p>
          </div>

          {/* Alternative: Clean up old sermons */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-church-slate">
            <Trash2 size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <span>
              Alternatively, you can free up space by deleting older sermon audio/video files that are no longer needed.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100 hover:text-church-navy transition-colors"
          >
            Cancel
          </button>
          <GradientButton
            onClick={handleGoToBilling}
            icon={ArrowRight}
            size="sm"
          >
            Upgrade to {targetPlan.name}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
