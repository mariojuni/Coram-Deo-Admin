import React, { useState, useEffect } from 'react';
import { Plus, ListMusic, Edit, Trash2, Search, Filter, Calendar, Upload, Download, Music2 } from 'lucide-react';
import { getSetlists, deleteSetlist, getSetlistItems } from './worshipService';
import { useAuth } from '../../context/AuthContext';
import SetlistFormModal from './SetlistFormModal';
import SongImportModal from './SongImportModal';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { downloadJSONFile, buildJSONExportEnvelope } from '../../utils/jsonImportExport';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import FeatureGate from '../subscription/components/FeatureGate';

export default function SetlistsList() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [setlists, setSetlists] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSetlists = async () => {
    if (!userProfile?.churchId) return;
    setLoading(true);
    try {
      const data = await getSetlists(userProfile.churchId);
      // Sort descending by created at or date if available
      data.sort((a, b) => new Date(b.serviceDate || 0) - new Date(a.serviceDate || 0));
      setSetlists(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSetlists();
  }, [userProfile?.churchId]);

  // Listen to events to get event titles
  useEffect(() => {
    if (!userProfile?.churchId) return;
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let eventsMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.churchId === userProfile.churchId || (!data.churchId && !userProfile.churchId)) {
          eventsMap[doc.id] = { id: doc.id, ...data };
        }
      });
      setEvents(eventsMap);
    });
    return () => unsubscribe();
  }, [userProfile?.churchId]);

  const handleAddClick = () => {
    setEditingSetlist(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (e, setlist) => {
    e.stopPropagation();
    setEditingSetlist(setlist);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (e, id, title) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the setlist "${title}"?`)) {
      await deleteSetlist(id);
      fetchSetlists();
    }
  };

  const handleSingleExport = async (e, setlist) => {
    e.stopPropagation();
    try {
      const items = await getSetlistItems(setlist.id);
      const fullSetlist = {
        ...setlist,
        items: items || []
      };
      const envelope = buildJSONExportEnvelope('setlist', fullSetlist);
      const safeTitle = setlist.title ? setlist.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'setlist';
      downloadJSONFile(envelope, `${safeTitle}-setlist.json`);
    } catch (err) {
      console.error(err);
      alert('Failed to export setlist: ' + err.message);
    }
  };

  const handleBulkExport = async () => {
    if (filteredSetlists.length === 0) {
      alert('No setlists available to export');
      return;
    }
    try {
      const bulkPayload = [];
      for (const sl of filteredSetlists) {
        const items = await getSetlistItems(sl.id);
        bulkPayload.push({
          ...sl,
          items: items || []
        });
      }
      const envelope = buildJSONExportEnvelope('setlists_bulk', bulkPayload);
      downloadJSONFile(envelope, `setlists-bulk-${bulkPayload.length}.json`);
    } catch (err) {
      console.error(err);
      alert('Failed to bulk export setlists: ' + err.message);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/admin/worship/setlists/${id}`);
  };

  const parseDate = (dStr) => {
    if (!dStr) return { month: 'TBD', day: '--', weekday: '' };
    const d = new Date(dStr + 'T00:00:00');
    if (isNaN(d.getTime())) return { month: 'TBD', day: '--', weekday: '' };
    return {
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      day: d.getDate(),
      weekday: d.toLocaleDateString(undefined, { weekday: 'short' })
    };
  };

  const filteredSetlists = setlists.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    events[s.eventId]?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <FeatureGate
      feature="worshipSetlists"
      featureName="Worship Setlists & Planning"
      requiredTier="growth"
      description="Plan song sequences, attach lyric sheets, and coordinate band arrangements for worship gatherings. Available on Growth Ministry and Kingdom Network tiers."
    >
      <div className="space-y-6 flex flex-col h-full">
      {/* Header aligned to CoramDeo Design System */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Order of Worship
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Worship Setlists</h1>
          <p className="text-sm text-church-slate mt-1">Manage setlists for upcoming worship services, rehearsals, and team arrangements.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button 
            onClick={handleBulkExport}
            disabled={filteredSetlists.length === 0}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-church-charcoal rounded-full shadow-sm text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={15} className="mr-1.5 text-church-muted" />
            Export JSON
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-church-charcoal rounded-full shadow-sm text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            <Upload size={15} className="mr-1.5 text-church-violet" />
            Import JSON
          </button>
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Create Setlist
          </GradientButton>
        </div>
      </div>

      {/* Search Input Bar */}
      <SoftCard className="p-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-church-muted" />
          <input 
            type="text" 
            placeholder="Search setlists by name, event title, or date..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-full text-sm text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/20 focus:border-church-rose transition-all"
          />
        </div>
      </SoftCard>

      {/* Content Area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
            <p className="text-sm font-medium text-church-slate">Loading worship setlists...</p>
          </div>
        </div>
      ) : filteredSetlists.length === 0 ? (
        <SoftCard className="p-12 flex flex-col items-center justify-center text-center flex-1 my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 border border-rose-100/60 shadow-sm">
            <ListMusic size={30} />
          </div>
          <h3 className="text-xl font-black text-church-charcoal mb-1">No setlists found</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">Plan an order of worship and link songs to an upcoming church service or gathering.</p>
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Create First Setlist
          </GradientButton>
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredSetlists.map((setlist) => {
            const relatedEvent = events[setlist.eventId];
            const { month, day, weekday } = parseDate(setlist.serviceDate);
            
            return (
              <SoftCard 
                key={setlist.id} 
                hover
                onClick={() => handleRowClick(setlist.id)}
                className="p-5 flex items-center relative group"
              >
                {/* Left Date Column matching CoramDeo Mobile Design */}
                <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0 text-center">
                  <span className="text-[10px] font-bold text-church-rose uppercase tracking-wider">
                    {month}
                  </span>
                  <span className="text-2xl font-black text-church-charcoal leading-none my-0.5">
                    {day}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    {weekday}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="h-11 w-[1px] bg-gray-100 mx-3 sm:mx-4 shrink-0" />
                
                {/* Details */}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-black text-church-charcoal group-hover:text-church-rose transition-colors truncate">
                      {setlist.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {relatedEvent ? (
                      <StatusPill variant="violet" icon={Calendar} className="text-[11px] py-0.5">
                        {relatedEvent.title}
                      </StatusPill>
                    ) : (
                      <StatusPill variant="slate" className="text-[11px] py-0.5">
                        Standalone Setlist
                      </StatusPill>
                    )}

                    {setlist.status === 'published' ? (
                      <StatusPill variant="emerald" dot className="text-[11px] py-0.5">Published</StatusPill>
                    ) : setlist.status === 'archived' ? (
                      <StatusPill variant="slate" className="text-[11px] py-0.5">Archived</StatusPill>
                    ) : (
                      <StatusPill variant="amber" dot className="text-[11px] py-0.5">Draft</StatusPill>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0">
                  <button 
                    onClick={(e) => handleSingleExport(e, setlist)}
                    className="p-2 text-church-slate hover:text-church-rose hover:bg-rose-50 rounded-full transition-colors"
                    title="Export JSON"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleEditClick(e, setlist)} 
                    className="p-2 text-church-slate hover:text-church-charcoal hover:bg-gray-100 rounded-full transition-colors" 
                    title="Edit Setlist"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(e, setlist.id, setlist.title)} 
                    className="p-2 text-church-slate hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" 
                    title="Delete Setlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <SetlistFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          setlist={editingSetlist}
          events={events}
          onSaved={fetchSetlists}
        />
      )}

      <SongImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        churchId={userProfile?.churchId}
        onImportSuccess={fetchSetlists}
      />
      </div>
    </FeatureGate>
  );
}
