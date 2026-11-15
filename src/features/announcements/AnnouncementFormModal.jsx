import React, { useState, useEffect } from 'react';
import { Smartphone, Megaphone, Calendar, Users, Shield, RefreshCw } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const CORE_AUDIENCE_OPTIONS = [
  'All Members',
  'All Full Members',
  'Fellowship Members',
  'Ministry Leaders'
];

export default function AnnouncementFormModal({ isOpen, onClose, announcement }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState(['All Members']);
  
  const [ministries, setMinistries] = useState([]);
  const [loadingMinistries, setLoadingMinistries] = useState(false);
  
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  const [pushNotification, setPushNotification] = useState(true);
  const [resendPush, setResendPush] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch church ministries for dynamic ministry tags
  useEffect(() => {
    if (!isOpen || !CHURCH_ID) return;

    const fetchMinistries = async () => {
      setLoadingMinistries(true);
      try {
        const qMin = query(collection(db, 'ministries'), where('churchId', '==', CHURCH_ID));
        const snap = await getDocs(qMin);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter active ministries and sort alphabetically
        const activeMinistries = docs
          .filter(m => m.name && m.status !== 'Archived')
          .sort((a, b) => a.name.localeCompare(b.name));
        setMinistries(activeMinistries);
      } catch (err) {
        console.error('Error fetching ministries for announcement tags:', err);
      } finally {
        setLoadingMinistries(false);
      }
    };

    fetchMinistries();
  }, [isOpen, CHURCH_ID]);

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '');
      setMessage(announcement.message || '');
      setImageUrl(announcement.imageUrl || '');
      setTargetAudience(announcement.targetAudience || ['All Members']);
      
      // Parse publishDate to local datetime-local string
      if (announcement.publishDate) {
        const d = new Date(announcement.publishDate);
        setPublishDate(d.toISOString().slice(0, 16));
      } else {
        setPublishDate('');
      }

      // Parse expiryDate
      if (announcement.expiryDate) {
        const d = new Date(announcement.expiryDate);
        setExpiryDate(d.toISOString().slice(0, 16));
      } else {
        setExpiryDate('');
      }

      setPushNotification(announcement.pushNotification !== false);
      setResendPush(false);
    } else {
      setTitle('');
      setMessage('');
      setImageUrl('');
      setTargetAudience(['All Members']);
      setPublishDate('');
      setExpiryDate('');
      setPushNotification(true);
      setResendPush(false);
    }
    setError('');
  }, [announcement, isOpen]);

  if (!isOpen) return null;

  const toggleAudience = (tag) => {
    if (tag === 'All Members') {
      setTargetAudience(['All Members']);
      return;
    }

    setTargetAudience(prev => {
      // Remove 'All Members' when selecting a specific tag
      const filtered = prev.filter(t => t !== 'All Members');
      if (filtered.includes(tag)) {
        const next = filtered.filter(t => t !== tag);
        return next.length === 0 ? ['All Members'] : next;
      } else {
        return [...filtered, tag];
      }
    });
  };

  const handleSave = async (status = 'Published') => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      message: message.trim(),
      imageUrl: imageUrl.trim(),
      targetAudience,
      publishDate: publishDate ? new Date(publishDate).toISOString() : null,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      pushNotification,
      status: status, // 'Draft' or 'Published'
      author: userProfile?.name || 'Admin',
      churchId: userProfile?.churchId || null,
      updatedAt: serverTimestamp()
    };

    // Push notification tracking
    if (announcement?.id) {
      if (resendPush) {
        payload.notificationSent = false;
      }
      await updateDoc(doc(db, 'announcements', announcement.id), payload);
    } else {
      payload.createdAt = serverTimestamp();
      payload.notificationSent = false;
      await addDoc(collection(db, 'announcements'), payload);
    }

    try {
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const alreadySent = Boolean(announcement?.notificationSent);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={announcement ? 'Edit Announcement' : 'Create Announcement'}
      subtitle="Broadcast notifications and notices to your congregation"
      icon={Megaphone}
      maxWidth="2xl"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving} 
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSave('Draft')} 
            disabled={saving} 
            className="px-5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 disabled:opacity-50"
          >
            Save Draft
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSave('Published')} 
            disabled={saving} 
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}
        
        {/* Section 1: Message Content */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Megaphone size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Announcement Details
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Main content, notice text, and optional media</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              placeholder="e.g. Sunday Worship Schedule Update"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows="4"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
              placeholder="Write your announcement message here..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cover Image URL (Optional)
            </label>
            <input 
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              placeholder="https://example.com/banner.jpg"
            />
          </div>
        </div>

        {/* Section 2: Target Audience */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <Users size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Target Audience
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Select groups who should receive this announcement</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2C4A60] bg-[#EBF2F7] px-2.5 py-1 rounded-full border border-[#D5E3EC]">
              {targetAudience.includes('All Members') ? 'Broadcast to Everyone' : `${targetAudience.length} selected`}
            </span>
          </div>

          {/* Core Member & Leader Groups */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Users size={13} className="text-[#2C4A60]" /> Congregation Segments
            </p>
            <div className="flex flex-wrap gap-2">
              {CORE_AUDIENCE_OPTIONS.map(aud => {
                const isSelected = targetAudience.includes(aud);
                return (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => toggleAudience(aud)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#162533] text-white border-[#162533] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {aud}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Church Ministries */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Shield size={13} className="text-[#2C4A60]" /> Church Ministries
            </p>
            {loadingMinistries ? (
              <div className="text-xs text-slate-400 py-2 italic">Loading church ministries...</div>
            ) : ministries.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">No ministries configured yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ministries.map(min => {
                  const isSelected = targetAudience.includes(min.name);
                  return (
                    <button
                      key={min.id}
                      type="button"
                      onClick={() => toggleAudience(min.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#2C4A60] text-white border-[#2C4A60] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {min.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Scheduling */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Calendar size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Schedule & Visibility
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Automatic publishing and expiration windows</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Publish Date & Time</label>
              <input 
                type="datetime-local"
                value={publishDate}
                onChange={e => setPublishDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave blank to publish immediately</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Expiry Date & Time</label>
              <input 
                type="datetime-local"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Hides automatically after this date</p>
            </div>
          </div>
        </div>

        {/* Section 4: Push Notification Delivery */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="pushNotification"
                type="checkbox"
                checked={pushNotification}
                onChange={e => setPushNotification(e.target.checked)}
                className="w-4 h-4 text-[#2C4A60] bg-white border-slate-300 rounded focus:ring-[#2C4A60] focus:ring-2"
              />
            </div>
            <div className="ml-3 text-xs sm:text-sm">
              <label htmlFor="pushNotification" className="font-bold text-slate-900 flex items-center cursor-pointer">
                <Smartphone size={15} className="mr-1.5 text-[#2C4A60]" /> Send Push Notification
              </label>
              <p className="text-slate-500 text-xs mt-0.5">
                When published, targeted members will receive an immediate mobile alert and in-app banner.
              </p>
            </div>
          </div>

          {/* If notification was already sent on an existing post */}
          {announcement?.id && alreadySent && (
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                Push notification was previously delivered
              </span>
              <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-[#2C4A60] hover:text-[#162533]">
                <input 
                  type="checkbox"
                  checked={resendPush}
                  onChange={e => setResendPush(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#2C4A60] rounded border-slate-300"
                />
                <RefreshCw size={12} className={resendPush ? 'animate-spin' : ''} />
                <span>Resend push to audience</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
