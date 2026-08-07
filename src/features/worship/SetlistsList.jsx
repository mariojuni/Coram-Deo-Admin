import React, { useState, useEffect } from 'react';
import { Plus, ListMusic, Edit, Trash2, Search, Filter, Calendar, Upload, Download } from 'lucide-react';
import { getSetlists, deleteSetlist, getSetlistItems } from './worshipService';
import { useAuth } from '../../context/AuthContext';
import SetlistFormModal from './SetlistFormModal';
import SongImportModal from './SongImportModal';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { downloadJSONFile, buildJSONExportEnvelope } from '../../utils/jsonImportExport';

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
        // Fallback or multi-tenant check
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

  const filteredSetlists = setlists.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    events[s.eventId]?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-church-navy">Worship Setlists</h1>
          <p className="text-sm text-church-slate mt-1">Manage setlists for upcoming worship services.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleBulkExport}
            disabled={filteredSetlists.length === 0}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-church-navy rounded-full shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={18} className="mr-2" />
            Export All JSON
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-church-navy rounded-full shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Upload size={18} className="mr-2 text-purple-600" />
            Import JSON
          </button>
          <button 
            onClick={handleAddClick}
            className="flex items-center px-5 py-2.5 bg-church-green text-white rounded-full shadow-md text-sm font-medium hover:bg-church-green/90 transition-opacity"
          >
            <Plus size={18} className="mr-2" />
            Create Setlist
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search setlists or events..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-church-green focus:ring-1 focus:ring-church-green"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-church-slate">Loading setlists...</p>
        </div>
      ) : filteredSetlists.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-church-soft border border-gray-100 p-12 flex flex-col items-center justify-center flex-1">
          <div className="w-20 h-20 bg-church-green/10 rounded-full flex items-center justify-center mb-6">
            <ListMusic size={32} className="text-church-green" />
          </div>
          <h3 className="text-xl font-bold text-church-navy mb-2">No setlists found</h3>
          <p className="text-church-slate text-center max-w-sm mb-6">Create a setlist and link it to an upcoming service or event.</p>
          <button 
            onClick={handleAddClick}
            className="px-6 py-3 bg-white border border-gray-300 text-church-navy rounded-full text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Create First Setlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredSetlists.map((setlist) => {
            const relatedEvent = events[setlist.eventId];
            
            return (
              <div 
                key={setlist.id} 
                onClick={() => handleRowClick(setlist.id)}
                className="bg-white rounded-2xl p-5 shadow-church-soft border border-gray-100 flex items-center relative group transition-all hover:shadow-md cursor-pointer"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-purple-50 flex flex-col items-center justify-center text-purple-600 mr-5 border border-purple-100">
                  <span className="text-xs font-semibold uppercase">
                    {setlist.serviceDate && !isNaN(new Date(setlist.serviceDate + 'T00:00:00').getTime()) ? new Date(setlist.serviceDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short' }) : 'TBD'}
                  </span>
                  <span className="text-2xl font-bold leading-none mt-0.5">
                    {setlist.serviceDate && !isNaN(new Date(setlist.serviceDate + 'T00:00:00').getTime()) ? new Date(setlist.serviceDate + 'T00:00:00').getDate() : '--'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-bold text-church-navy truncate">{setlist.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {relatedEvent ? (
                      <span className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100 truncate">
                        <Calendar size={12} className="mr-1.5 shrink-0" />
                        {relatedEvent.title}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Standalone Setlist</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                  <button 
                    onClick={(e) => handleSingleExport(e, setlist)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Export JSON"
                  >
                    <Download size={18} />
                  </button>
                  <button onClick={(e) => handleEditClick(e, setlist)} className="p-2 text-gray-400 hover:text-church-navy hover:bg-gray-100 rounded-lg transition-colors" title="Edit Setlist">
                    <Edit size={18} />
                  </button>
                  <button onClick={(e) => handleDeleteClick(e, setlist.id, setlist.title)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Setlist">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
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
  );
}
