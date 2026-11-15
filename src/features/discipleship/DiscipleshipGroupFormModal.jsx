import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createDiscipleshipGroup, updateDiscipleshipGroup } from './discipleshipGroupService';
import { getDiscipleshipPlans, getDiscipleshipWeeks } from './discipleshipService';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernTimePicker from '../../components/ui/ModernTimePicker';
import Modal from '../../components/ui/Modal';

const GROUP_TYPES = [
  { value: 'small_group', label: 'Small Group' },
  { value: 'discipleship', label: 'Discipleship Group' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'youth_group', label: 'Youth Group' },
  { value: 'other', label: 'Other' },
];

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function DiscipleshipGroupFormModal({ isOpen, onClose, group = null, onSaved }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const userId = userProfile?.uid || userProfile?.id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    groupType: 'small_group',
    meetingDay: 'Sunday',
    meetingTime: '18:00',
    meetingLocation: '',
    status: 'active',
    planId: '',
    planTitle: '',
    currentWeekNumber: 1,
    currentLessonId: '',
  });

  const [plans, setPlans] = useState([]);
  const [planLessons, setPlanLessons] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublishedPlans = async () => {
      if (!CHURCH_ID || !isOpen) return;
      setLoadingPlans(true);
      try {
        const allPlans = await getDiscipleshipPlans(CHURCH_ID);
        const published = allPlans.filter((p) => p.status === 'published');
        setPlans(published);
      } catch (err) {
        console.warn('Failed to load published plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPublishedPlans();
  }, [CHURCH_ID, isOpen]);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        groupType: group.groupType || 'small_group',
        meetingDay: group.meetingDay || 'Sunday',
        meetingTime: group.meetingTime || '18:00',
        meetingLocation: group.meetingLocation || '',
        status: group.status || 'active',
        planId: group.planId || '',
        planTitle: group.planTitle || '',
        currentWeekNumber: group.currentWeekNumber || 1,
        currentLessonId: group.currentLessonId || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        groupType: 'small_group',
        meetingDay: 'Sunday',
        meetingTime: '18:00',
        meetingLocation: '',
        status: 'active',
        planId: '',
        planTitle: '',
        currentWeekNumber: 1,
        currentLessonId: '',
      });
    }
    setError('');
  }, [group, isOpen]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!formData.planId) {
        setPlanLessons([]);
        return;
      }
      try {
        const weeks = await getDiscipleshipWeeks(formData.planId);
        setPlanLessons(weeks);
      } catch (err) {
        console.warn('Failed to fetch plan lessons:', err);
      }
    };
    fetchLessons();
  }, [formData.planId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (planId) => {
    const selectedPlan = plans.find((p) => p.id === planId);
    setFormData((prev) => ({
      ...prev,
      planId,
      planTitle: selectedPlan ? selectedPlan.title : '',
      currentWeekNumber: 1,
      currentLessonId: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CHURCH_ID) {
      setError('Church ID is required. Please select a church.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Group name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (group?.id) {
        await updateDiscipleshipGroup(CHURCH_ID, group.id, formData, userId);
      } else {
        await createDiscipleshipGroup(CHURCH_ID, formData, userId);
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save group:', err);
      setError(err.message || 'Failed to save group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={group ? 'Edit Discipleship Group' : 'Create Discipleship Group'}
      subtitle="Configure small group meetings, curriculum track, and gathering schedule"
      icon={Users}
      maxWidth="xl"
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
            form="discipleship-group-form"
            disabled={saving}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {saving ? 'Saving...' : group ? 'Save Changes' : 'Create Group'}
          </button>
        </>
      }
    >
      <form id="discipleship-group-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Section 1: Group Basics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Users size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Group Profile
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Naming and ministry classification</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Group Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Young Professionals Discipleship"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Group Type</label>
              <ModernDropdown
                value={formData.groupType}
                onChange={(val) => handleChange({ target: { name: 'groupType', value: val } })}
                options={GROUP_TYPES}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <ModernDropdown
                value={formData.status}
                onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                options={[
                  { value: 'active', label: 'Active Group' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'archived', label: 'Archived' }
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the group's purpose and member cohort..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>
        </div>

        {/* Section 2: Curriculum & Plan Attachment */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <BookOpen size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Discipleship Curriculum
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Link a teaching plan and manage lesson progression</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Attached Plan</label>
              <ModernDropdown
                value={formData.planId}
                onChange={handlePlanChange}
                options={[
                  { value: '', label: '-- No Plan Attached --' },
                  ...plans.map(p => ({ value: p.id, label: `${p.title} (${p.totalWeeks || 0} Wks)` }))
                ]}
              />
            </div>

            {formData.planId && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Week</label>
                <input
                  type="number"
                  min="1"
                  max={planLessons.length || 52}
                  name="currentWeekNumber"
                  value={formData.currentWeekNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeekNumber: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                />
              </div>
            )}
          </div>

          {formData.planId && planLessons.length > 0 && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800">Current Lesson Preview:</span>{' '}
              {planLessons.find((w) => w.weekNumber === Number(formData.currentWeekNumber))?.title ||
                planLessons[0]?.title ||
                'Lesson 1'}
            </div>
          )}
        </div>

        {/* Section 3: Meeting Cadence & Location */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Calendar size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Meeting Cadence & Venue
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Regular gathering schedule and physical/virtual location</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Meeting Day</label>
              <ModernDropdown
                value={formData.meetingDay}
                onChange={(val) => handleChange({ target: { name: 'meetingDay', value: val } })}
                options={DAYS_OF_WEEK.map(d => ({ value: d, label: d }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Meeting Time</label>
              <input
                type="time"
                name="meetingTime"
                value={formData.meetingTime}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Meeting Location / Link</label>
            <input
              type="text"
              name="meetingLocation"
              value={formData.meetingLocation}
              onChange={handleChange}
              placeholder="e.g. Room 204 or https://zoom.us/j/..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
