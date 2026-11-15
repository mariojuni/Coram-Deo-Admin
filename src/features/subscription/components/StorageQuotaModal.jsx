import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, ArrowRight, Trash2, AlertTriangle } from 'lucide-react';
import { useStorageQuota } from '../hooks/useStorageQuota';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';
import Modal from '../../../components/ui/Modal';

export default function StorageQuotaModal({ isOpen, onClose, fileSizeFormatted = null, targetTier = 'kingdom' }) {
  const navigate = useNavigate();
  const storage = useStorageQuota();

  if (!isOpen) return null;

  const targetPlan = SUBSCRIPTION_TIERS[targetTier] || SUBSCRIPTION_TIERS.kingdom;

  const handleGoToBilling = () => {
    onClose();
    navigate('/admin/settings/billing');
  };

  const subtitleText = fileSizeFormatted 
    ? `Uploading this ${fileSizeFormatted} file will exceed your church's allocated storage limit.`
    : `Your church workspace has reached its allocated cloud storage capacity.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Storage Capacity Reached"
      subtitle={subtitleText}
      icon={HardDrive}
      maxWidth="md"
      badge={
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle size={11} className="text-amber-600" />
          <span>Cloud Storage Quota</span>
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGoToBilling}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#162533] hover:bg-[#1E2E3D] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#162533]/20 transition-all active:scale-98"
          >
            <span>Upgrade to {targetPlan.name}</span>
            <ArrowRight size={14} />
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Visual Storage Meter */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <HardDrive size={14} className="text-[#2C4A60]" />
              <span>Current Plan Allocation</span>
            </span>
            <span className="text-slate-900 font-bold">
              {storage.totalGbFormatted} / {storage.quotaGbFormatted} ({storage.usagePercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, storage.usagePercentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Remaining: <strong className="text-slate-700">{storage.remainingFormatted}</strong></span>
            <span>Tier: <strong className="text-slate-700">{storage.sub.tierConfig.name}</strong></span>
          </div>
        </div>

        {/* Upgrade Proposal Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A60]">
              Recommended Solution
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#162533] text-white">
              50 GB Storage
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Upgrade to {targetPlan.name}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instantly expand your cloud storage to 50 GB to host high-definition video sermons, documents, and media without interruption.
          </p>
        </div>

        {/* Alternative: Clean up old sermons */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
          <Trash2 size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <span>
            Alternatively, you can free up space by deleting older sermon audio/video recordings that are no longer needed.
          </span>
        </div>
      </div>
    </Modal>
  );
}
