import React, { useState, useEffect } from 'react';
import { X, Users, MapPin, Calendar, Clock, BookOpen, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createDiscipleshipGroup, updateDiscipleshipGroup } from './discipleshipGroupService';
import { getDiscipleshipPlans, getDiscipleshipWeeks } from './discipleshipService';

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
      if (group.planId && CHURCH_ID) {
        getDiscipleshipWeeks(CHURCH_ID, group.planId).then((weeks) => {
          setPlanLessons(weeks);
        });
      }
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
      setPlanLessons([]);
    }
    setError('');
  }, [group, isOpen, CHURCH_ID]);

  if (!isOpen) return null;

  const handlePlanChange = async (e) => {
    const selectedPlanId = e.target.value;
    if (!selectedPlanId) {
      setFormData((prev) => ({
        ...prev,
        planId: '',
        planTitle: '',
        currentWeekNumber: 1,
        currentLessonId: '',
      }));
      setPlanLessons([]);
      return;
    }

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    const planTitle = selectedPlan ? selectedPlan.title : '';

    try {
      const weeks = await getDiscipleshipWeeks(CHURCH_ID, selectedPlanId);
      setPlanLessons(weeks);
      const firstWeek = weeks.find((w) => w.weekNumber === 1) || weeks[0];

      setFormData((prev) => ({
        ...prev,
        planId: selectedPlanId,
        planTitle,
        currentWeekNumber: 1,
        currentLessonId: firstWeek ? firstWeek.id : '',
      }));
    } catch (err) {
      console.warn('Failed to load plan weeks:', err);
    }
  };

  const handleWeekNumberChange = (e) => {
    const weekNum = parseInt(e.target.value, 10) || 1;
    const matchingLesson = planLessons.find((w) => w.weekNumber === weekNum) || planLessons[0];
    setFormData((prev) => ({
      ...prev,
      currentWeekNumber: weekNum,
      currentLessonId: matchingLesson ? matchingLesson.id : prev.currentLessonId,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-church-navy/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-church-green/10 text-church-green flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-church-navy">
                {group ? 'Edit Group' : 'Create New Group'}
              </h2>
              <p className="text-xs text-gray-500">Configure small group details, plan, and schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Group Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Young Adults Discipleship"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Group Type
              </label>
              <select
                name="groupType"
                value={formData.groupType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
              >
                {GROUP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Discipleship Plan Section */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center space-x-2">
              <BookOpen size={16} className="text-church-green" />
              <span className="text-xs font-bold text-church-navy uppercase tracking-wider">
                Discipleship Plan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Select Discipleship Plan
                </label>
                <select
                  value={formData.planId || ''}
                  onChange={handlePlanChange}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
                >
                  <option value="">-- No Plan Attached --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.totalWeeks || 0} Wks)
                    </option>
                  ))}
                </select>
              </div>

              {formData.planId && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Current Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={planLessons.length || 52}
                    value={formData.currentWeekNumber}
                    onChange={handleWeekNumberChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
                  />
                </div>
              )}
            </div>

            {formData.planId && planLessons.length > 0 && (
              <div className="text-[11px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="font-bold text-church-navy">Current Lesson Preview:</span>{' '}
                {planLessons.find((w) => w.weekNumber === Number(formData.currentWeekNumber))?.title ||
                  planLessons[0]?.title ||
                  'Lesson 1'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the group's purpose and activities..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Meeting Day
              </label>
              <select
                name="meetingDay"
                value={formData.meetingDay}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Meeting Time
              </label>
              <input
                type="time"
                name="meetingTime"
                value={formData.meetingTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Meeting Location
            </label>
            <input
              type="text"
              name="meetingLocation"
              value={formData.meetingLocation}
              onChange={handleChange}
              placeholder="e.g. Room 204 or Leader's Home"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green font-medium text-sm text-church-navy"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-church-navy transition-colors rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-church-green text-white font-bold text-sm rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90 transition-all flex items-center"
            >
              {saving ? 'Saving...' : (group ? 'Update Group' : 'Create Group')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
