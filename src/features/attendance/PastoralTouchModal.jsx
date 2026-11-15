import React, { useState } from 'react';
import { 
  Phone, 
  Home, 
  MessageSquare, 
  Mail, 
  HeartHandshake, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const CONTACT_TYPES = [
  { id: 'phone_call', label: 'Phone Call', icon: Phone },
  { id: 'home_visit', label: 'Home Visit', icon: Home },
  { id: 'text_message', label: 'Text / WhatsApp', icon: MessageSquare },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'prayer', label: 'Prayer Session', icon: HeartHandshake },
  { id: 'care_package', label: 'Care Package', icon: Package },
];

const CARE_STATUSES = [
  { id: 'needs_contact', label: 'Needs Follow-up', color: 'amber' },
  { id: 'in_conversation', label: 'In Conversation', color: 'steel' },
  { id: 'resolved', label: 'Resolved / Returning', color: 'emerald' },
  { id: 'excused', label: 'Excused (Travel / Sick)', color: 'slate' },
];

export default function PastoralTouchModal({ isOpen, onClose, memberRecord, onSaveSuccess }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;

  const [contactType, setContactType] = useState('phone_call');
  const [careStatus, setCareStatus] = useState(memberRecord?.followupStatus || 'in_conversation');
  const [notes, setNotes] = useState('');
  const [touchDate, setTouchDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState(userProfile?.displayName || userProfile?.name || 'Pastoral Care Team');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !memberRecord) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide a brief pastoral care note.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const newTouch = {
        id: `touch_${Date.now()}`,
        type: contactType,
        status: careStatus,
        notes: notes.trim(),
        date: touchDate,
        loggedBy: userProfile?.displayName || userProfile?.name || userProfile?.email || 'Pastor',
        loggedByUid: userProfile?.uid || userProfile?.id || '',
        createdAt: now
      };

      const followupRef = doc(db, 'attendance_followups', memberRecord.memberId);
      await setDoc(followupRef, {
        churchId: CHURCH_ID,
        memberId: memberRecord.memberId,
        memberName: memberRecord.fullName,
        memberEmail: memberRecord.email,
        memberPhone: memberRecord.phone,
        status: careStatus,
        consecutiveAbsences: memberRecord.consecutiveAbsences,
        lastContactDate: touchDate,
        lastContactMethod: contactType,
        assignedTo: assignedTo.trim(),
        notes: notes.trim(),
        updatedAt: now,
        touches: arrayUnion(newTouch)
      }, { merge: true });

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving pastoral care touch:", err);
      setError('Failed to record pastoral care touch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberRecord.fullName}
      subtitle={`${memberRecord.membershipStatus || 'Member'} • ${memberRecord.consecutiveAbsences} consecutive weeks absent`}
      icon={HeartHandshake}
      maxWidth="xl"
      badge={
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          memberRecord.consecutiveAbsences >= 3 
            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {memberRecord.consecutiveAbsences >= 3 ? 'High Priority Care' : 'Care Alert'}
        </span>
      }
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
            form="pastoral-touch-form"
            disabled={saving}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {saving ? 'Recording Touch...' : 'Save Pastoral Touch'}
          </button>
        </>
      }
    >
      <form id="pastoral-touch-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium flex items-center">
            <AlertCircle size={15} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        {/* Member Quick Contact Bar */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            {memberRecord.phone && (
              <a 
                href={`tel:${memberRecord.phone}`} 
                className="flex items-center text-[#2C4A60] hover:underline font-bold"
              >
                <Phone size={13} className="mr-1.5" />
                {memberRecord.phone}
              </a>
            )}
            {memberRecord.email && (
              <a 
                href={`mailto:${memberRecord.email}`} 
                className="flex items-center text-[#2C4A60] hover:underline font-bold"
              >
                <Mail size={13} className="mr-1.5" />
                {memberRecord.email}
              </a>
            )}
          </div>
          {memberRecord.lastAttendedDate && (
            <span className="text-slate-500">
              Last attended: <strong className="text-slate-700">{new Date(memberRecord.lastAttendedDate).toLocaleDateString()}</strong>
            </span>
          )}
        </div>

        {/* Contact Method Selector */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pastoral Care Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CONTACT_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = contactType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setContactType(type.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    isSelected 
                      ? 'bg-[#162533] text-white border-[#162533] shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : 'text-[#2C4A60]'} />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status & Care Notes Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Follow-up Care Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CARE_STATUSES.map(status => {
                const isSelected = careStatus === status.id;
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setCareStatus(status.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#EBF2F7] text-[#2C4A60] border-[#D5E3EC]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{status.label}</span>
                    {isSelected && <CheckCircle2 size={13} className="text-[#2C4A60]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Care Notes & Member State <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of conversation, prayer requests, life updates, or return timeline..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Date
              </label>
              <input
                type="date"
                value={touchDate}
                onChange={(e) => setTouchDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pastoral Lead / Reached By
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Pastor / Deacon name"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Previous Touch History */}
        {memberRecord.touches && memberRecord.touches.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center">
              <Clock size={12} className="mr-1 text-slate-400" />
              Previous Pastoral Touches ({memberRecord.touches.length})
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {memberRecord.touches.slice().reverse().map(touch => (
                <div key={touch.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span className="font-bold text-slate-700 capitalize">
                      {touch.type?.replace('_', ' ')} • {touch.loggedBy}
                    </span>
                    <span>{touch.date || new Date(touch.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 italic">"{touch.notes}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
