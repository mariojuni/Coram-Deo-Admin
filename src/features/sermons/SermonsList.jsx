import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { canManageSermons } from '../../utils/adminRoles';
import { Plus, BookOpen, Edit, Trash2, Calendar, User, Video, Headphones, FileText, MoreVertical, Globe, Lock } from 'lucide-react';
import SermonFormModal from './SermonFormModal';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function SermonsList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId; // Fallback
  const isManager = canManageSermons(userProfile);
  
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState(null);
  
  // Action menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    setLoading(true);
    setFetchError('');

    // Simple query by churchId only — avoids composite index requirement.
    // Sort client-side to keep things index-free.
    const q = query(
      collection(db, 'sermons'), 
      where('churchId', '==', CHURCH_ID)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          // Sort by sermonDate descending (most recent first)
          const dateA = a.sermonDate || '';
          const dateB = b.sermonDate || '';
          return dateB.localeCompare(dateA);
        });
      setSermons(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sermons:", error);
      setFetchError('Could not load sermons: ' + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingSermon(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (sermon) => {
    setEditingSermon(sermon);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteClick = async (sermon) => {
    setActiveMenuId(null);
    
    const confirmation = window.prompt(`To permanently delete this sermon and its media files, please type the title exactly:\n\n"${sermon.title}"`);
    
    if (confirmation !== sermon.title) {
      if (confirmation !== null) {
        alert("The title did not match. Deletion cancelled.");
      }
      return;
    }

    try {
      // Delete associated Storage files first
      const pathsToDelete = [
        sermon.videoStoragePath,
        sermon.audioStoragePath,
        sermon.thumbnailStoragePath,
      ].filter(Boolean);

      await Promise.allSettled(
        pathsToDelete.map(path => deleteObject(storageRef(storage, path)))
      );

      // Delete the Firestore document
      await deleteDoc(doc(db, 'sermons', sermon.id));
    } catch (error) {
      console.error('Error deleting sermon:', error);
      alert('Failed to delete sermon: ' + error.message);
    }
  };

  const toggleMenu = (id) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateObj = new Date(dateStr + 'T00:00:00'); 
    return dateObj.toLocaleDateString(undefined, options);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <StatusPill variant="emerald" dot className="text-[11px] py-0.5">Published</StatusPill>;
      case 'draft':
        return <StatusPill variant="amber" dot className="text-[11px] py-0.5">Draft</StatusPill>;
      case 'failed':
        return <StatusPill variant="rose" className="text-[11px] py-0.5">Failed</StatusPill>;
      default:
        return <StatusPill variant="slate" className="text-[11px] py-0.5 capitalize">{status}</StatusPill>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header aligned to CoramDeo Design System */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Gospel & Pulpit Word
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Sermons</h1>
          <p className="text-sm text-church-slate mt-1">Manage sermon uploads, recordings, media files, and publish status.</p>
        </div>
        {isManager && (
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Create Sermon
          </GradientButton>
        )}
      </div>
      
      {fetchError ? (
        <SoftCard className="flex-1 flex items-center justify-center p-8 my-4">
          <div className="text-center max-w-md">
            <p className="text-rose-600 font-bold mb-2">⚠️ Could not load sermons</p>
            <p className="text-xs text-church-slate">{fetchError}</p>
          </div>
        </SoftCard>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
            <p className="text-sm font-medium text-church-slate">Loading sermons...</p>
          </div>
        </div>
      ) : sermons.length === 0 ? (
        <SoftCard className="p-12 flex flex-col items-center justify-center text-center flex-1 my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 border border-rose-100/60 shadow-sm">
            <BookOpen size={30} />
          </div>
          <h3 className="text-xl font-black text-church-charcoal mb-1">No sermons yet</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">Build your content library by uploading your first sermon audio or video recording.</p>
          {isManager && (
            <GradientButton 
              onClick={handleAddClick}
              icon={Plus}
            >
              Create Sermon
            </GradientButton>
          )}
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sermons.map(sermon => (
            <SoftCard 
              key={sermon.id} 
              hover
              className="overflow-hidden flex flex-col relative group"
            >
              {/* Thumbnail / Header Area */}
              <div 
                className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center bg-cover bg-center"
                style={sermon.thumbnailUrl ? { backgroundImage: `url(${sermon.thumbnailUrl})` } : {}}
              >
                {/* Fallback Icon if no thumbnail */}
                {!sermon.thumbnailUrl && (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 via-rose-50/20 to-violet-50/30 flex items-center justify-center">
                    <BookOpen size={44} className="text-gray-300" />
                  </div>
                )}
                
                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                  {renderStatusBadge(sermon.status)}
                  <StatusPill 
                    variant="glass" 
                    icon={sermon.visibility === 'public' ? Globe : Lock}
                    className="text-[10px] py-0.5"
                  >
                    {sermon.visibility || 'private'}
                  </StatusPill>
                </div>
                
                {/* Actions Dropdown */}
                {isManager && (
                  <div className="absolute top-3 right-3">
                    <button 
                      onClick={() => toggleMenu(sermon.id)}
                      className="p-1.5 text-white hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-md shadow-sm"
                      title="Sermon Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {activeMenuId === sermon.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 top-9 w-36 bg-white rounded-xl shadow-church-elevated border border-gray-100 z-20 py-1 overflow-hidden">
                          <button 
                            onClick={() => handleEditClick(sermon)}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-church-charcoal hover:bg-gray-50"
                          >
                            <Edit size={14} className="mr-2 text-church-muted" /> Edit Details
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(sermon)}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Media Icons Over Thumbnail */}
                <div className="absolute bottom-2.5 left-3 flex items-center space-x-1.5">
                  {sermon.audioUrl && (
                    <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white" title="Audio available">
                      <Headphones size={13} />
                    </div>
                  )}
                  {sermon.videoUrl && (
                    <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white" title="Video available">
                      <Video size={13} />
                    </div>
                  )}
                  {sermon.notesUrl && (
                    <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white" title="Study notes available">
                      <FileText size={13} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-xs font-bold text-church-rose uppercase tracking-wider">
                    <Calendar size={13} className="mr-1.5 shrink-0" />
                    {formatDate(sermon.sermonDate)}
                  </div>
                  <div className="text-[11px] text-church-slate font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                    {sermon.category || 'Sunday Worship'}
                  </div>
                </div>
                
                <h3 className="text-base sm:text-lg font-black text-church-charcoal group-hover:text-church-rose transition-colors mb-1.5 line-clamp-2 leading-snug">
                  {sermon.title}
                </h3>
                
                <div className="flex items-center text-xs sm:text-sm font-semibold text-church-slate mb-2">
                  <User size={14} className="mr-1.5 text-church-muted shrink-0" />
                  {sermon.preacherName || 'Guest Speaker'}
                </div>
                
                {sermon.scriptureReference && (
                  <div className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-church-violet border border-violet-100/60 mb-2">
                    <BookOpen size={11} className="mr-1.5 shrink-0" />
                    {sermon.scriptureReference}
                  </div>
                )}
                
                {sermon.seriesTitle && (
                  <p className="text-[11px] font-bold text-church-muted uppercase tracking-wider mt-auto pt-2 border-t border-gray-100">
                    Series: {sermon.seriesTitle}
                  </p>
                )}
              </div>
            </SoftCard>
          ))}
        </div>
      )}

      <SermonFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sermon={editingSermon}
      />
    </div>
  );
}
