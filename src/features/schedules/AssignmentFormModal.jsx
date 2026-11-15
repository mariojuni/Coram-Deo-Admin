import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, AlertCircle } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernTimePicker from '../../components/ui/ModernTimePicker';
import Modal from '../../components/ui/Modal';

export default function AssignmentFormModal({ isOpen, onClose, existingAssignment = null, defaultEventId = null }) {
  const { userProfile } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  
  const [selectedEvent, setSelectedEvent] = useState(defaultEventId || '');
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const [selectedMember, setSelectedMember] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  
  const [callTime, setCallTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Pending');

  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');
  const [takenRoles, setTakenRoles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (existingAssignment) {
        setSelectedEvent(existingAssignment.eventId || '');
        setSelectedMinistry(existingAssignment.ministryId || '');
        setSelectedRole(existingAssignment.roleName || '');
        setSelectedMember(existingAssignment.memberId || '');
        setCallTime(existingAssignment.callTime || '');
        setNotes(existingAssignment.notes || '');
        setStatus(existingAssignment.status || 'Pending');
      } else {
        setSelectedEvent(defaultEventId || '');
        setSelectedMinistry('');
        setSelectedRole('');
        setSelectedMember('');
        setMemberSearchTerm('');
        setCallTime('');
        setNotes('');
        setStatus('Pending');
      }
      setConflictWarning('');
    }
  }, [isOpen, existingAssignment, defaultEventId]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const eventsSnap = await getDocs(collection(db, 'events'));
        let evDocs = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        evDocs = evDocs.filter(d => d.churchId === userProfile?.churchId || (!d.churchId && !userProfile?.churchId));
        setEvents(evDocs);

        const ministriesSnap = await getDocs(collection(db, 'ministries'));
        let minDocs = ministriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        minDocs = minDocs.filter(d => d.churchId === userProfile?.churchId || (!d.churchId && !userProfile?.churchId));
        setMinistries(minDocs);

        const usersSnap = await getDocs(collection(db, 'users'));
        let userDocs = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        userDocs = userDocs.filter(d => d.churchId === userProfile?.churchId || (!d.churchId && !userProfile?.churchId));
        setAllMembers(userDocs);
      };
      fetchData();
    }
  }, [isOpen, userProfile]);

  const activeMinistry = ministries.find(m => m.id === selectedMinistry);

  useEffect(() => {
    if (!selectedEvent || !selectedMinistry) {
      setTakenRoles([]);
      return;
    }
    const checkTaken = async () => {
      const q = query(
        collection(db, 'assignments'),
        where('eventId', '==', selectedEvent),
        where('ministryId', '==', selectedMinistry)
      );
      const snap = await getDocs(q);
      const roles = [];
      snap.forEach(docSnap => {
        if (existingAssignment && docSnap.id === existingAssignment.id) return;
        const data = docSnap.data();
        if (data.roleName) roles.push(data.roleName);
      });
      setTakenRoles(roles);
    };
    checkTaken();
  }, [selectedEvent, selectedMinistry, existingAssignment]);

  useEffect(() => {
    if (!selectedEvent || !selectedMember) {
      setConflictWarning('');
      return;
    }
    const checkConflict = async () => {
      const q = query(
        collection(db, 'assignments'),
        where('eventId', '==', selectedEvent),
        where('memberId', '==', selectedMember)
      );
      const snap = await getDocs(q);
      const conflicts = [];
      snap.forEach(docSnap => {
        if (existingAssignment && docSnap.id === existingAssignment.id) return;
        conflicts.push(docSnap.data().roleName || 'a role');
      });
      if (conflicts.length > 0) {
        setConflictWarning(`Notice: This member is already serving as ${conflicts.join(', ')} for this event.`);
      } else {
        setConflictWarning('');
      }
    };
    checkConflict();
  }, [selectedEvent, selectedMember, existingAssignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !selectedMinistry || !selectedRole || !selectedMember) {
      alert('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        eventId: selectedEvent,
        ministryId: selectedMinistry,
        roleName: selectedRole,
        memberId: selectedMember,
        callTime,
        notes,
        status,
        churchId: userProfile?.churchId || null,
        updatedAt: new Date().toISOString()
      };

      if (existingAssignment) {
        await updateDoc(doc(db, 'assignments', existingAssignment.id), payload);
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'assignments'), payload);
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save assignment');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingAssignment ? 'Edit Volunteer Assignment' : 'Assign Service Role'}
      subtitle="Schedule ministry volunteers for upcoming church services and events"
      icon={Calendar}
      maxWidth="lg"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="assignment-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : existingAssignment ? 'Save Changes' : 'Confirm Assignment'}
          </button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="space-y-4">
        {conflictWarning && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs font-semibold flex items-start">
            <AlertCircle size={15} className="mr-2 mt-0.5 shrink-0 text-amber-600" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* Section 1: Event & Department */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Event *</label>
            <ModernDropdown 
              value={selectedEvent}
              onChange={(val) => setSelectedEvent(val)}
              options={events.map(ev => ({ value: ev.id, label: `${ev.title} (${ev.date || 'No date'})` }))}
              placeholder="-- Select Event --"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ministry Department *</label>
            <ModernDropdown 
              value={selectedMinistry}
              onChange={(val) => {
                setSelectedMinistry(val);
                setSelectedRole('');
                setSelectedMember('');
              }}
              options={ministries.map(m => ({ value: m.id, label: m.name }))}
              placeholder="-- Select Ministry --"
            />
            {selectedMinistry && activeMinistry && activeMinistry.type === 'worship' && activeMinistry.features?.songListEnabled && (
              <div className="mt-2.5 p-2.5 bg-purple-50/80 border border-purple-200/80 rounded-xl text-xs font-bold text-purple-900 flex items-center justify-between">
                <span>Song List Access Enabled</span>
                <span className="px-2 py-0.5 bg-purple-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Role & Member Selection */}
        {selectedMinistry && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Role *</label>
              <ModernDropdown 
                value={selectedRole}
                onChange={(val) => setSelectedRole(val)}
                options={(activeMinistry?.roles || []).filter(r => !takenRoles.includes(r)).map(r => ({ value: r, label: r }))}
                placeholder="-- Select Role --"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Member *</label>
              {(() => {
                const ministryMemberIds = (activeMinistry?.members || []).map(m => m.memberId);
                const membersToDisplay = allMembers.filter(m => ministryMemberIds.includes(m.id));
                
                if ((activeMinistry?.members || []).length === 0) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                      No members assigned to this ministry yet. Please add members to {activeMinistry?.name || 'this ministry'} in Team Roster first.
                    </div>
                  );
                }

                return (
                  <ModernDropdown 
                    value={selectedMember}
                    onChange={(val) => setSelectedMember(val)}
                    options={membersToDisplay.map(m => ({ value: m.id, label: m.displayName || m.name || 'Unknown' }))}
                    placeholder="-- Select Member --"
                    searchable={true}
                  />
                );
              })()}
            </div>
          </div>
        )}

        {/* Section 3: Time & Instructions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Call Time</label>
              <ModernTimePicker 
                name="callTime"
                value={callTime}
                onChange={e => setCallTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
              <ModernDropdown 
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Confirmed', label: 'Confirmed' },
                  { value: 'Declined', label: 'Declined' },
                  { value: 'Completed', label: 'Completed' },
                ]}
                placeholder="-- Select Status --"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Special Instructions</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows="2"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
              placeholder="e.g. Please arrive 15 minutes before call time for sound check..."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
