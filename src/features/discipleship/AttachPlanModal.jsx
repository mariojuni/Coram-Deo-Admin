import React, { useState, useEffect } from 'react';
import { BookOpen, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDiscipleshipPlans, getDiscipleshipWeeks } from './discipleshipService';
import { attachDiscipleshipPlanToGroup } from './discipleshipGroupService';
import Modal from '../../components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attach Discipleship Plan"
      subtitle={group?.name ? `Link active curriculum to ${group.name}` : 'Link curriculum to group'}
      icon={BookOpen}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="attach-plan-form"
            disabled={saving || !selectedPlanId || loading}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {saving ? 'Attaching...' : 'Attach Plan'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center border border-red-200/70">
            <AlertCircle size={15} className="mr-2 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-[#2C4A60]" />
            <p className="text-xs font-medium">Loading published plans...</p>
          </div>
        ) : (
          <form id="attach-plan-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Published Discipleship Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={handlePlanSelect}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Starting Week Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={weeks.length || 52}
                    value={currentWeekNumber}
                    onChange={handleWeekChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                  />
                </div>
              )}

              {selectedPlanId && weeks.length > 0 && (
                <div className="p-3.5 bg-[#EBF2F7]/70 border border-[#D5E3EC] rounded-xl text-xs text-[#2C4A60]">
                  <span className="font-bold">Current Lesson:</span>{' '}
                  <span className="font-medium text-slate-700">
                    {weeks.find((w) => w.weekNumber === currentWeekNumber)?.title || weeks[0]?.title}
                  </span>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
