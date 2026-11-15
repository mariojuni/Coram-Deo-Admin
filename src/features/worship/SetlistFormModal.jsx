import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { createSetlist, updateSetlist } from './worshipService';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

export default function SetlistFormModal({ isOpen, onClose, setlist, events, onSaved }) {
  const { userProfile, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    eventId: '',
    serviceDate: '',
    status: 'draft'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (setlist) {
      setFormData({
        title: setlist.title || '',
        eventId: setlist.eventId || '',
        serviceDate: setlist.serviceDate || '',
        status: setlist.status || 'draft'
      });
    } else {
      setFormData({
        title: '',
        eventId: '',
        serviceDate: '',
        status: 'draft'
      });
    }
  }, [setlist, isOpen]);

  // When eventId changes, automatically sync serviceDate and title if blank
  useEffect(() => {
    if (formData.eventId && events[formData.eventId]) {
      const selectedEvent = events[formData.eventId];
      setFormData(prev => ({
        ...prev,
        serviceDate: selectedEvent.date || prev.serviceDate,
        title: prev.title ? prev.title : `Worship Setlist - ${selectedEvent.title}`
      }));
    }
  }, [formData.eventId, events]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.eventId) return;
    
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        churchId: userProfile?.churchId || null,
        createdBy: currentUser?.uid || null
      };
      
      if (setlist) {
        await updateSetlist(setlist.id, dataToSave);
      } else {
        await createSetlist(dataToSave);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save setlist');
    }
    setSaving(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={setlist ? 'Edit Worship Setlist' : 'Create Worship Setlist'}
      subtitle="Link service order of songs to a church calendar event"
      icon={Music}
      maxWidth="md"
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
            type="submit" 
            form="setlist-form"
            disabled={saving}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (setlist ? 'Save Changes' : 'Create Setlist')}
          </button>
        </>
      }
    >
      <form id="setlist-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Linked Church Event *</label>
            <ModernDropdown
              value={formData.eventId}
              onChange={(val) => handleChange({ target: { name: 'eventId', value: val } })}
              options={[
                { value: '', label: '-- Select an Event --' },
                ...Object.values(events || {})
                  .sort((a, b) => {
                    const now = new Date();
                    const dateA = a.date ? new Date(a.date + 'T00:00:00') : null;
                    const dateB = b.date ? new Date(b.date + 'T00:00:00') : null;
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    const diffA = Math.abs(dateA.getTime() - now.getTime());
                    const diffB = Math.abs(dateB.getTime() - now.getTime());
                    return diffA - diffB;
                  })
                  .map(event => ({ value: event.id, label: `${event.date} | ${event.title}` }))
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Setlist Title *</label>
            <input 
              type="text" 
              name="title" 
              required 
              value={formData.title} 
              onChange={handleChange}
              placeholder="e.g. Sunday Worship - Holy Spirit Sunday"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Publish Status</label>
            <ModernDropdown
              value={formData.status}
              onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
              options={[
                { value: 'draft', label: 'Draft (Private)' },
                { value: 'published', label: 'Published (Visible to Team)' },
                { value: 'archived', label: 'Archived' }
              ]}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
