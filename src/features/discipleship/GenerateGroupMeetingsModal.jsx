import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { previewWeeklyGroupMeetings, saveGroupMeetingEvents } from './discipleshipGroupService';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-church-navy/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-church-green/10 text-church-green flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-church-navy">Generate Weekly Meetings</h2>
              <p className="text-xs text-gray-500">{group.name} ({group.meetingDay}s at {group.meetingTime})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Month/Year selector */}
        <div className="grid grid-cols-2 gap-3 my-4 shrink-0">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-church-navy focus:outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-church-navy focus:outline-none"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Meeting Previews List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {loadingPreview ? (
            <div className="text-center py-8 text-xs text-gray-400 font-medium flex items-center justify-center space-x-2">
              <RefreshCw size={14} className="animate-spin text-church-green" />
              <span>Calculating meeting dates...</span>
            </div>
          ) : previews.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 font-medium">
              No dates match {group.meetingDay} in {MONTH_NAMES[selectedMonth]} {selectedYear}.
            </div>
          ) : (
            previews.map((item) => (
              <div
                key={item._previewId}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                  item.isDuplicate
                    ? 'bg-amber-50/50 border-amber-200 opacity-80 cursor-not-allowed'
                    : item.selected
                    ? 'border-church-green bg-church-green/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center space-x-2 mb-1">
                    {!item.isDuplicate ? (
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handlePreviewChange(item._previewId, 'title', e.target.value)}
                        className="text-sm font-bold text-church-navy border-b border-dashed border-gray-300 focus:outline-none focus:border-solid focus:border-church-green bg-transparent w-full"
                      />
                    ) : (
                      <p className="text-sm font-bold text-church-navy">{item.title}</p>
                    )}
                    {item.isDuplicate && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 shrink-0">
                        <AlertTriangle size={10} />
                        <span>Already Generated</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center flex-wrap">
                    <span className="mr-1 mt-1">Date: <strong className="text-church-navy">{item.date}</strong> at {item.startTime} | Location:</span>
                    {!item.isDuplicate ? (
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => handlePreviewChange(item._previewId, 'location', e.target.value)}
                        className="mt-1 border-b border-dashed border-gray-300 focus:outline-none focus:border-solid focus:border-church-green bg-transparent flex-1 min-w-[150px]"
                      />
                    ) : (
                      <span className="mt-1">{item.location}</span>
                    )}
                  </div>
                </div>

                {!item.isDuplicate && (
                  <div 
                    onClick={() => toggleSelect(item._previewId)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-1 ${
                      item.selected ? 'bg-church-green text-white' : 'border border-gray-300 hover:border-church-green'
                    }`}>
                    {item.selected && <Check size={14} />}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || previews.filter(p => p.selected && !p.isDuplicate).length === 0}
            className="px-5 py-2 bg-church-green text-white text-xs font-bold rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90 disabled:opacity-50"
          >
            {generating ? 'Generating...' : `Generate ${previews.filter(p => p.selected && !p.isDuplicate).length} Meetings`}
          </button>
        </div>
      </div>
    </div>
  );
}
