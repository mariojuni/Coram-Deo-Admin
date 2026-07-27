import React, { useState, useEffect } from 'react';
import { X, BookOpen, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDiscipleshipPlans, getDiscipleshipWeeks } from './discipleshipService';
import { attachDiscipleshipPlanToGroup } from './discipleshipGroupService';

export default function AttachPlanModal({ isOpen, onClose, group, onSaved }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const userId = userProfile?.uid || userProfile?.id;

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && CHURCH_ID) {
      setLoading(true);
      setError('');
      getDiscipleshipPlans(CHURCH_ID)
        .then((allPlans) => {
          const published = allPlans.filter((p) => p.status === 'published');
          setPlans(published);
          if (group?.planId) {
            setSelectedPlanId(group.planId);
            setCurrentWeekNumber(group.currentWeekNumber || 1);
            getDiscipleshipWeeks(CHURCH_ID, group.planId).then((wList) => {
              setWeeks(wList);
              const match = wList.find((w) => w.weekNumber === (group.currentWeekNumber || 1)) || wList[0];
              setSelectedLessonId(match ? match.id : '');
            });
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch published discipleship plans.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, CHURCH_ID, group]);

  if (!isOpen || !group) return null;

  const handlePlanSelect = async (e) => {
    const planId = e.target.value;
    setSelectedPlanId(planId);
    if (!planId) {
      setWeeks([]);
      setSelectedLessonId('');
      return;
    }

    try {
      const wList = await getDiscipleshipWeeks(CHURCH_ID, planId);
      setWeeks(wList);
      setCurrentWeekNumber(1);
      const firstWeek = wList.find((w) => w.weekNumber === 1) || wList[0];
      setSelectedLessonId(firstWeek ? firstWeek.id : '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleWeekChange = (e) => {
    const weekNum = parseInt(e.target.value, 10) || 1;
    setCurrentWeekNumber(weekNum);
    const match = weeks.find((w) => w.weekNumber === weekNum) || weeks[0];
    setSelectedLessonId(match ? match.id : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      setError('Please select a discipleship plan.');
      return;
    }
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) return;

    setSaving(true);
    setError('');

    try {
      await attachDiscipleshipPlanToGroup(
        CHURCH_ID,
        group.id,
        selectedPlan.id,
        selectedPlan.title,
        currentWeekNumber,
        selectedLessonId,
        userId
      );
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to attach plan to group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-church-navy/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-church-green/10 text-church-green flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-church-navy">Attach Discipleship Plan</h2>
              <p className="text-xs text-gray-500">{group.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center space-x-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400 font-medium">Loading published plans...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Published Discipleship Plan *
              </label>
              <select
                value={selectedPlanId}
                onChange={handlePlanSelect}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
                required
              >
                <option value="">-- Select Published Plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.totalWeeks || 0} Weeks)
                  </option>
                ))}
              </select>
            </div>

            {selectedPlanId && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Starting Week Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={weeks.length || 52}
                  value={currentWeekNumber}
                  onChange={handleWeekChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
                />
              </div>
            )}

            {selectedPlanId && weeks.length > 0 && (
              <div className="p-3 bg-church-green/5 border border-church-green/20 rounded-xl text-xs">
                <span className="font-bold text-church-navy">Current Lesson:</span>{' '}
                {weeks.find((w) => w.weekNumber === currentWeekNumber)?.title || weeks[0]?.title}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !selectedPlanId}
                className="px-5 py-2 bg-church-green text-white text-xs font-bold rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90"
              >
                {saving ? 'Attaching...' : 'Attach Plan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
