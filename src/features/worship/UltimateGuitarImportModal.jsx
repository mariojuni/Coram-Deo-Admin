import React, { useState } from 'react';
import {
  Guitar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link,
  ArrowRight,
  Music2,
  ExternalLink,
  FileText,
  Check,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getActiveApp } from '../../firebase';
import { createSong } from './worshipService';
import { parseUGTabToFormData } from './utils/ultimateGuitarParser';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

// ─── Step constants ─────────────────────────────────────────────────────────
const STEP_INPUT   = 'input';
const STEP_LOADING = 'loading';
const STEP_REVIEW  = 'review';
const STEP_SUCCESS = 'success';

// ─── UG URL validator ────────────────────────────────────────────────────────
function isValidUGUrl(url) {
  try {
    const u = new URL(url);
    return (
      (u.hostname === 'tabs.ultimate-guitar.com' ||
        u.hostname === 'www.ultimate-guitar.com' ||
        u.hostname === 'ultimate-guitar.com') &&
      (u.pathname.includes('/tab/') || u.pathname.includes('/tabs/'))
    );
  } catch {
    return false;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UltimateGuitarImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  onMergeData,
  mergeMode = false,
}) {
  const { userProfile, currentUser } = useAuth();
  const [step, setStep]         = useState(STEP_INPUT);
  const [url, setUrl]           = useState('');
  const [urlError, setUrlError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [formData, setFormData] = useState(null);
  const [saving, setSaving]     = useState(false);

  const handleReset = () => {
    setStep(STEP_INPUT);
    setUrl('');
    setUrlError('');
    setFetchError('');
    setFormData(null);
    setSaving(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFetch = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setUrlError('Please paste an Ultimate Guitar tab URL.');
      return;
    }
    if (!isValidUGUrl(trimmedUrl)) {
      setUrlError('That doesn\'t look like a valid Ultimate Guitar tab URL. It should be from tabs.ultimate-guitar.com');
      return;
    }

    setUrlError('');
    setFetchError('');
    setStep(STEP_LOADING);

    try {
      const functions = getFunctions(getActiveApp(), 'asia-southeast1');
      const fetchTab  = httpsCallable(functions, 'fetchUltimateGuitarTab');
      const result    = await fetchTab({ url: trimmedUrl });

      if (!result.data?.ok || !result.data?.tab) {
        throw new Error('No tab data returned. The song may not be publicly available.');
      }

      const mapped = parseUGTabToFormData(result.data.tab);
      setFormData(mapped);
      setStep(STEP_REVIEW);
    } catch (err) {
      console.error('[UG Import]', err);
      setFetchError(
        err?.message ||
        'Failed to fetch song data. The tab may be behind a paywall or the URL may be incorrect.'
      );
      setStep(STEP_INPUT);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDropdownChange = (field) => (val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    if (!formData?.title) return;

    if (mergeMode && onMergeData) {
      onMergeData(formData);
      handleClose();
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        allowPublicLyrics: Boolean(formData.allowLyricsInDirectory),
        churchId: userProfile?.churchId || null,
        tags: typeof formData.tags === 'string'
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : (formData.tags || []),
        tempoBpm: formData.tempoBpm ? Number(formData.tempoBpm) : null,
        createdBy: currentUser?.uid || null,
      };
      await createSong(dataToSave);
      setStep(STEP_SUCCESS);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      console.error('[UG Import] Save failed', err);
      alert('Failed to save song: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import from Ultimate Guitar"
      subtitle={
        step === STEP_REVIEW
          ? 'Review and adjust track details, chords, and lyrics before saving'
          : 'Paste an Ultimate Guitar tab URL to import chords and lyrics automatically'
      }
      icon={Guitar}
      maxWidth={step === STEP_REVIEW ? '5xl' : 'lg'}
      badge={
        step === STEP_REVIEW ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
            Preview & Edit
          </span>
        ) : null
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {step === STEP_REVIEW && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
              >
                ← Try another URL
              </button>
            )}
            {step === STEP_SUCCESS && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
              >
                ← Import another
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {step === STEP_SUCCESS ? 'Close' : 'Cancel'}
            </button>

            {step === STEP_INPUT && (
              <button
                type="button"
                onClick={handleFetch}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-2xs"
              >
                <span>Fetch Song</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === STEP_REVIEW && (
              <button
                type="button"
                onClick={handleSave}
                disabled={!formData?.title || saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : mergeMode ? (
                  <span>Use This Song</span>
                ) : (
                  <span>Save to Library</span>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Step: URL Input */}
      {step === STEP_INPUT && (
        <div className="space-y-4">
          {fetchError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200/70 text-red-700 rounded-xl p-3.5 text-xs font-semibold">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
              <span>{fetchError}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Ultimate Guitar Tab URL *
              </label>
              <div className="relative">
                <Link
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  placeholder="https://tabs.ultimate-guitar.com/tab/..."
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A60]/10 transition-all ${
                    urlError
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-slate-200/80 focus:border-[#2C4A60]'
                  }`}
                />
              </div>
              {urlError && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} />
                  <span>{urlError}</span>
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Music2 size={14} className="text-amber-700" />
                <span>How to use</span>
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-amber-800">
                <li>Go to <strong>tabs.ultimate-guitar.com</strong> and find a chord chart</li>
                <li>Copy the full URL from your browser address bar</li>
                <li>Paste it above and click <strong>Fetch Song</strong></li>
              </ol>
              <p className="text-[11px] text-amber-700 italic pt-1 border-t border-amber-200/60">
                Note: Pro-only tabs or tabs behind a paywall cannot be imported.
              </p>
            </div>

            {/* CCLI reminder */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs text-slate-600">
              <strong className="text-slate-800">Licensing reminder:</strong> Ensure your church has proper licensing (e.g. CCLI) before storing or projecting this song.
            </div>
          </div>
        </div>
      )}

      {/* Step: Loading */}
      {step === STEP_LOADING && (
        <div className="py-16 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] border border-[#D5E3EC] flex items-center justify-center text-[#2C4A60]">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Fetching song data…</p>
            <p className="text-xs text-slate-500 mt-1">Connecting to Ultimate Guitar</p>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === STEP_REVIEW && formData && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left pane — metadata fields */}
          <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Song Details
              </h3>
              {formData.ugSourceUrl && (
                <a
                  href={formData.ugSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 font-semibold"
                >
                  <span>View on UG</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Artist / Band
                </label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Composer
                </label>
                <input
                  type="text"
                  name="composer"
                  value={formData.composer}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Key
                </label>
                <input
                  type="text"
                  name="defaultKey"
                  value={formData.defaultKey}
                  onChange={handleFieldChange}
                  placeholder="e.g. G"
                  className="w-full px-2.5 py-2 text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  BPM
                </label>
                <input
                  type="number"
                  name="tempoBpm"
                  value={formData.tempoBpm}
                  onChange={handleFieldChange}
                  placeholder="—"
                  className="w-full px-2.5 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Time Sig
                </label>
                <input
                  type="text"
                  name="timeSignature"
                  value={formData.timeSignature}
                  onChange={handleFieldChange}
                  placeholder="4/4"
                  className="w-full px-2.5 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Category
                </label>
                <ModernDropdown
                  value={formData.category}
                  onChange={handleDropdownChange('category')}
                  options={[
                    { value: 'hymn', label: 'Hymn' },
                    { value: 'contemporary', label: 'Contemporary' },
                    { value: 'psalm', label: 'Psalm' },
                    { value: 'praise', label: 'Praise' },
                    { value: 'worship', label: 'Worship' },
                    { value: 'response', label: 'Response' },
                    { value: 'offertory', label: 'Offertory' },
                    { value: 'communion', label: 'Communion' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Language
                </label>
                <ModernDropdown
                  value={formData.language}
                  onChange={handleDropdownChange('language')}
                  options={[
                    { value: 'english', label: 'English' },
                    { value: 'tagalog', label: 'Tagalog' },
                    { value: 'cebuano', label: 'Cebuano' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleFieldChange}
                placeholder="e.g. Praise, Fast, Easter"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Copyright / License
                </label>
                <input
                  type="text"
                  name="copyrightInfo"
                  value={formData.copyrightInfo}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  CCLI Song #
                </label>
                <input
                  type="text"
                  name="ccliSongNumber"
                  value={formData.ccliSongNumber}
                  onChange={handleFieldChange}
                  placeholder="e.g. 7096627"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#2C4A60]"
                />
              </div>
            </div>
          </div>

          {/* Right pane — chord chart & lyrics */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lyrics Preview
              </h3>
              <textarea
                name="lyrics"
                rows={7}
                value={formData.lyrics || ''}
                onChange={handleFieldChange}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:bg-white focus:border-[#2C4A60] font-mono"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lyrics & Chords Chart
              </h3>
              <textarea
                name="chordChart"
                rows={9}
                value={formData.chordChart || ''}
                onChange={handleFieldChange}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 font-mono text-xs leading-relaxed focus:outline-none focus:bg-white focus:border-[#2C4A60]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === STEP_SUCCESS && (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">Song Imported Successfully!</p>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{formData?.title}</strong> has been added to your church worship catalog.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
