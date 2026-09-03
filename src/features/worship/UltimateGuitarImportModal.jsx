import React, { useState } from 'react';
import {
  X,
  Guitar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link,
  ArrowRight,
  Music2,
  ExternalLink,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getActiveApp } from '../../firebase';
import { createSong } from './worshipService';
import { parseUGTabToFormData } from './utils/ultimateGuitarParser';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';

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
  /** When provided, the modal will merge data into the parent form instead of saving directly */
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

  if (!isOpen) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────

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

    // Merge mode — pass data to parent form instead of saving
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-church-navy/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative bg-white rounded-3xl shadow-xl z-10 flex flex-col overflow-hidden transition-all duration-200 ${
          step === STEP_REVIEW
            ? 'w-full max-w-5xl max-h-[92vh]'
            : 'w-full max-w-lg'
        }`}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Guitar size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-church-navy leading-tight">
                Import from Ultimate Guitar
              </h2>
              <p className="text-xs text-gray-500 leading-tight">
                {step === STEP_REVIEW
                  ? 'Review & edit before saving'
                  : 'Paste a tab URL to auto-fill song details'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}

        {/* Step: URL Input */}
        {step === STEP_INPUT && (
          <div className="p-6 space-y-5">
            {fetchError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-church-navy mb-2">
                Ultimate Guitar Tab URL
              </label>
              <div className="relative">
                <Link
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                  className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 transition-colors ${
                    urlError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : 'border-gray-200 focus:border-church-green focus:ring-church-green'
                  }`}
                />
              </div>
              {urlError && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {urlError}
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 text-xs text-orange-800 space-y-1.5">
              <p className="font-semibold text-orange-900 flex items-center gap-1.5">
                <Music2 size={14} />
                How to use
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Go to <strong>tabs.ultimate-guitar.com</strong> and find a chord chart</li>
                <li>Copy the full URL from your browser address bar</li>
                <li>Paste it above and click <strong>Fetch Song</strong></li>
              </ol>
              <p className="pt-1 text-orange-700 italic">
                Note: Pro-only tabs or tabs behind a paywall cannot be imported.
              </p>
            </div>

            {/* CCLI reminder */}
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-800">
              <strong>Licensing reminder:</strong> Ensure your church has proper licensing (e.g. CCLI)
              before storing or projecting this song.
            </div>
          </div>
        )}

        {/* Step: Loading */}
        {step === STEP_LOADING && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
              <Loader2 size={28} className="text-orange-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-church-navy">Fetching song data…</p>
              <p className="text-sm text-gray-500 mt-1">Connecting to Ultimate Guitar</p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === STEP_REVIEW && formData && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
            {/* Left pane — metadata fields */}
            <div className="w-full md:w-[42%] border-r border-gray-100 overflow-y-auto p-6 space-y-4 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-church-navy uppercase tracking-wider">
                  Song Details
                </h3>
                {formData.ugSourceUrl && (
                  <a
                    href={formData.ugSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 hover:text-orange-700 flex items-center gap-1"
                  >
                    View on UG <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                />
              </div>

              {/* Artist + Composer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    Artist / Band
                  </label>
                  <input
                    type="text"
                    name="artist"
                    value={formData.artist}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    Composer
                  </label>
                  <input
                    type="text"
                    name="composer"
                    value={formData.composer}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
              </div>

              {/* Key + BPM + Time Sig */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    Key
                  </label>
                  <input
                    type="text"
                    name="defaultKey"
                    value={formData.defaultKey}
                    onChange={handleFieldChange}
                    placeholder="e.g. G"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    BPM
                  </label>
                  <input
                    type="number"
                    name="tempoBpm"
                    value={formData.tempoBpm}
                    onChange={handleFieldChange}
                    placeholder="—"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    Time Sig
                  </label>
                  <input
                    type="text"
                    name="timeSignature"
                    value={formData.timeSignature}
                    onChange={handleFieldChange}
                    placeholder="4/4"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
              </div>

              {/* Category + Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
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
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
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

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFieldChange}
                  placeholder="e.g. Praise, Fast, Easter"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                />
              </div>

              {/* Copyright + CCLI */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    Copyright / License
                  </label>
                  <input
                    type="text"
                    name="copyrightInfo"
                    value={formData.copyrightInfo}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-church-slate mb-1 uppercase tracking-wider">
                    CCLI Song #
                  </label>
                  <input
                    type="text"
                    name="ccliSongNumber"
                    value={formData.ccliSongNumber}
                    onChange={handleFieldChange}
                    placeholder="e.g. 7096627"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
                  />
                </div>
              </div>

              {/* CCLI reminder */}
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-800">
                <strong>Licensing reminder:</strong> Please ensure your church has permission
                or proper CCLI licensing before storing, projecting, or sharing this song.
              </div>
            </div>

            {/* Right pane — chord chart & lyrics */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold text-church-navy uppercase tracking-wider mb-2 shrink-0">
                  Lyrics
                </h3>
                <textarea
                  name="lyrics"
                  value={formData.lyrics || ''}
                  onChange={handleFieldChange}
                  className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-church-green shadow-inner resize-none"
                />
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold text-church-navy uppercase tracking-wider mb-2 shrink-0">
                  Lyrics & Chords
                </h3>
                <textarea
                  name="chordChart"
                  value={formData.chordChart || ''}
                  onChange={handleFieldChange}
                  className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-xs leading-relaxed focus:outline-none focus:border-church-green shadow-inner resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === STEP_SUCCESS && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-church-navy">Song Imported!</p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{formData?.title}</strong> has been added to your library.
              </p>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-between items-center shrink-0">
          {/* Left — back / try another */}
          <div>
            {step === STEP_REVIEW && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                ← Try another URL
              </button>
            )}
            {step === STEP_SUCCESS && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                ← Import another
              </button>
            )}
          </div>

          {/* Right — primary actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {step === STEP_SUCCESS ? 'Close' : 'Cancel'}
            </button>

            {step === STEP_INPUT && (
              <button
                onClick={handleFetch}
                className="flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
              >
                Fetch Song <ArrowRight size={16} className="ml-1.5" />
              </button>
            )}

            {step === STEP_REVIEW && (
              <button
                onClick={handleSave}
                disabled={!formData?.title || saving}
                className="flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-church-green hover:bg-church-green/90 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : mergeMode ? (
                  'Use This Song'
                ) : (
                  'Save to Library'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
