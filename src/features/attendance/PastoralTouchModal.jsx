import React, { useState } from 'react';
import { 
  X, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="glass-light-card rounded-2xl border border-white/95 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C4A60]/10 text-[#2C4A60] flex items-center justify-center font-black">
              {memberRecord.fullName?.charAt(0) || 'M'}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{memberRecord.fullName}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{memberRecord.membershipStatus || 'Member'}</span>
                <span>&bull;</span>
                <span className={memberRecord.consecutiveAbsences >= 3 ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
                  {memberRecord.consecutiveAbsences} consecutive weeks absent
                </span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={saving} 
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white/80 p-2 rounded-full border border-slate-100 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Quick Contact Bar */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
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
                Last attended: <strong>{new Date(memberRecord.lastAttendedDate).toLocaleDateString()}</strong>
              </span>
            )}
          </div>

          {/* Contact Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pastoral Care Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        ? 'border-[#2C4A60] bg-[#2C4A60] text-white shadow-sm' 
                        : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-up Care Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Follow-up Care Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CARE_STATUSES.map(st => {
                const isSelected = careStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCareStatus(st.id)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#2C4A60] bg-[#2C4A60]/10 text-[#2C4A60] ring-1 ring-[#2C4A60]'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st.label}</span>
                    {isSelected && <CheckCircle2 size={15} className="text-[#2C4A60]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pastoral Care Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Care & Shepherding Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record pastoral observations, prayer requests, family situation, or agreed next steps..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-sm bg-white/90 placeholder-slate-400"
            />
          </div>

          {/* Date & Pastoral Lead Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={touchDate}
                  onChange={(e) => setTouchDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60]"
                />
              </div>
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60]"
              />
            </div>
          </div>

          {/* Previous Touch History */}
          {memberRecord.touches && memberRecord.touches.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center">
                <Clock size={12} className="mr-1 text-slate-400" />
                Previous Pastoral Touches ({memberRecord.touches.length})
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {memberRecord.touches.slice().reverse().map(touch => (
                  <div key={touch.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span className="font-bold text-slate-700 capitalize">
                        {touch.type?.replace('_', ' ')} &bull; {touch.loggedBy}
                      </span>
                      <span>{touch.date || new Date(touch.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 italic">"{touch.notes}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#162533] text-white rounded-full text-xs font-bold hover:bg-[#1E2E3D] transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Recording Touch...' : 'Save Pastoral Touch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
