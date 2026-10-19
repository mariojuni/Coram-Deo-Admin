import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Music, Trash2, GripVertical, AlertCircle, ListMusic, Calendar } from 'lucide-react';
import { getSetlist, getSetlistItems, getSongs, createSetlistItem, deleteSetlistItem } from './worshipService';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function SetlistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [setlist, setSetlist] = useState(null);
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [availableSongs, setAvailableSongs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [addingSong, setAddingSong] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState('');

  const fetchDetails = async () => {
    if (!userProfile?.churchId || !id) return;
    setLoading(true);
    try {
      const data = await getSetlist(id);
      if (data) {
        setSetlist(data);
        if (data.eventId) {
          const eventDoc = await getDoc(doc(db, 'events', data.eventId));
          if (eventDoc.exists()) setEvent(eventDoc.data());
        }
      }
      
      const itemsData = await getSetlistItems(id);
      setItems(itemsData);
      
      const songsData = await getSongs(userProfile.churchId);
      setAvailableSongs(songsData.filter(s => s.status === 'active'));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, [id, userProfile?.churchId]);

  const handleAddSong = async () => {
    if (!selectedSongId) return;
    
    const song = availableSongs.find(s => s.id === selectedSongId);
    if (!song) return;

    setAddingSong(true);
    try {
      const newItem = {
        churchId: userProfile.churchId,
        setlistId: id,
        songId: song.id,
        order: items.length, // simple ordering
        selectedKey: song.defaultKey || '',
        tempoBpm: song.tempoBpm || null,
        title: song.title // Denormalize title for easy display
      };
      
      await createSetlistItem(newItem);
      setSelectedSongId('');
      fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to add song to setlist');
    }
    setAddingSong(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Remove this song from the setlist?')) {
      await deleteSetlistItem(itemId);
      fetchDetails();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
          <p className="text-sm font-medium text-church-slate">Loading setlist details...</p>
        </div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <SoftCard className="p-12 text-center max-w-md mx-auto my-12">
        <p className="text-church-slate font-medium">Setlist not found.</p>
        <button 
          onClick={() => navigate('/admin/worship/setlists')}
          className="mt-4 px-4 py-2 bg-gray-100 text-church-charcoal rounded-full text-xs font-bold"
        >
          Return to Setlists
        </button>
      </SoftCard>
    );
  }

  const getStatusVariant = (st) => {
    if (st === 'published') return 'emerald';
    if (st === 'archived') return 'slate';
    return 'amber';
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/admin/worship/setlists')}
          className="p-2.5 text-church-slate hover:text-church-charcoal bg-white rounded-full shadow-church-soft border border-gray-100 hover:border-gray-200 transition-all"
          title="Back to Setlists"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight truncate">
              {setlist.title}
            </h1>
            <StatusPill variant={getStatusVariant(setlist.status)} dot className="capitalize shrink-0">
              {setlist.status || 'draft'}
            </StatusPill>
          </div>
          <p className="text-xs sm:text-sm text-church-slate mt-0.5 flex items-center gap-1.5 flex-wrap">
            {event && (
              <span className="font-semibold text-church-charcoal flex items-center gap-1">
                <Calendar size={13} className="text-church-rose" />
                {event.title}
              </span>
            )}
            {event && setlist.serviceDate && <span>•</span>}
            {setlist.serviceDate ? (
              <span>
                {new Date(setlist.serviceDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            ) : (
              <span>No service date set</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Setlist Songs */}
        <div className="lg:col-span-2 space-y-6">
          <SoftCard className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-church-charcoal flex items-center uppercase tracking-wider">
                <Music size={16} className="mr-2 text-church-rose" />
                Setlist Order
              </h2>
              <span className="text-xs font-bold text-church-slate bg-gray-100 px-2.5 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'Song' : 'Songs'}
              </span>
            </div>
            
            {items.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-3 border border-rose-100/50">
                  <ListMusic size={26} />
                </div>
                <h3 className="text-base font-black text-church-charcoal mb-1">Empty Setlist</h3>
                <p className="text-church-slate text-xs max-w-xs">Add songs from your church song library using the panel on the right.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/80">
                {items.sort((a, b) => a.order - b.order).map((item, index) => (
                  <div key={item.id} className="flex items-center p-4 hover:bg-gray-50/60 transition-colors group">
                    <div className="cursor-move p-1.5 text-gray-300 hover:text-gray-500 mr-2">
                      <GripVertical size={16} />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-50 to-violet-50 text-church-charcoal border border-rose-100/50 flex items-center justify-center font-black text-xs mr-3.5 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="text-sm sm:text-base font-bold text-church-charcoal group-hover:text-church-rose transition-colors truncate">
                        {item.title || 'Unknown Song'}
                      </h4>
                      <div className="flex items-center text-xs text-church-slate mt-1 space-x-2">
                        {item.selectedKey && (
                          <span className="font-semibold text-church-charcoal bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            Key: {item.selectedKey}
                          </span>
                        )}
                        {item.tempoBpm && (
                          <span className="text-church-muted bg-gray-100/80 px-2 py-0.5 rounded text-[11px]">
                            {item.tempoBpm} BPM
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="opacity-90 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-church-slate hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove from setlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SoftCard>
        </div>

        {/* Right Column: Add Song Panel */}
        <div className="space-y-6">
          <SoftCard className="p-6">
            <h3 className="text-base font-black text-church-charcoal mb-4 flex items-center gap-2">
              <Plus size={18} className="text-church-rose" />
              Add Song to Set
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-church-slate uppercase tracking-wider mb-2">
                  Select from Library
                </label>
                <ModernDropdown
                  value={selectedSongId}
                  onChange={(val) => setSelectedSongId(val)}
                  options={[
                    { value: '', label: '-- Choose a song --' },
                    ...availableSongs.map(song => ({
                      value: song.id,
                      label: `${song.title} ${song.artist ? `(${song.artist})` : ''}`
                    }))
                  ]}
                  searchable={availableSongs.length > 8}
                />
              </div>
              <GradientButton 
                onClick={handleAddSong}
                disabled={!selectedSongId || addingSong}
                loading={addingSong}
                icon={Plus}
                className="w-full"
              >
                Add to Setlist
              </GradientButton>
            </div>
            
            {availableSongs.length === 0 && (
              <div className="mt-4 p-3 bg-rose-50 text-church-rose text-xs rounded-xl flex items-start border border-rose-100">
                <AlertCircle size={15} className="mr-2 mt-0.5 shrink-0" />
                <p>No active songs found in your library. Add songs first in Songs & Lyrics.</p>
              </div>
            )}
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
