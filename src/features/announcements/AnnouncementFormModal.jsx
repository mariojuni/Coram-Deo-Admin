import React, { useState, useEffect } from 'react';
import { X, Smartphone, Megaphone, Calendar, Users, Shield, RefreshCw } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

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
    if (isOpen) {
      if (announcement) {
        setTitle(announcement.title || '');
        setMessage(announcement.message || '');
        setImageUrl(announcement.imageUrl || '');
        setTargetAudience(announcement.targetAudience || ['All Members']);
        
        // Convert ISO strings to datetime-local format (YYYY-MM-DDThh:mm)
        setPublishDate(announcement.publishDate ? new Date(announcement.publishDate).toISOString().slice(0, 16) : '');
        setExpiryDate(announcement.expiryDate ? new Date(announcement.expiryDate).toISOString().slice(0, 16) : '');
        
        setPushNotification(announcement.pushNotification !== undefined ? announcement.pushNotification : true);
        setResendPush(false);
      } else {
        // Defaults for new
        setTitle('');
        setMessage('');
        setImageUrl('');
        setTargetAudience(['All Members']);
        
        // Default publish date to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setPublishDate(now.toISOString().slice(0, 16));
        
        // Default expiry to 30 days from now
        const future = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        setExpiryDate(future.toISOString().slice(0, 16));
        
        setPushNotification(true);
        setResendPush(false);
      }
      setError('');
    }
  }, [isOpen, announcement]);

  if (!isOpen) return null;

  const toggleAudience = (aud) => {
    if (aud === 'All Members') {
      setTargetAudience(['All Members']);
      return;
    }
    
    let newAud = targetAudience.filter(a => a !== 'All Members');
    if (newAud.includes(aud)) {
      newAud = newAud.filter(a => a !== aud);
    } else {
      newAud.push(aud);
    }
    
    if (newAud.length === 0) newAud = ['All Members'];
    setTargetAudience(newAud);
  };

  const handleSave = async (status) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-church-soft overflow-hidden flex flex-col my-8">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-church-navy text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-church-rose/20 flex items-center justify-center text-church-rose">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {announcement ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
              <p className="text-xs text-church-muted mt-0.5">Broadcast notifications and notices to your congregation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-church-navy mb-2">Title</label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose text-sm font-medium"
              placeholder="e.g. Sunday Worship Schedule Update"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-church-navy mb-2">Message</label>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose h-32 resize-none text-sm font-medium"
              placeholder="Write your announcement message here..."
            />
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-sm font-bold text-church-navy mb-2">Image URL (Optional)</label>
            <input 
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose text-sm"
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          {/* Target Audience Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-church-navy">
                Target Audience
              </label>
              <span className="text-xs font-semibold text-church-slate bg-gray-100 px-2 py-0.5 rounded-full">
                {targetAudience.includes('All Members') ? 'Broadcast to Everyone' : `${targetAudience.length} selected`}
              </span>
            </div>

            {/* Core Member & Leader Groups */}
            <div>
              <p className="text-xs font-semibold text-church-slate mb-2 flex items-center">
                <Users size={13} className="mr-1 text-church-rose" /> Congregation Groups
              </p>
              <div className="flex flex-wrap gap-2">
                {CORE_AUDIENCE_OPTIONS.map(aud => {
                  const isSelected = targetAudience.includes(aud);
                  return (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => toggleAudience(aud)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-church-rose text-white border-church-rose shadow-sm'
                          : 'bg-gray-50 text-church-charcoal border-gray-200 hover:bg-gray-100'
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
              <p className="text-xs font-semibold text-church-slate mb-2 flex items-center">
                <Shield size={13} className="mr-1 text-purple-600" /> Available Church Ministries
              </p>
              {loadingMinistries ? (
                <div className="text-xs text-church-muted py-2 italic">Loading church ministries...</div>
              ) : ministries.length === 0 ? (
                <div className="text-xs text-church-muted py-2">No ministries configured yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ministries.map(min => {
                    const isSelected = targetAudience.includes(min.name);
                    return (
                      <button
                        key={min.id}
                        type="button"
                        onClick={() => toggleAudience(min.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-purple-50/50 text-purple-900 border-purple-200/60 hover:bg-purple-100/50'
                        }`}
                      >
                        {min.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-church-muted">
              Select <strong>All Members</strong> to broadcast to the entire church, or tap specific groups and ministries to restrict delivery.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-church-navy mb-2">Publish Date & Time</label>
              <div className="relative">
                <input 
                  type="datetime-local"
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose text-sm font-medium"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Set to a future date to schedule</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-church-navy mb-2">Expiry Date & Time</label>
              <div className="relative">
                <input 
                  type="datetime-local"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose text-sm font-medium"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Hides automatically after this date</p>
            </div>
          </div>

          {/* Push Notification Controls */}
          <div className="border border-purple-100 rounded-2xl p-4 bg-purple-50/40 space-y-3">
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="pushNotification"
                  type="checkbox"
                  checked={pushNotification}
                  onChange={e => setPushNotification(e.target.checked)}
                  className="w-4 h-4 text-church-rose bg-white border-gray-300 rounded focus:ring-church-rose focus:ring-2"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="pushNotification" className="font-bold text-church-navy flex items-center cursor-pointer">
                  <Smartphone size={16} className="mr-1.5 text-purple-600" /> Send Push Notification
                </label>
                <p className="text-church-slate text-xs mt-0.5">
                  When published, members in the targeted audience will receive an immediate push alert and in-app notification on their iOS/Android devices.
                </p>
              </div>
            </div>

            {/* If notification was already sent on an existing post */}
            {announcement?.id && alreadySent && (
              <div className="pt-2 border-t border-purple-100/70 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-semibold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                  Push notification was previously delivered
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-purple-700 hover:text-purple-900">
                  <input 
                    type="checkbox"
                    checked={resendPush}
                    onChange={e => setResendPush(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 rounded border-gray-300"
                  />
                  <RefreshCw size={12} className={resendPush ? 'animate-spin' : ''} />
                  <span>Resend push to audience</span>
                </label>
              </div>
            )}
          </div>

        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50/50">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving} 
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-bold text-church-slate hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSave('Draft')} 
            disabled={saving} 
            className="px-5 py-2.5 bg-gray-200 text-church-navy rounded-full text-sm font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSave('Published')} 
            disabled={saving} 
            className="px-6 py-2.5 bg-church-rose text-white rounded-full text-sm font-bold hover:bg-church-rose/90 transition-colors disabled:opacity-50 shadow-md"
          >
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>

      </div>
    </div>
  );
}
