import React, { useState, useEffect } from 'react';
import { BookOpen, Check, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveDiscipleshipWeeks } from './discipleshipService';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

export default function DiscipleshipWeekFormModal({ isOpen, onClose, planId, week = null, nextWeekNumber = 1, onSave }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [formData, setFormData] = useState({
    weekNumber: nextWeekNumber,
    chapterNumber: '',
    chapterTitle: '',
    scriptureReference: '',
    suggestedFlow: '',
    storyText: '',
    retellInstruction: '',
    retellActivity: '',
    discussionQuestions: '',
    keyTruths: '',
    applicationQuestions: '',
    additionalStudy: '',
    memoryVerse: '',
    sermonLink: '',
    estimatedDurationMinutes: 60,
    status: 'draft'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (week) {
      setFormData({
        id: week.id,
        weekNumber: week.weekNumber || nextWeekNumber,
        chapterNumber: week.chapterNumber || '',
        chapterTitle: week.chapterTitle || '',
        scriptureReference: week.scriptureReference || '',
        suggestedFlow: week.suggestedFlow || '',
        storyText: week.storyText || '',
        retellInstruction: week.retellInstruction || '',
        retellActivity: week.retellActivity || '',
        discussionQuestions: week.discussionQuestions || '',
        keyTruths: week.keyTruths || '',
        applicationQuestions: week.applicationQuestions || '',
        additionalStudy: week.additionalStudy || '',
        memoryVerse: week.memoryVerse || '',
        sermonLink: week.sermonLink || '',
        estimatedDurationMinutes: week.estimatedDurationMinutes || 60,
        status: week.status || 'published'
      });
    } else {
      setFormData({
        weekNumber: nextWeekNumber,
        chapterNumber: '',
        chapterTitle: '',
        scriptureReference: '',
        suggestedFlow: '',
        storyText: '',
        retellInstruction: '',
        retellActivity: '',
        discussionQuestions: '',
        keyTruths: '',
        applicationQuestions: '',
        additionalStudy: '',
        memoryVerse: '',
        sermonLink: '',
        estimatedDurationMinutes: 60,
        status: 'draft'
      });
    }
  }, [week, nextWeekNumber, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'weekNumber' || name === 'estimatedDurationMinutes' || name === 'chapterNumber' 
        ? Number(value) 
        : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!CHURCH_ID || !planId) {
      setError('Church ID or Plan ID is missing.');
      setLoading(false);
      return;
    }

    try {
      await saveDiscipleshipWeeks(CHURCH_ID, planId, [formData]);
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save week.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={week ? `Edit Week ${formData.weekNumber}` : `Add Week ${formData.weekNumber}`}
      subtitle="Curriculum story, scripture, discussion questions, and leader guide"
      icon={BookOpen}
      maxWidth="3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="week-form"
            disabled={loading}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Week'}
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

        <form id="week-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Overview & Timing */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <BookOpen size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lesson Parameters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Week Number *</label>
                <input
                  type="number"
                  name="weekNumber"
                  required
                  value={formData.weekNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Chapter Number</label>
                <input
                  type="number"
                  name="chapterNumber"
                  value={formData.chapterNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Duration (mins)</label>
                <input
                  type="number"
                  name="estimatedDurationMinutes"
                  value={formData.estimatedDurationMinutes}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Chapter / Lesson Title *</label>
                <input
                  type="text"
                  name="chapterTitle"
                  required
                  placeholder="e.g. Creation & The Fall"
                  value={formData.chapterTitle}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Status</label>
                <ModernDropdown
                  value={formData.status}
                  onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'hidden', label: 'Hidden' }
                  ]}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Scripture Reference *</label>
                <input
                  type="text"
                  name="scriptureReference"
                  required
                  value={formData.scriptureReference}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                  placeholder="e.g. Genesis 1:1-2:3; Romans 8:18-25"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Narrative & Retell */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <FileText size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Narrative & Story Flow</h3>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Story Text</label>
              <textarea
                name="storyText"
                rows={4}
                value={formData.storyText}
                onChange={handleChange}
                placeholder="The narrative text for the group leader to read or retell..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Suggested Flow</label>
              <textarea
                name="suggestedFlow"
                rows={3}
                value={formData.suggestedFlow}
                onChange={handleChange}
                placeholder="e.g. 1. Opening prayer, 2. Fellowship check-in, 3. Read story, 4. Retell together..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Retell Instruction</label>
                <textarea
                  name="retellInstruction"
                  rows={2}
                  value={formData.retellInstruction}
                  onChange={handleChange}
                  placeholder="Instructions for participants on how to retell..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Retell Activity</label>
                <textarea
                  name="retellActivity"
                  rows={2}
                  value={formData.retellActivity}
                  onChange={handleChange}
                  placeholder="Paired retell, drawing, or roleplay exercise..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Discussion & Application */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <Sparkles size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Discussion & Key Truths</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Discussion Questions</label>
                <textarea
                  name="discussionQuestions"
                  rows={3}
                  value={formData.discussionQuestions}
                  onChange={handleChange}
                  placeholder="1. What did you learn about God?&#10;2. What did you learn about humanity?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Key Truths</label>
                <textarea
                  name="keyTruths"
                  rows={3}
                  value={formData.keyTruths}
                  onChange={handleChange}
                  placeholder="Core doctrinal or theological takeaways..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Application Questions</label>
                <textarea
                  name="applicationQuestions"
                  rows={3}
                  value={formData.applicationQuestions}
                  onChange={handleChange}
                  placeholder="How will you apply this truth in obedience this week?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Memory Verse</label>
                <input
                  type="text"
                  name="memoryVerse"
                  value={formData.memoryVerse}
                  onChange={handleChange}
                  placeholder="e.g. Genesis 1:1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Additional Study (Optional)</label>
                <textarea
                  name="additionalStudy"
                  rows={2}
                  value={formData.additionalStudy}
                  onChange={handleChange}
                  placeholder="Optional commentary, cross references, or personal study homework..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
