import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Play, Pause, CheckCircle, Archive, Image as ImageIcon, Trash2, Target, Eye } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

export default function CampaignFormModal({ isOpen, onClose, campaign }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    campaignType: 'building_project',
    allowPublicProgress: true,
    allowPublicExpenses: false,
    coverImageUrl: '',
    fundId: '',
    fundType: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pauseReason, setPauseReason] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [funds, setFunds] = useState([]);

  // Mode determines what we are doing: edit, activate, pause, complete, archive
  const mode = campaign?._action || (campaign ? 'edit' : 'create');

  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title || '',
        description: campaign.description || '',
        goalAmount: campaign.goalAmount || '',
        campaignType: campaign.campaignType || 'building_project',
        allowPublicProgress: campaign.allowPublicProgress ?? true,
        allowPublicExpenses: campaign.allowPublicExpenses ?? false,
        coverImageUrl: campaign.coverImageUrl || '',
        fundId: campaign.fundId || '',
        fundType: campaign.fundType || '',
      });
      setCoverImageFile(null);
      setUploadProgress(0);
    } else {
      setFormData({
        title: '',
        description: '',
        goalAmount: '',
        campaignType: 'building_project',
        allowPublicProgress: true,
        allowPublicExpenses: false,
        coverImageUrl: '',
        fundId: '',
        fundType: '',
      });
      setCoverImageFile(null);
      setUploadProgress(0);
    }
  }, [campaign, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const fetchFunds = async () => {
        try {
          if (!CHURCH_ID) return;
          const { query, where, getDocs } = await import('firebase/firestore');
          const q = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID), where('status', '==', 'active'));
          const snap = await getDocs(q);
          const activeFunds = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setFunds(activeFunds);

          if (!campaign && activeFunds.length > 0) {
            setFormData(prev => ({
              ...prev,
              fundId: prev.fundId || activeFunds[0].id,
              fundType: prev.fundType || activeFunds[0].type || 'special_project'
            }));
          }
        } catch (err) {
          console.error("Error fetching funds for campaign:", err);
        }
      };
      fetchFunds();
    }
  }, [isOpen, CHURCH_ID, campaign]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFundChange = (fundId) => {
    const selected = funds.find(f => f.id === fundId);
    setFormData(prev => ({
      ...prev,
      fundId,
      fundType: selected ? (selected.type || 'special_project') : ''
    }));
  };

  const handleAction = async (newStatus) => {
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'givingCampaigns', campaign.id);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'paused') {
        updateData.pauseReason = pauseReason;
      }

      await updateDoc(docRef, updateData);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to update campaign status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalCoverImageUrl = formData.coverImageUrl;

      // Handle Image Upload if a file was selected
      if (coverImageFile) {
        const fileExt = coverImageFile.name.split('.').pop();
        const fileName = `campaign_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `campaigns/${CHURCH_ID}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, coverImageFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (err) => reject(err),
            async () => {
              finalCoverImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const campaignData = {
        ...formData,
        coverImageUrl: finalCoverImageUrl,
        goalAmount: Number(formData.goalAmount) || 0,
        status: campaign?.status || 'draft',
        updatedAt: serverTimestamp(),
        churchId: CHURCH_ID
      };

      if (!campaign || !campaign.id) {
        campaignData.createdAt = serverTimestamp();
        campaignData.raisedAmount = 0;
        campaignData.donorCount = 0;
        const newDocRef = doc(collection(db, 'givingCampaigns'));
        await setDoc(newDocRef, campaignData);
      } else {
        const docRef = doc(db, 'givingCampaigns', campaign.id);
        await updateDoc(docRef, campaignData);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'activate': return 'Activate Campaign';
      case 'pause': return 'Pause Campaign';
      case 'resume': return 'Resume Campaign';
      case 'complete': return 'Complete Campaign';
      case 'archive': return 'Archive Campaign';
      case 'edit': return 'Campaign Settings';
      default: return 'Create Giving Campaign';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'activate': return 'Review and launch campaign for public and member donations';
      case 'pause': return 'Temporarily halt active contributions to this campaign';
      case 'resume': return 'Reopen contributions and restore mobile visibility';
      case 'complete': return 'Mark campaign project goals as fulfilled and concluded';
      case 'archive': return 'Remove campaign from active dashboards into audit archives';
      case 'edit': return 'Update target objectives, fund assignment, and progress visibility';
      default: return 'Configure a designated stewardship campaign or building drive';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'activate': return Play;
      case 'pause': return Pause;
      case 'resume': return Play;
      case 'complete': return CheckCircle;
      case 'archive': return Archive;
      default: return Target;
    }
  };

  // Lifecycle confirmation dialog screens
  if (mode === 'pause' || mode === 'resume' || mode === 'complete' || mode === 'archive') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={getTitle()}
        subtitle={getSubtitle()}
        icon={getIcon()}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
            >
              Cancel
            </button>
            {mode === 'pause' && (
              <button
                type="button"
                onClick={() => handleAction('paused')}
                disabled={loading}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Pausing...' : 'Confirm Pause'}
              </button>
            )}
            {mode === 'resume' && (
              <button
                type="button"
                onClick={() => handleAction('active')}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Resuming...' : 'Confirm Resume'}
              </button>
            )}
            {mode === 'complete' && (
              <button
                type="button"
                onClick={() => handleAction('completed')}
                disabled={loading}
                className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Mark Completed'}
              </button>
            )}
            {mode === 'archive' && (
              <button
                type="button"
                onClick={() => handleAction('archived')}
                disabled={loading}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Archiving...' : 'Archive Campaign'}
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">{campaign?.title}</h4>
            {mode === 'pause' && (
              <>
                <p className="text-xs text-slate-500">
                  Pausing this campaign will hide donation options in the member mobile app until resumed.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for pause (Optional)</label>
                  <input
                    type="text"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="e.g., Temporarily awaiting permits, seasonal pause"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                  />
                </div>
              </>
            )}
            {mode === 'resume' && (
              <p className="text-xs text-slate-500">
                This will reactivate the campaign and allow members to resume giving towards this goal.
              </p>
            )}
            {mode === 'complete' && (
              <p className="text-xs text-slate-500">
                Marking this campaign completed indicates that the target milestone was reached. Giving will be locked.
              </p>
            )}
            {mode === 'archive' && (
              <p className="text-xs text-slate-500">
                Archiving will hide this campaign from all active views. Historical giving records remain preserved.
              </p>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  // Standard Create / Edit / Activate Modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      maxWidth="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          
          {mode === 'activate' ? (
            <button
              type="submit"
              form="campaign-form"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Play size={14} />
              <span>{loading ? 'Activating...' : 'Activate Campaign'}</span>
            </button>
          ) : (
            <>
              {campaign && campaign.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => handleAction('active')}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play size={14} />
                  <span>Activate</span>
                </button>
              )}
              <button
                type="submit"
                form="campaign-form"
                disabled={loading}
                className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (!campaign || campaign.status === 'draft' ? 'Save Draft' : 'Save Changes')}
              </button>
            </>
          )}
        </>
      }
    >
      <form id="campaign-form" onSubmit={(e) => {
        if (mode === 'activate') {
          e.preventDefault();
          handleAction('active');
        } else {
          handleSubmit(e);
        }
      }} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Section 1: Campaign Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Target size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Campaign Overview
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">General objective and target financial milestone</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Campaign Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              placeholder="e.g. New Church Building & Sanctuary Expansion"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
              placeholder="Describe the purpose, vision, and prayer needs of this campaign..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Goal (₱) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                <input
                  type="number"
                  name="goalAmount"
                  required
                  min="1"
                  step="1"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-bold text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
                  placeholder="100000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Associated Fund *</label>
              <ModernDropdown
                value={formData.fundId}
                onChange={handleFundChange}
                options={funds.map(f => ({ value: f.id, label: `${f.name} (${f.type || 'special_project'})` }))}
                placeholder="Select designated fund"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Media & Cover */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <ImageIcon size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cover Photo & Presentation
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Visual banner displayed in congregation portals</p>
            </div>
          </div>

          {(coverImageFile || formData.coverImageUrl) ? (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200">
              <img 
                src={coverImageFile ? URL.createObjectURL(coverImageFile) : formData.coverImageUrl} 
                alt="Cover Preview" 
                className="w-full h-36 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setCoverImageFile(null);
                  setFormData(prev => ({ ...prev, coverImageUrl: '' }));
                }}
                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-700 transition-colors"
                title="Remove Image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <ImageIcon className="text-[#2C4A60] mb-1.5" size={24} />
              <span className="text-xs font-bold text-[#2C4A60]">Upload Cover Photo</span>
              <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WebP up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCoverImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-[#2C4A60] h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>

        {/* Section 3: Transparency & Public Visibility */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Eye size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Transparency & Visibility
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Control progress and disbursement disclosures</p>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              name="allowPublicProgress"
              checked={formData.allowPublicProgress}
              onChange={handleChange}
              className="mt-0.5 rounded border-slate-300 text-[#2C4A60] focus:ring-[#2C4A60]"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Show Progress Bar on Public Link</span>
              <span className="text-[11px] text-slate-400">Allows donors to view raised amount vs. goal in real-time</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              name="allowPublicExpenses"
              checked={formData.allowPublicExpenses}
              onChange={handleChange}
              className="mt-0.5 rounded border-slate-300 text-[#2C4A60] focus:ring-[#2C4A60]"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Public Expense Transparency</span>
              <span className="text-[11px] text-slate-400">Allows public donors to audit project expenditures deducted from this fund</span>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
}
