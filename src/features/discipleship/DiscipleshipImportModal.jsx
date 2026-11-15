import React, { useState } from 'react';
import { Upload, AlertCircle, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { importDiscipleshipPlanJSON } from './discipleshipService';
import { parseAndValidateJSONEnvelope } from '../../utils/jsonImportExport';
import Modal from '../../components/ui/Modal';

export default function DiscipleshipImportModal({ isOpen, onClose, onImportSuccess }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [jsonFile, setJsonFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setError('Please upload a valid JSON file.');
        return;
      }
      setJsonFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const rawString = event.target.result;
          const envelopeResult = parseAndValidateJSONEnvelope(rawString, [
            'discipleship_plan', 
            'discipleship_plans_bulk'
          ]);

          if (!envelopeResult.success) {
            setError(envelopeResult.error);
            setPreviewData(null);
            return;
          }

          let dataPayload = envelopeResult.data;
          
          // Normalize function for a single plan
          const normalizePlan = (rawPlan) => {
            let actualPlan = rawPlan.plan ? rawPlan.plan : rawPlan;

            actualPlan = Object.keys(actualPlan).reduce((acc, key) => {
              const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
              acc[normalizedKey] = actualPlan[key];
              return acc;
            }, {});

            if (Array.isArray(actualPlan.weeks)) {
              actualPlan.weeks = actualPlan.weeks.map(week => {
                if (typeof week !== 'object' || !week) return week;
                
                const weekData = { ...week };
                if (weekData.content && typeof weekData.content === 'object') {
                  Object.assign(weekData, weekData.content);
                  delete weekData.content;
                }
                if (weekData.leaderGuide && typeof weekData.leaderGuide === 'object') {
                  Object.assign(weekData, weekData.leaderGuide);
                  delete weekData.leaderGuide;
                }
                
                return Object.keys(weekData).reduce((acc, key) => {
                  const flatKey = key.replace(/[\s_-]/g, '').toLowerCase();
                  
                  const keyMap = {
                    'story': 'storyText',
                    'storytext': 'storyText',
                    'retell': 'retellActivity',
                    'retellactivity': 'retellActivity',
                    'discussion': 'discussionQuestions',
                    'discussionquestions': 'discussionQuestions',
                    'keytruths': 'keyTruths',
                    'application': 'applicationQuestions',
                    'applicationquestions': 'applicationQuestions',
                    'memoryverse': 'memoryVerse',
                    'chaptertitle': 'chapterTitle',
                    'scripturereference': 'scriptureReference',
                    'scripture': 'scriptureReference',
                    'suggestedflow': 'suggestedFlow',
                    'retellinstruction': 'retellInstruction',
                    'duration': 'estimatedDurationMinutes',
                    'estimateddurationminutes': 'estimatedDurationMinutes',
                    'weeknumber': 'weekNumber',
                    'chapternumber': 'chapterNumber'
                  };

                  let finalVal = weekData[key];
                  if (typeof finalVal === 'object' && finalVal !== null) {
                    try {
                      if (Array.isArray(finalVal)) {
                        if (finalVal.every(item => typeof item === 'string')) {
                          finalVal = finalVal.join('\n\n');
                        } else {
                          const textArray = finalVal.map(item => {
                            if (typeof item === 'object' && item !== null) {
                              const contentKey = Object.keys(item).find(k => 
                                ['question', 'truth', 'text', 'activity', 'application', 'content', 'verse'].includes(k.toLowerCase())
                              );
                              
                              if (contentKey && typeof item[contentKey] === 'string') {
                                 if (item.order) return `${item.order}. ${item[contentKey]}`;
                                 return item[contentKey];
                              } else {
                                 const strings = Object.values(item).filter(v => typeof v === 'string');
                                 if (item.order && strings.length > 0) return `${item.order}. ${strings.join(' - ')}`;
                                 if (strings.length > 0) return strings.join('\n');
                                 return JSON.stringify(item);
                              }
                            }
                            return String(item);
                          });
                          finalVal = textArray.join('\n\n');
                        }
                      } else {
                        const contentKey = Object.keys(finalVal).find(k => 
                          ['question', 'truth', 'text', 'activity', 'application', 'content', 'verse'].includes(k.toLowerCase())
                        );
                        if (contentKey && typeof finalVal[contentKey] === 'string') {
                          finalVal = finalVal[contentKey];
                        } else {
                          const strings = Object.values(finalVal).filter(v => typeof v === 'string');
                          if (strings.length > 0) {
                            finalVal = strings.join('\n');
                          } else {
                            finalVal = JSON.stringify(finalVal, null, 2);
                          }
                        }
                      }
                    } catch (e) {
                      finalVal = String(finalVal);
                    }
                  }

                  if (keyMap[flatKey]) {
                    acc[keyMap[flatKey]] = finalVal;
                  } else {
                    let camelKey = key.replace(/[\s_-]+(.)/g, (m, g1) => g1.toUpperCase());
                    camelKey = camelKey.charAt(0).toLowerCase() + camelKey.slice(1);
                    acc[camelKey] = finalVal;
                  }
                  return acc;
                }, {});
              });
            }
            return actualPlan;
          };

          if (Array.isArray(dataPayload)) {
            const normalizedList = dataPayload.map(p => normalizePlan(p));
            setPreviewData(normalizedList);
          } else {
            const normalizedSingle = normalizePlan(dataPayload);
            if (!normalizedSingle.title) {
              setError("Invalid JSON format. Missing title field.");
              setPreviewData(null);
            } else {
              setPreviewData(normalizedSingle);
            }
          }
        } catch (err) {
          setError('Failed to parse JSON file.');
          setPreviewData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!CHURCH_ID || !previewData) {
      setError('Church ID or preview data is missing.');
      setLoading(false);
      return;
    }

    try {
      await importDiscipleshipPlanJSON(CHURCH_ID, userProfile?.uid, previewData);
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to import plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Discipleship Plan JSON"
      subtitle="Upload single or bulk curriculum plans to your church catalog"
      icon={Upload}
      maxWidth="xl"
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
            type="button"
            onClick={handleImport}
            disabled={!previewData || loading}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Confirm Import'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-start border border-red-200/70">
            <AlertCircle size={15} className="mt-0.5 mr-2 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50 hover:bg-slate-100/60 transition-colors relative cursor-pointer group">
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200/70 text-[#2C4A60] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Upload size={22} />
          </div>
          <p className="text-sm font-bold text-slate-800">Click or drag Discipleship JSON file here</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {jsonFile ? jsonFile.name : 'Must follow discipleship JSON schema'}
          </p>
        </div>

        {previewData && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <BookOpen size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plan Preview</h3>
            </div>

            {Array.isArray(previewData) ? (
              <div>
                <p className="text-xs text-slate-600 font-medium">
                  <strong>Bulk Import:</strong> {previewData.length} Discipleship Plans found.
                </p>
                <ul className="mt-2 text-xs text-slate-600 space-y-1.5 max-h-40 overflow-y-auto pl-4 list-disc bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {previewData.map((plan, idx) => (
                    <li key={idx}>
                      <span className="font-semibold text-slate-800">{plan.title || 'Untitled'}</span>{' '}
                      <span className="text-slate-500">({plan.weeks?.length || 0} weeks)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 space-y-1">
                <p><strong className="text-slate-800">Title:</strong> {previewData.title}</p>
                <p><strong className="text-slate-800">Subtitle:</strong> {previewData.subtitle || 'N/A'}</p>
                <p><strong className="text-slate-800">Total Weeks:</strong> {previewData.weeks?.length || 0}</p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 font-medium pt-1">
              This plan will be imported as Draft and assigned to your current active church workspace.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
