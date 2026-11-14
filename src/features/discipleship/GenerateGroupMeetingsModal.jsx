import React, { useState, useEffect } from 'react';
import { Calendar, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { previewWeeklyGroupMeetings, saveGroupMeetingEvents } from './discipleshipGroupService';
import Modal from '../../components/ui/Modal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GenerateGroupMeetingsModal({ isOpen, onClose, group, onGenerated }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const userId = userProfile?.uid || userProfile?.id;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const [previews, setPreviews] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && group && CHURCH_ID) {
      loadPreview();
    }
  }, [isOpen, group, selectedYear, selectedMonth, CHURCH_ID]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const data = await previewWeeklyGroupMeetings(CHURCH_ID, group.id, group, selectedYear, selectedMonth);
      setPreviews(data);
    } catch (err) {
      console.error("Failed to load meeting preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!isOpen || !group) return null;

  const toggleSelect = (previewId) => {
    setPreviews(prev => prev.map(p => {
      if (p._previewId === previewId) {
        return { ...p, selected: !p.selected };
      }
      return p;
    }));
  };

  const handlePreviewChange = (previewId, field, value) => {
    setPreviews(prev => prev.map(p => {
      if (p._previewId === previewId) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleGenerate = async () => {
    const selectedEvents = previews.filter(p => p.selected && !p.isDuplicate);
    if (selectedEvents.length === 0) {
      alert("No new meetings selected for generation.");
      return;
    }

    setGenerating(true);
    try {
      await saveGroupMeetingEvents(CHURCH_ID, selectedEvents, userId);
      onGenerated && onGenerated();
      onClose();
    } catch (err) {
      console.error("Failed to generate meetings:", err);
      alert("Error generating meetings: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Weekly Meetings"
      subtitle={`${group.name} (${group.meetingDay}s at ${group.meetingTime})`}
      icon={Calendar}
      maxWidth="xl"
      footer={
        <>
          <button 
            type="button"
            onClick={onClose} 
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || previews.filter(p => p.selected && !p.isDuplicate).length === 0}
            className="px-6 py-2.5 bg-[#162533] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:bg-[#1E2E3D] transition-all disabled:opacity-50"
          >
            {generating ? 'Generating...' : `Generate ${previews.filter(p => p.selected && !p.isDuplicate).length} Meetings`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Month/Year selector */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Meeting Previews List */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Detected Sessions ({previews.filter(p => p.selected && !p.isDuplicate).length} Selected)
          </label>

          {loadingPreview ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium flex items-center justify-center space-x-2">
              <RefreshCw size={14} className="animate-spin text-[#2C4A60]" />
              <span>Calculating meeting dates...</span>
            </div>
          ) : previews.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              No dates match {group.meetingDay} in {MONTH_NAMES[selectedMonth]} {selectedYear}.
            </div>
          ) : (
            previews.map((item) => (
              <div
                key={item._previewId}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                  item.isDuplicate
                    ? 'bg-amber-50/60 border-amber-200/80 opacity-80 cursor-not-allowed'
                    : item.selected
                    ? 'border-[#2C4A60] bg-[#2C4A60]/5 shadow-2xs'
                    : 'border-slate-200/70 bg-white/70 hover:border-slate-300'
                }`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center space-x-2 mb-1">
                    {!item.isDuplicate ? (
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handlePreviewChange(item._previewId, 'title', e.target.value)}
                        className="text-sm font-bold text-slate-900 border-b border-dashed border-slate-300 focus:outline-none focus:border-solid focus:border-[#2C4A60] bg-transparent w-full"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    )}
                    {item.isDuplicate && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 shrink-0">
                        <AlertTriangle size={10} />
                        <span>Already Generated</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center flex-wrap">
                    <span className="mr-1 mt-1">Date: <strong className="text-slate-900">{item.date}</strong> at {item.startTime} | Location:</span>
                    {!item.isDuplicate ? (
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => handlePreviewChange(item._previewId, 'location', e.target.value)}
                        className="mt-1 border-b border-dashed border-slate-300 focus:outline-none focus:border-solid focus:border-[#2C4A60] bg-transparent flex-1 min-w-[150px] text-slate-800"
                      />
                    ) : (
                      <span className="mt-1 text-slate-700">{item.location}</span>
                    )}
                  </div>
                </div>

                {!item.isDuplicate && (
                  <button
                    type="button" 
                    onClick={() => toggleSelect(item._previewId)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-1 ${
                      item.selected ? 'bg-[#2C4A60] text-white shadow-2xs' : 'border border-slate-300 hover:border-[#2C4A60] bg-white'
                    }`}
                  >
                    {item.selected && <Check size={14} />}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
