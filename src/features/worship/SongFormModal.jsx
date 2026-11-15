import React, { useState, useEffect } from 'react';
import { Music, Guitar, Sparkles, Video, Globe, FileText, Shield } from 'lucide-react';
import { createSong, updateSong } from './worshipService';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import UltimateGuitarImportModal from './UltimateGuitarImportModal';
import Modal from '../../components/ui/Modal';

export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const str = url.trim();

  // Match embed URL (works for full iframe code paste as well)
  const embedMatch = str.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Match watch URL
  const watchMatch = str.match(/v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Match youtu.be URL
  const shortMatch = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Match shorts URL
  const shortsMatch = str.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function SongFormModal({ isOpen, onClose, song, onSaved }) {
  const { userProfile, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    composer: '',
    defaultKey: '',
    originalKey: '',
    tempoBpm: '',
    timeSignature: '',
    tags: '',
    status: 'active',
    allowPublicLyrics: false,
    directoryVisibility: 'hidden',
    allowLyricsInDirectory: false,
    language: 'english',
    category: 'contemporary',
    youtubeUrl: '',
    lyrics: '',
    chordChart: '',
    copyrightInfo: '',
    ccliSongNumber: ''
  });
  const [saving, setSaving] = useState(false);
  const [isUGModalOpen, setIsUGModalOpen] = useState(false);

  // Merge UG import data into the current form
  const handleUGMerge = (ugFormData) => {
    setFormData(prev => ({
      ...prev,
      ...ugFormData,
      title: prev.title || ugFormData.title,
      artist: prev.artist || ugFormData.artist,
      defaultKey: prev.defaultKey || ugFormData.defaultKey,
      originalKey: prev.originalKey || ugFormData.originalKey,
      chordChart: ugFormData.chordChart || prev.chordChart,
      lyrics: ugFormData.lyrics || prev.lyrics,
    }));
    setIsUGModalOpen(false);
  };

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || '',
        artist: song.artist || song.artistName || song.bandName || '',
        composer: song.composer || '',
        defaultKey: song.defaultKey || '',
        originalKey: song.originalKey || '',
        tempoBpm: song.tempoBpm || '',
        timeSignature: song.timeSignature || '',
        tags: song.tags ? song.tags.join(', ') : '',
        status: song.status || 'active',
        allowPublicLyrics: song.allowPublicLyrics || false,
        directoryVisibility: song.directoryVisibility || 'hidden',
        allowLyricsInDirectory: song.allowLyricsInDirectory !== undefined ? song.allowLyricsInDirectory : (song.allowPublicLyrics || false),
        language: song.language || 'english',
        category: song.category || 'contemporary',
        youtubeUrl: song.mediaReferences?.youtubeUrl || song.youtubeUrl || '',
        lyrics: song.lyrics || '',
        chordChart: song.chordChart || '',
        copyrightInfo: song.copyrightInfo || song.copyrightOwner || '',
        ccliSongNumber: song.ccliSongNumber || ''
      });
    } else {
      setFormData({
        title: '',
        artist: '',
        composer: '',
        defaultKey: '',
        originalKey: '',
        tempoBpm: '',
        timeSignature: '',
        tags: '',
        status: 'active',
        allowPublicLyrics: false,
        directoryVisibility: 'hidden',
        allowLyricsInDirectory: false,
        language: 'english',
        category: 'contemporary',
        youtubeUrl: '',
        lyrics: '',
        chordChart: '',
        copyrightInfo: '',
        ccliSongNumber: ''
      });
    }
  }, [song, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLyricsPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const lines = pastedText.split('\n');
    const chordRegex = /^[A-G][#b]?(?:m|min|maj|dim|aug|sus)?\d?(?:\/[A-G][#b]?)?$/;
    
    let lyricsLines = [];
    let detectedKey = formData.defaultKey;
    let hasChords = false;

    const isChordLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;

      const tokens = trimmed.split(/\s+/);
      let chordTokens = 0;
      
      for (const token of tokens) {
        if (token.toUpperCase() === 'N.C.') {
          chordTokens++;
          continue;
        }
        const cleanToken = token.replace(/[.,;!?]$/, '');
        if (chordRegex.test(cleanToken)) {
          chordTokens++;
        }
      }
      return (chordTokens / tokens.length) > 0.5;
    };

    lines.forEach(line => {
      if (isChordLine(line)) {
        hasChords = true;
        if (!detectedKey) {
          const firstToken = line.trim().split(/\s+/)[0];
          if (firstToken && firstToken.toUpperCase() !== 'N.C.') {
            const keyMatch = firstToken.match(/^[A-G][#b]?/);
            if (keyMatch) detectedKey = keyMatch[0];
          }
        }
      } else {
        lyricsLines.push(line);
      }
    });

    if (hasChords) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        lyrics: lyricsLines.join('\n'),
        chordChart: pastedText,
        defaultKey: detectedKey
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    
    setSaving(true);
    try {
      const videoId = extractYouTubeVideoId(formData.youtubeUrl);
      const mediaReferences = videoId ? {
        provider: 'youtube',
        youtubeUrl: formData.youtubeUrl,
        youtubeVideoId: videoId,
        youtubeTitle: formData.title || '',
        youtubeThumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      } : null;

      const dataToSave = {
        ...formData,
        allowPublicLyrics: Boolean(formData.allowLyricsInDirectory),
        mediaReferences: mediaReferences || null,
        youtubeVideoId: videoId || null,
        churchId: userProfile?.churchId || null,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : (formData.tags || []),
        tempoBpm: formData.tempoBpm ? Number(formData.tempoBpm) : null,
        createdBy: currentUser?.uid || null
      };
      
      if (song) {
        await updateSong(song.id, dataToSave);
      } else {
        await createSong(dataToSave);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save song');
    }
    setSaving(false);
  };

  const videoId = extractYouTubeVideoId(formData.youtubeUrl);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={song ? 'Edit Song' : 'Add New Song'}
        subtitle={song ? 'Update worship track details, chord charts, and community directory visibility' : 'Add a new song to your church catalog with chords and lyrics'}
        icon={Music}
        maxWidth="3xl"
        headerActions={
          !song && (
            <button
              type="button"
              onClick={() => setIsUGModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/70 rounded-xl text-xs font-semibold transition-colors"
            >
              <Guitar size={13} />
              <span>Auto-fill from Ultimate Guitar</span>
            </button>
          )
        }
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="song-form"
              disabled={saving}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : (song ? 'Save Changes' : 'Create Song')}
            </button>
          </>
        }
      >
        <form id="song-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Track Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <Music size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Song Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Song Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="e.g. 10,000 Reasons (Bless the Lord)"
                  value={formData.title} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Artist / Band</label>
                <input 
                  type="text" 
                  name="artist" 
                  placeholder="e.g. Matt Redman"
                  value={formData.artist} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Composer / Arranger</label>
                <input 
                  type="text" 
                  name="composer" 
                  placeholder="e.g. Jonas Myrin, Matt Redman"
                  value={formData.composer} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                />
              </div>

              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Default Key</label>
                  <input 
                    type="text" 
                    name="defaultKey"
                    placeholder="e.g. G, C#, Bb"
                    value={formData.defaultKey} 
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tempo (BPM)</label>
                  <input 
                    type="number" 
                    name="tempoBpm" 
                    placeholder="e.g. 73"
                    value={formData.tempoBpm} 
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Status</label>
                  <ModernDropdown
                    value={formData.status}
                    onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'archived', label: 'Archived' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Language</label>
                <ModernDropdown
                  value={formData.language}
                  onChange={(val) => handleChange({ target: { name: 'language', value: val } })}
                  options={[
                    { value: 'english', label: 'English' },
                    { value: 'tagalog', label: 'Tagalog' },
                    { value: 'ilocano', label: 'Ilocano' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Category</label>
                <ModernDropdown
                  value={formData.category}
                  onChange={(val) => handleChange({ target: { name: 'category', value: val } })}
                  options={[
                    { value: 'hymn', label: 'Hymn' },
                    { value: 'contemporary', label: 'Contemporary' },
                    { value: 'psalm', label: 'Psalm' },
                    { value: 'praise', label: 'Praise' },
                    { value: 'worship', label: 'Worship' },
                    { value: 'response', label: 'Response' },
                    { value: 'offertory', label: 'Offertory' },
                    { value: 'communion', label: 'Communion' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tags (comma separated)</label>
                <input 
                  type="text" 
                  name="tags"
                  placeholder="e.g. Praise, Fast, Cross, Easter"
                  value={formData.tags} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Card 2: Media Reference */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <Video size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Media & Video Reference</h3>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">YouTube Video Link</label>
              <input 
                type="text" 
                name="youtubeUrl"
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={formData.youtubeUrl} 
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
              />
              {videoId && (
                <div className="mt-3 flex items-center p-3 bg-red-50/70 rounded-xl border border-red-100">
                  <img 
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                    alt="YouTube Preview" 
                    className="w-24 h-16 object-cover rounded-lg mr-3 border border-red-200 shadow-2xs"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">YouTube Reference Preview</span>
                    <span className="text-xs text-slate-600">Video ID: <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-800 font-mono text-xs">{videoId}</code></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Mobile Community Directory */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <Globe size={14} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mobile Community Directory</h3>
                <p className="text-[11px] text-slate-500">Configure how this song appears in the mobile member app.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Directory Visibility</label>
                <ModernDropdown
                  value={formData.directoryVisibility}
                  onChange={(val) => handleChange({ target: { name: 'directoryVisibility', value: val } })}
                  options={[
                    { value: 'hidden', label: 'Hidden (Team Only)' },
                    { value: 'members_only', label: 'Members Only' },
                    { value: 'public', label: 'Public' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Allow Lyrics in Directory</label>
                <ModernDropdown
                  value={formData.allowLyricsInDirectory ? 'yes' : 'no'}
                  onChange={(val) => handleChange({ target: { name: 'allowLyricsInDirectory', type: 'checkbox', checked: val === 'yes' } })}
                  options={[
                    { value: 'no', label: 'No (Hide Lyrics)' },
                    { value: 'yes', label: 'Yes (Show Lyrics)' }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Lyrics & Chords */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <FileText size={14} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lyrics & Chord Chart</h3>
                <p className="text-[11px] text-slate-500">Paste lyrics with chords to auto-detect keys and separate lyrics.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Lyrics</label>
              <textarea 
                name="lyrics" 
                rows={6}
                value={formData.lyrics} 
                onChange={handleChange}
                onPaste={handleLyricsPaste}
                placeholder="Paste lyrics with chords here to auto-detect!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Chord Chart / Musician Notes</label>
              <textarea 
                name="chordChart" 
                rows={5}
                value={formData.chordChart} 
                onChange={handleChange}
                placeholder="[Verse 1]&#10;G       D/F#&#10;Bless the Lord O my soul..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
              />
            </div>
          </div>

          {/* Card 5: Licensing & Copyright */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <Shield size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Licensing & Copyright</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Copyright / License Info</label>
                <input 
                  type="text" 
                  name="copyrightInfo"
                  placeholder="e.g. Sovereign Grace Worship / Integrity Music"
                  value={formData.copyrightInfo} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">CCLI Song Number</label>
                <input 
                  type="text" 
                  name="ccliSongNumber"
                  placeholder="e.g. 7096627"
                  value={formData.ccliSongNumber} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] focus:ring-2 focus:ring-[#2C4A60]/10 transition-all" 
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <UltimateGuitarImportModal
        isOpen={isUGModalOpen}
        onClose={() => setIsUGModalOpen(false)}
        mergeMode={true}
        onMergeData={handleUGMerge}
      />
    </>
  );
}
