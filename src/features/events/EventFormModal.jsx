import React, { useState, useEffect } from 'react';
import { Calendar, Bell } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import ModernTimePicker from '../../components/ui/ModernTimePicker';
import Modal from '../../components/ui/Modal';

const EVENT_CATEGORIES = [
  'Weekly Service', 'Discipleship', 'Youth Fellowship', 
  'Church Anniversary', 'VBS', 'Outreach', 
  'Visitation', 'Leadership Meeting'
];

const EVENT_CATEGORY_OPTIONS = EVENT_CATEGORIES.map(cat => ({ value: cat, label: cat }));

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const REMINDER_OPTIONS = [
  { value: 15, label: '15 mins before' },
  { value: 30, label: '30 mins before (Default)' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 0, label: 'No reminder' },
];

export default function EventFormModal({ isOpen, onClose, event = null }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    category: EVENT_CATEGORIES[0],
    status: 'draft',
    reminderMinutesBefore: 30,
    enableRSVP: false,
    enableVolunteer: false,
    enableAttendance: false,
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        location: event.location || '',
        category: event.category || EVENT_CATEGORIES[0],
        status: (event.status || 'draft').toLowerCase(),
        reminderMinutesBefore: event.reminderMinutesBefore !== undefined ? Number(event.reminderMinutesBefore) : 30,
        enableRSVP: event.enableRSVP || false,
        enableVolunteer: event.enableVolunteer || false,
        enableAttendance: event.enableAttendance || false,
        imageUrl: event.imageUrl || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        category: EVENT_CATEGORIES[0],
        status: 'draft',
        reminderMinutesBefore: 30,
        enableRSVP: false,
        enableVolunteer: false,
        enableAttendance: false,
        imageUrl: ''
      });
    }
    setError('');
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let startTimestamp = null;
      if (formData.date && formData.startTime) {
        const d = new Date(formData.date);
        const timeStr = String(formData.startTime).trim();
        const timeMatch12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        const timeMatch24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        
        if (timeMatch12) {
          let hours = parseInt(timeMatch12[1], 10);
          const mins = parseInt(timeMatch12[2], 10);
          const isPM = timeMatch12[3].toUpperCase() === 'PM';
          if (isPM && hours < 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          d.setHours(hours, mins, 0, 0);
          startTimestamp = d;
        } else if (timeMatch24) {
          const hours = parseInt(timeMatch24[1], 10);
          const mins = parseInt(timeMatch24[2], 10);
          d.setHours(hours, mins, 0, 0);
          startTimestamp = d;
        }
      }

      if (event) {
        // Update existing
        const scheduleChanged = event.date !== formData.date || event.startTime !== formData.startTime;
        const docRef = doc(db, 'events', event.id);
        await updateDoc(docRef, {
          ...formData,
          reminderMinutesBefore: Number(formData.reminderMinutesBefore),
          ...(startTimestamp && { startTimestamp }),
          ...(scheduleChanged && { notificationSent: false }),
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new
        await addDoc(collection(db, 'events'), {
          ...formData,
          reminderMinutesBefore: Number(formData.reminderMinutesBefore),
          notificationSent: false,
          ...(startTimestamp && { startTimestamp }),
          createdAt: serverTimestamp(),
          churchId: userProfile?.churchId 
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save event data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Edit Event' : 'Create Event'}
      subtitle="Configure church service, fellowship, or ministry event"
      icon={Calendar}
      maxWidth="2xl"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="event-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Event'}
          </button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Event Title *</label>
            <input 
              type="text" 
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Sunday Worship Service"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all bg-white text-slate-900 placeholder:text-slate-400" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Description</label>
            <textarea 
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Event details, theme, speaker, or agenda..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all bg-white text-slate-900 placeholder:text-slate-400 resize-none" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Date</label>
            <ModernDatePicker 
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Start Time</label>
            <ModernTimePicker 
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">End Time</label>
            <ModernTimePicker 
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Location</label>
            <input 
              type="text" 
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Main Sanctuary / Online via Zoom"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all bg-white text-slate-900 placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Image URL (Optional)</label>
            <input 
              type="url" 
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/banner.jpg"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all bg-white text-slate-900 placeholder:text-slate-400" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Event Category</label>
            <ModernDropdown
              value={formData.category}
              onChange={(val) => handleChange({ target: { name: 'category', value: val } })}
              options={EVENT_CATEGORY_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Status</label>
            <ModernDropdown
              value={formData.status}
              onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
              options={STATUS_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Bell size={13} className="text-[#2C4A60]" />
              Push Reminder
            </label>
            <ModernDropdown
              value={formData.reminderMinutesBefore}
              onChange={(val) => handleChange({ target: { name: 'reminderMinutesBefore', value: Number(val) } })}
              options={REMINDER_OPTIONS}
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
            Event Features & Modules
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white cursor-pointer transition-colors shadow-2xs">
              <input 
                type="checkbox" 
                name="enableRSVP" 
                checked={formData.enableRSVP} 
                onChange={handleChange} 
                className="w-4 h-4 rounded accent-[#2C4A60]" 
              />
              <span className="text-xs font-bold text-slate-800">Enable RSVP</span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white cursor-pointer transition-colors shadow-2xs">
              <input 
                type="checkbox" 
                name="enableVolunteer" 
                checked={formData.enableVolunteer} 
                onChange={handleChange} 
                className="w-4 h-4 rounded accent-[#2C4A60]" 
              />
              <span className="text-xs font-bold text-slate-800">Volunteer Signup</span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white cursor-pointer transition-colors shadow-2xs">
              <input 
                type="checkbox" 
                name="enableAttendance" 
                checked={formData.enableAttendance} 
                onChange={handleChange} 
                className="w-4 h-4 rounded accent-[#2C4A60]" 
              />
              <span className="text-xs font-bold text-slate-800">Track Attendance</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
