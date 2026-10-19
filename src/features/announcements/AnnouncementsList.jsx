import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Megaphone, Plus, MoreVertical, Edit, Trash2, Clock, Calendar, CheckCircle, Smartphone } from 'lucide-react';
import AnnouncementFormModal from './AnnouncementFormModal';
import { useAuth } from '../../context/AuthContext';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function AnnouncementsList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Active'); // Active, Scheduled, Drafts, Expired
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    const q = query(
      collection(db, 'announcements'),
      where('churchId', '==', CHURCH_ID)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAnnouncements(docs);
      setLoading(false);
    }, (err) => {
      console.error("Announcements fetch error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete announcement.");
      }
    }
  };

  const openEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  // Filter logic based on timestamps and status
  const now = new Date();
  
  const filteredAnnouncements = announcements.filter(a => {
    if (a.status === 'Draft') return activeTab === 'Drafts';
    
    const publishDate = a.publishDate ? new Date(a.publishDate) : new Date(0);
    const expiryDate = a.expiryDate ? new Date(a.expiryDate) : new Date(8640000000000000); // Max date if no expiry
    
    const isScheduled = publishDate > now;
    const isExpired = expiryDate < now;
    const isActive = publishDate <= now && expiryDate >= now;

    if (activeTab === 'Scheduled') return isScheduled;
    if (activeTab === 'Expired') return isExpired;
    if (activeTab === 'Active') return isActive;
    
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header aligned to CoramDeo Design System */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Church Communications & News
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Announcements</h1>
          <p className="text-sm text-church-slate mt-1">Broadcast updates, push notifications, and timely bulletins for the congregation.</p>
        </div>
        <GradientButton 
          onClick={openCreate}
          icon={Plus}
        >
          Create Post
        </GradientButton>
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 space-x-6 overflow-x-auto">
          {['Active', 'Scheduled', 'Drafts', 'Expired'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-church-rose text-church-rose' 
                  : 'border-transparent text-church-slate hover:text-church-charcoal'
              }`}
            >
              {tab}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === tab ? 'bg-rose-50 text-church-rose border border-rose-100' : 'bg-gray-100 text-church-slate'}`}>
                {tab === 'Active' ? announcements.filter(a => a.status === 'Published' && (!a.publishDate || new Date(a.publishDate) <= now) && (!a.expiryDate || new Date(a.expiryDate) >= now)).length :
                 tab === 'Scheduled' ? announcements.filter(a => a.status === 'Published' && a.publishDate && new Date(a.publishDate) > now).length :
                 tab === 'Drafts' ? announcements.filter(a => a.status === 'Draft').length :
                 announcements.filter(a => a.status === 'Published' && a.expiryDate && new Date(a.expiryDate) < now).length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
                <p className="text-sm font-medium text-church-slate">Loading announcements...</p>
              </div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <SoftCard className="p-16 text-center my-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 mx-auto border border-rose-100/60 shadow-sm">
                <Megaphone size={30} />
              </div>
              <p className="text-church-charcoal font-black text-lg">No {activeTab.toLowerCase()} announcements</p>
              <p className="text-church-slate text-sm mt-1 mb-6">Create a new post to engage and inform your church community.</p>
              <GradientButton 
                onClick={openCreate}
                icon={Plus}
              >
                Create Post
              </GradientButton>
            </SoftCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map(post => (
                <SoftCard 
                  key={post.id} 
                  hover
                  className="p-6 flex flex-col relative group"
                >
                  {/* Action Menu */}
                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                      className="text-church-slate hover:text-church-charcoal p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenuId === post.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-church-elevated border border-gray-100 z-20 py-1 overflow-hidden">
                          <button 
                            onClick={() => { setActiveMenuId(null); openEdit(post); }}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-church-charcoal hover:bg-gray-50"
                          >
                            <Edit size={14} className="mr-2 text-church-muted" /> Edit
                          </button>
                          <button 
                            onClick={() => { setActiveMenuId(null); handleDelete(post.id); }}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4 pr-8">
                    {post.notificationSent ? (
                      <StatusPill variant="green" icon={Smartphone} className="text-[11px] py-0.5 font-bold">
                        Push Delivered
                      </StatusPill>
                    ) : post.pushNotification ? (
                      <StatusPill variant="violet" icon={Smartphone} className="text-[11px] py-0.5">
                        Push Enabled
                      </StatusPill>
                    ) : null}
                    {post.targetAudience?.map(aud => (
                      <StatusPill key={aud} variant="slate" className="text-[11px] py-0.5">
                        {aud}
                      </StatusPill>
                    ))}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-church-charcoal group-hover:text-church-rose transition-colors mb-2 line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-church-slate line-clamp-3 mb-6 flex-1 leading-relaxed">
                    {post.message}
                  </p>

                  <div className="pt-4 border-t border-gray-100 text-xs text-church-slate space-y-1.5 mt-auto">
                    {post.publishDate && (
                      <div className="flex items-center text-xs">
                        <Calendar size={13} className="mr-1.5 text-church-muted shrink-0" /> 
                        <span className="text-church-muted mr-1 font-medium">{activeTab === 'Scheduled' ? 'Publishes:' : 'Published:'}</span>
                        <span className="font-semibold text-church-charcoal">
                          {new Date(post.publishDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {post.expiryDate && (
                      <div className="flex items-center text-xs">
                        <Clock size={13} className="mr-1.5 text-church-muted shrink-0" /> 
                        <span className="text-church-muted mr-1 font-medium">Expires:</span>
                        <span className="font-semibold text-church-charcoal">
                          {new Date(post.expiryDate).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </SoftCard>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnnouncementFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        announcement={editingAnnouncement}
      />
    </div>
  );
}

