import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, AlertCircle, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_TEMPLATES, checkExistingEvents, generatePreview, saveGeneratedEvents } from './eventGeneratorService';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GenerateMonthlyEventsModal({ isOpen, onClose }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [step, setStep] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [previewEvents, setPreviewEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Draft');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPreviewEvents([]);
      setError('');
      setLoading(false);
      setStatus('Draft');
      // Reset month/year to next month by default
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setSelectedMonth(nextMonth.getMonth());
      setSelectedYear(nextMonth.getFullYear());
      // Reset templates selection
      setTemplates(DEFAULT_TEMPLATES.map(t => ({ ...t, isSelected: true })));
    }
  }, [isOpen]);

  const toggleTemplate = (id) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, isSelected: !t.isSelected } : t));
  };

  const handleTemplateChange = (id, field, value) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handlePreview = async () => {
    const selectedTemps = templates.filter(t => t.isSelected);
    if (selectedTemps.length === 0) {
      setError('Please select at least one template.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const existingEvents = await checkExistingEvents(CHURCH_ID, selectedYear, selectedMonth);
      const generated = generatePreview(selectedYear, selectedMonth, selectedTemps, existingEvents);
      
      if (generated.length === 0) {
        setError('No events generated for the selected month/templates.');
      } else {
        setPreviewEvents(generated);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate preview.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventSelection = (previewId) => {
    setPreviewEvents(previewEvents.map(e => 
      e._previewId === previewId ? { ...e, selected: !e.selected } : e
    ));
  };
  
  const toggleAllEvents = (select) => {
    setPreviewEvents(previewEvents.map(e => ({ ...e, selected: select })));
  };

  const handleGenerate = async () => {
    const eventsToSave = previewEvents.filter(e => e.selected);
    if (eventsToSave.length === 0) {
      setError('Please select at least one event to generate.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const generatedMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      await saveGeneratedEvents(eventsToSave, status, CHURCH_ID, generatedMonth);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save events.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = previewEvents.filter(e => e.selected).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Monthly Events"
      subtitle="Automatically create recurring worship gatherings and services for a specific month"
      icon={CalendarIcon}
      maxWidth="3xl"
      badge={
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]">
          Step {step} of 2
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
              >
                <span>{loading ? 'Processing...' : 'Preview Events'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || selectedCount === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
              >
                <span>{loading ? 'Saving...' : `Generate ${selectedCount} Events`}</span>
                <Check size={14} />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center border border-red-200/70">
            <AlertCircle size={15} className="mr-2 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Select Month</label>
                  <ModernDropdown
                    value={selectedMonth}
                    onChange={(val) => setSelectedMonth(Number(val))}
                    options={MONTHS.map((m, i) => ({ value: i, label: m }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Select Year</label>
                  <ModernDropdown
                    value={selectedYear}
                    onChange={(val) => setSelectedYear(Number(val))}
                    options={[
                      { value: selectedYear, label: String(selectedYear) },
                      { value: selectedYear + 1, label: String(selectedYear + 1) }
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                  <CalendarIcon size={14} />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recurring Gathering Templates</h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      template.isSelected
                        ? 'border-[#2C4A60] bg-[#EBF2F7]/40 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start cursor-pointer">
                      <div className="flex items-center h-5 mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={template.isSelected}
                          onChange={() => toggleTemplate(template.id)}
                          className="w-4 h-4 accent-[#2C4A60] border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 flex-1" onClick={e => e.preventDefault()}>
                        {template.isSelected ? (
                          <div className="space-y-2 pr-1">
                            <input 
                              type="text" 
                              value={template.title}
                              onChange={(e) => handleTemplateChange(template.id, 'title', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2C4A60]"
                            />
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500" onClick={(e) => e.stopPropagation()}>
                              <span className="flex items-center font-medium">Every <span className="capitalize ml-1 font-bold text-slate-800">{template.dayOfWeek}</span></span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="time" 
                                  value={template.startTime}
                                  onChange={(e) => handleTemplateChange(template.id, 'startTime', e.target.value)}
                                  className="border border-slate-200 rounded-lg px-2 py-0.5 bg-white text-xs font-medium focus:outline-none focus:border-[#2C4A60]"
                                />
                                <span>-</span>
                                <input 
                                  type="time" 
                                  value={template.endTime}
                                  onChange={(e) => handleTemplateChange(template.id, 'endTime', e.target.value)}
                                  className="border border-slate-200 rounded-lg px-2 py-0.5 bg-white text-xs font-medium focus:outline-none focus:border-[#2C4A60]"
                                />
                              </div>
                              <span>•</span>
                              <input 
                                type="text" 
                                value={template.location}
                                placeholder="Location"
                                onChange={(e) => handleTemplateChange(template.id, 'location', e.target.value)}
                                className="border border-slate-200 rounded-lg px-2 py-0.5 bg-white text-xs font-medium focus:outline-none focus:border-[#2C4A60] flex-1 min-w-[120px]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-bold text-slate-800">{template.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Every <span className="capitalize font-semibold text-slate-700">{template.dayOfWeek}</span> • {template.startTime} - {template.endTime} {template.location && `• ${template.location}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preview Generated Events</h3>
                  <p className="text-[11px] text-slate-500">Select which events to write to the church calendar</p>
                </div>
                <div className="flex space-x-3 text-xs">
                  <button type="button" onClick={() => toggleAllEvents(true)} className="text-[#2C4A60] hover:underline font-bold">Select All</button>
                  <button type="button" onClick={() => toggleAllEvents(false)} className="text-slate-500 hover:underline font-semibold">Deselect All</button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {previewEvents.map((event) => (
                  <label
                    key={event._previewId}
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                      event.isDuplicate 
                        ? 'bg-amber-50/70 border-amber-200' 
                        : (event.selected ? 'bg-white border-[#2C4A60] shadow-2xs' : 'bg-slate-50/70 border-slate-200')
                    }`}
                  >
                    <div className="flex items-center h-5 mr-3">
                      <input 
                        type="checkbox" 
                        checked={event.selected}
                        onChange={() => toggleEventSelection(event._previewId)}
                        className="w-4 h-4 accent-[#2C4A60] border-slate-300 rounded cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5 font-medium">
                          <CalendarIcon size={12} className="mr-1 text-[#2C4A60]" />
                          {event.date} • {event.startTime} - {event.endTime}
                        </p>
                      </div>
                      
                      {event.isDuplicate && (
                        <div className="ml-2 flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full shrink-0">
                          <AlertCircle size={11} className="mr-1" />
                          Duplicate Exists
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Event Status After Generation
              </label>
              <div className="w-64">
                <ModernDropdown
                  value={status}
                  onChange={(val) => setStatus(val)}
                  options={[
                    { value: 'Draft', label: 'Save as Draft' },
                    { value: 'Published', label: 'Publish Immediately' }
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
