import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, FileText, Check, Plus, Trash2, Calendar, BookOpen, Layers } from 'lucide-react';
import { collection, doc, setDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import DaySequenceBuilder from './DaySequenceBuilder';
import { parseScriptureReference } from '../../constants/bibleCanon';

// Pre-built sample for 7-day Devotional
const SAMPLE_DEVOTIONAL_DAYS = [
  {
    dayNumber: 1,
    title: "The Call to Holiness",
    items: [
      {
        id: "dev_1",
        type: "devotional",
        title: "The Call to Holiness",
        author: "R.C. Sproul",
        content: "Holiness is not an option for the Christian. It is the primary calling of God on our lives...",
        estimatedMinutes: 3
      },
      {
        id: "scr_1",
        type: "scripture",
        bookId: "1PE",
        bookName: "1 Peter",
        chapter: 1,
        endChapter: 1,
        startVerse: 15,
        endVerse: 16,
        display: "1 Peter 1:15-16",
        usfmRange: "1PE.1.15-1PE.1.16"
      }
    ]
  },
  {
    dayNumber: 6,
    title: "The Priority of Love",
    items: [
      {
        id: "dev_6",
        type: "devotional",
        title: "The Priority of Love",
        author: "R.C. Sproul",
        content: "The chief virtue of the Christian life is love. Paul tells us so in his writings to the Galatians. Love is the first fruit of the Spirit...\n\nIt's impossible to love God with all your heart and to hate your neighbor (1 John 4:20)...",
        estimatedMinutes: 4
      },
      {
        id: "scr_6_1",
        type: "scripture",
        bookId: "GAL",
        bookName: "Galatians",
        chapter: 5,
        endChapter: 5,
        startVerse: 22,
        endVerse: 23,
        display: "Mga Taga-Galacia 5:22-23",
        usfmRange: "GAL.5.22-GAL.5.23"
      },
      {
        id: "scr_6_2",
        type: "scripture",
        bookId: "MAT",
        bookName: "Matthew",
        chapter: 5,
        endChapter: 5,
        startVerse: 11,
        endVerse: 11,
        display: "Mateo 5:11",
        usfmRange: "MAT.5.11-MAT.5.11"
      },
      {
        id: "scr_6_3",
        type: "scripture",
        bookId: "1JN",
        bookName: "1 John",
        chapter: 4,
        endChapter: 4,
        startVerse: 7,
        endVerse: 7,
        display: "1 Juan 4:7",
        usfmRange: "1JN.4.7-1JN.4.7"
      }
    ]
  }
];

export default function BiblePlanFormModal({ isOpen, onClose, plan = null }) {
  const { userProfile, activeChurchId } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    coverImageUrl: '',
    description: '',
    type: 'devotional', // 'devotional' | 'bible_reading'
    durationDays: 7,
    startDate: '',
    endDate: '',
    status: 'draft',
    days: []
  });

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templateLoaded, setTemplateLoaded] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || '',
        subtitle: plan.subtitle || '',
        author: plan.author || '',
        coverImageUrl: plan.coverImageUrl || '',
        description: plan.description || '',
        type: plan.type || (plan.days?.some(d => d.items?.some(it => it.type === 'devotional')) ? 'devotional' : 'bible_reading'),
        durationDays: plan.durationDays || plan.days?.length || 7,
        startDate: plan.startDate || '',
        endDate: plan.endDate || '',
        status: plan.status || 'draft',
        days: plan.days && plan.days.length > 0 ? plan.days : (
          plan.readings ? plan.readings.map(r => ({
            dayNumber: r.day,
            title: `Day ${r.day}`,
            items: parseScriptureReference(r.passage || '')
          })) : []
        )
      });
      setActiveDayIndex(0);
    } else {
      // Default new 7-day plan
      const defaultDays = Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}`,
        items: []
      }));

      setFormData({
        title: '',
        subtitle: '',
        author: '',
        coverImageUrl: '',
        description: '',
        type: 'devotional',
        durationDays: 7,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'draft',
        days: defaultDays
      });
      setActiveDayIndex(0);
    }
    setError('');
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const calculateEndDate = (startStr, durationDays) => {
    if (!startStr || !durationDays) return '';
    const date = new Date(startStr);
    date.setDate(date.getDate() + parseInt(durationDays, 10) - 1);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'startDate' && updated.durationDays) {
        updated.endDate = calculateEndDate(value, updated.durationDays);
      } else if (name === 'durationDays' && updated.startDate) {
        updated.endDate = calculateEndDate(updated.startDate, value);

        // Adjust days array length if duration changes
        const num = parseInt(value, 10) || 1;
        const currentDays = [...(prev.days || [])];
        if (num > currentDays.length) {
          for (let i = currentDays.length; i < num; i++) {
            currentDays.push({
              dayNumber: i + 1,
              title: `Day ${i + 1}`,
              items: []
            });
          }
        } else if (num < currentDays.length) {
          currentDays.splice(num);
        }
        updated.days = currentDays;
      }

      return updated;
    });
  };

  const handleDayChange = (updatedDay) => {
    setFormData(prev => {
      const updatedDays = [...prev.days];
      updatedDays[activeDayIndex] = updatedDay;
      return { ...prev, days: updatedDays };
    });
  };

  const handleAddDay = () => {
    setFormData(prev => {
      const nextDayNum = prev.days.length + 1;
      const newDay = {
        dayNumber: nextDayNum,
        title: `Day ${nextDayNum}`,
        items: []
      };
      return {
        ...prev,
        durationDays: nextDayNum,
        endDate: calculateEndDate(prev.startDate, nextDayNum),
        days: [...prev.days, newDay]
      };
    });
    setActiveDayIndex(formData.days.length);
  };

  const handleRemoveDay = (idx) => {
    if (formData.days.length <= 1) return;
    setFormData(prev => {
      const remaining = prev.days.filter((_, i) => i !== idx).map((d, i) => ({
        ...d,
        dayNumber: i + 1
      }));
      return {
        ...prev,
        durationDays: remaining.length,
        days: remaining
      };
    });
    setActiveDayIndex(Math.max(0, activeDayIndex - 1));
  };

  const handleLoadSampleDevotional = () => {
    setFormData(prev => ({
      ...prev,
      title: "Growing in Holiness",
      subtitle: "A 7-Day Devotional by R.C. Sproul",
      author: "R.C. Sproul",
      description: "Discover what it means to be holy as God is holy through this 7-day devotional journey.",
      type: "devotional",
      durationDays: 7,
      days: SAMPLE_DEVOTIONAL_DAYS
    }));
    setActiveDayIndex(1); // focus Day 6 as sample
    setTemplateLoaded(true);
    setTimeout(() => setTemplateLoaded(false), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json)) {
          // Legacy format [{ day: 1, passage: "..." }]
          const converted = json.map(item => ({
            dayNumber: item.day,
            title: `Day ${item.day}`,
            items: parseScriptureReference(item.passage || '')
          }));
          setFormData(prev => ({
            ...prev,
            days: converted,
            durationDays: converted.length,
            endDate: calculateEndDate(prev.startDate, converted.length)
          }));
          alert(`Successfully loaded ${converted.length} days!`);
        } else if (json.days && Array.isArray(json.days)) {
          // New format { title, author, days: [...] }
          setFormData(prev => ({
            ...prev,
            title: json.title || prev.title,
            author: json.author || prev.author,
            type: json.type || prev.type,
            durationDays: json.days.length,
            days: json.days,
            endDate: calculateEndDate(prev.startDate, json.days.length)
          }));
          alert(`Successfully loaded ${json.days.length} structured days!`);
        } else {
          setError("Invalid JSON format.");
        }
      } catch (err) {
        setError("Error parsing JSON file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const planId = plan ? plan.id : `plan_${Date.now()}`;
      const planRef = doc(db, 'plans', planId);
      const legacyRef = doc(db, 'bible_plans', planId);

      // Lightweight daysSummary for fast catalog queries
      const daysSummary = (formData.days || []).map(d => ({
        dayNumber: d.dayNumber,
        title: d.title || `Day ${d.dayNumber}`,
        itemCount: d.items?.length || 0,
        hasDevotional: d.items?.some(it => it.type === 'devotional') || false,
        passages: d.items?.filter(it => it.type === 'scripture').map(it => it.display) || []
      }));

      // Flatten readings for legacy compatibility
      const legacyReadings = (formData.days || []).map(d => ({
        day: d.dayNumber,
        passage: d.items?.filter(it => it.type === 'scripture').map(it => it.display).join('; ') || ''
      }));

      const effectiveChurchId = (activeChurchId && activeChurchId !== 'system')
        ? activeChurchId
        : (plan?.churchId || userProfile?.churchId || null);

      const planMasterDoc = {
        id: planId,
        title: formData.title,
        subtitle: formData.subtitle || '',
        author: formData.author || '',
        coverImageUrl: formData.coverImageUrl || '',
        description: formData.description || '',
        type: formData.type || 'devotional',
        durationDays: parseInt(formData.durationDays, 10) || formData.days.length,
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        status: formData.status || 'draft',
        isFeaturedGlobal: effectiveChurchId ? false : true,
        daysSummary,
        readings: legacyReadings,
        updatedAt: serverTimestamp(),
      };

      if (effectiveChurchId) {
        planMasterDoc.churchId = effectiveChurchId;
      }

      if (!plan) {
        planMasterDoc.createdAt = serverTimestamp();
      }

      // 1. Write to Global /plans master doc
      await setDoc(planRef, planMasterDoc, { merge: true });

      // 2. Write to subcollection /plans/{planId}/days/{dayNumber}
      const batch = writeBatch(db);
      for (const day of formData.days) {
        const dayRef = doc(db, 'plans', planId, 'days', String(day.dayNumber));
        batch.set(dayRef, {
          dayNumber: day.dayNumber,
          title: day.title || `Day ${day.dayNumber}`,
          items: day.items || [],
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      await batch.commit();

      // 3. Dual-write to root /bible_plans for backwards compatibility (optional)
      try {
        await setDoc(legacyRef, planMasterDoc, { merge: true });
      } catch (legacyErr) {
        console.warn("Dual-write to legacy /bible_plans skipped:", legacyErr?.message || legacyErr);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save Plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeDay = formData.days[activeDayIndex] || { dayNumber: 1, title: 'Day 1', items: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-church-bg">
          <div>
            <h2 className="text-xl font-bold text-church-navy">
              {plan ? 'Edit Spiritual Plan' : 'Create Spiritual Growth & Devotional Plan'}
            </h2>
            <p className="text-xs text-church-slate mt-0.5">
              System Admin Global Catalog • Managed centrally for all church tenants
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        {/* Template Prompt */}
        {!plan && (
          <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center text-amber-900 text-xs font-medium">
              <FileText size={16} className="mr-2 text-amber-600 shrink-0" />
              Want to see a sample 7-day Devotional with R.C. Sproul's "The Priority of Love"?
            </div>
            <button
              type="button"
              onClick={handleLoadSampleDevotional}
              className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 flex items-center shadow-sm shrink-0"
            >
              {templateLoaded ? <><Check size={14} className="mr-1" /> Loaded!</> : 'Load Sample Devotional'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">{error}</div>}

          {/* Section 1: Plan Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-church-slate flex items-center">
              <Layers size={14} className="mr-1.5 text-church-green" />
              1. Plan Type & Overview
            </h3>

            {/* Plan Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, type: 'devotional' }))}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.type === 'devotional'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-xs text-church-navy">✍️ Devotional Plan</div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Daily meditation text + Scripture readings (e.g. R.C. Sproul, Begg)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, type: 'bible_reading' }))}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.type === 'bible_reading'
                    ? 'border-church-green bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-xs text-church-navy">📖 Pure Bible Reading Plan</div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Chronological, canonical, or seasonal scripture reading schedules
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-church-navy mb-1">Plan Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Growing in Holiness"
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-church-navy mb-1">Author / Teacher</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="e.g. R.C. Sproul, Alistair Begg"
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-church-navy mb-1">Description</label>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                placeholder="Summary or theme of this spiritual reading journey..."
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green resize-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-church-navy mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  name="durationDays"
                  value={formData.durationDays}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-church-navy mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green bg-white font-medium"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published (All Tenants)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-church-navy mb-1">Start Date</label>
                <ModernDatePicker
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-church-navy mb-1">End Date</label>
                <ModernDatePicker
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Day-by-Day Content Editor */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-church-slate flex items-center">
                  <BookOpen size={14} className="mr-1.5 text-church-green" />
                  2. Daily Content & Scripture Sequencing
                </h3>
                <p className="text-[11px] text-gray-500">
                  Select a day to edit devotional body text and scripture reading passages.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative overflow-hidden inline-block">
                  <button type="button" className="px-3 py-1 bg-church-navy text-white text-[11px] font-bold rounded-xl hover:bg-church-navy/90 shadow-sm">
                    Import JSON
                  </button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDay}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-xl hover:bg-emerald-100 flex items-center"
                >
                  <Plus size={13} className="mr-1" /> Add Day
                </button>
              </div>
            </div>

            {/* Horizontal Day Chips Selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {formData.days.map((d, idx) => (
                <button
                  key={d.dayNumber || idx}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    activeDayIndex === idx
                      ? 'bg-church-navy text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Day {d.dayNumber}
                  {d.items?.length > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeDayIndex === idx ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {d.items.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Day Content Builder */}
            <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-church-navy">
                    Editing Day {activeDay.dayNumber} of {formData.days.length}
                  </span>
                  <input
                    type="text"
                    value={activeDay.title || ''}
                    onChange={(e) => handleDayChange({ ...activeDay, title: e.target.value })}
                    placeholder="Day Title (e.g. The Priority of Love)"
                    className="px-3 py-1 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green font-semibold"
                  />
                </div>

                {formData.days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(activeDayIndex)}
                    className="text-gray-400 hover:text-red-600 text-xs flex items-center p-1"
                    title="Remove this Day"
                  >
                    <Trash2 size={14} className="mr-1" /> Remove Day
                  </button>
                )}
              </div>

              {/* Day Sequence Builder */}
              <DaySequenceBuilder
                day={activeDay}
                onChange={handleDayChange}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-xs font-bold text-church-slate hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-church-green text-white rounded-full text-xs font-bold hover:bg-church-green/90 transition-colors disabled:opacity-50 shadow-md"
            >
              {loading ? 'Saving Plan...' : 'Save & Publish Global Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
