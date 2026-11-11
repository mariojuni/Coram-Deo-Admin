import React, { useState } from 'react';
import { BIBLE_BOOKS, BIBLE_BOOKS_BY_ID, parseScriptureReference } from '../../constants/bibleCanon';
import { Plus, Trash2, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export default function ScripturePicker({ passages = [], onChange }) {
  const [quickInput, setQuickInput] = useState('');
  const [quickError, setQuickError] = useState('');

  const handleAddPassage = () => {
    const defaultBook = BIBLE_BOOKS[0]; // Genesis
    const newPassage = {
      id: `scripture_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'scripture',
      bookId: defaultBook.id,
      bookName: defaultBook.name,
      chapter: 1,
      endChapter: 1,
      startVerse: null,
      endVerse: null,
      display: `${defaultBook.name} 1`,
      usfmRange: `${defaultBook.id}.1-${defaultBook.id}.1`
    };
    onChange([...passages, newPassage]);
  };

  const handleRemovePassage = (index) => {
    const updated = passages.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleUpdatePassage = (index, updates) => {
    const current = passages[index];
    const book = BIBLE_BOOKS_BY_ID[updates.bookId || current.bookId] || BIBLE_BOOKS[0];
    
    let chapter = updates.chapter !== undefined ? updates.chapter : current.chapter;
    let endChapter = updates.endChapter !== undefined ? updates.endChapter : current.endChapter;
    let startVerse = updates.startVerse !== undefined ? updates.startVerse : current.startVerse;
    let endVerse = updates.endVerse !== undefined ? updates.endVerse : current.endVerse;

    // Ensure within book chapter limits
    chapter = Math.min(Math.max(1, parseInt(chapter, 10) || 1), book.chapters);
    endChapter = Math.min(Math.max(chapter, parseInt(endChapter, 10) || chapter), book.chapters);

    // Format clean display
    let display = `${book.name} ${chapter}`;
    if (startVerse != null) {
      display += `:${startVerse}`;
      if (endVerse != null && endVerse !== startVerse) {
        display += `-${endVerse}`;
      }
    } else if (endChapter > chapter) {
      display += `–${endChapter}`;
    }

    const updatedPassage = {
      ...current,
      ...updates,
      bookId: book.id,
      bookName: book.name,
      chapter,
      endChapter,
      startVerse,
      endVerse,
      display,
      usfmRange: startVerse != null
        ? `${book.id}.${chapter}.${startVerse}-${book.id}.${endChapter}.${endVerse || startVerse}`
        : `${book.id}.${chapter}-${book.id}.${endChapter}`
    };

    const updatedList = [...passages];
    updatedList[index] = updatedPassage;
    onChange(updatedList);
  };

  const handleQuickParse = () => {
    setQuickError('');
    if (!quickInput.trim()) return;

    const parsed = parseScriptureReference(quickInput);
    if (parsed.length === 0) {
      setQuickError('Could not identify Bible books or chapters from the input text.');
      return;
    }

    onChange([...passages, ...parsed]);
    setQuickInput('');
  };

  return (
    <div className="space-y-4">
      {/* Quick Paste Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center">
            <Sparkles size={14} className="mr-1 text-church-green" />
            Quick Auto-Fill (Paste text like "Genesis 7-9; Romans 3")
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuickParse())}
            placeholder="e.g. Genesis 7–9; Romans 3 or Galacia 5:22-23"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
          />
          <button
            type="button"
            onClick={handleQuickParse}
            className="px-3 py-1.5 bg-church-navy text-white text-xs font-medium rounded-xl hover:bg-church-navy/90 shrink-0"
          >
            Auto-Fill
          </button>
        </div>
        {quickError && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center">
            <AlertCircle size={12} className="mr-1 shrink-0" />
            {quickError}
          </p>
        )}
      </div>

      {/* Structured Passage Cards */}
      <div className="space-y-3">
        {passages.map((passage, idx) => {
          const book = BIBLE_BOOKS_BY_ID[passage.bookId] || BIBLE_BOOKS[0];
          const hasVerses = passage.startVerse != null;

          return (
            <div
              key={passage.id || idx}
              className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3 relative group"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-church-slate flex items-center">
                  <BookOpen size={14} className="mr-1.5 text-church-green" />
                  Scripture Reading #{idx + 1}:
                  <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-mono text-xs">
                    {passage.display}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePassage(idx)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Remove this passage"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Book Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Book</label>
                  <select
                    value={passage.bookId}
                    onChange={(e) => handleUpdatePassage(idx, { bookId: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green font-medium"
                  >
                    <optgroup label="Old Testament">
                      {BIBLE_BOOKS.filter(b => b.testament === 'OT').map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.id}) - {b.tagalog}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="New Testament">
                      {BIBLE_BOOKS.filter(b => b.testament === 'NT').map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.id}) - {b.tagalog}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Chapter Range */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Chapters (Max {book.chapters})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={passage.chapter}
                      onChange={(e) => handleUpdatePassage(idx, { 
                        chapter: parseInt(e.target.value, 10),
                        endChapter: Math.max(parseInt(e.target.value, 10), passage.endChapter)
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
                    >
                      {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                        <option key={ch} value={ch}>Ch {ch}</option>
                      ))}
                    </select>
                    <span className="text-gray-400 text-xs">to</span>
                    <select
                      value={passage.endChapter || passage.chapter}
                      onChange={(e) => handleUpdatePassage(idx, { endChapter: parseInt(e.target.value, 10) })}
                      className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
                    >
                      {Array.from({ length: book.chapters - passage.chapter + 1 }, (_, i) => passage.chapter + i).map(ch => (
                        <option key={ch} value={ch}>Ch {ch}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Verses Mode */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-semibold text-gray-500">Verses</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasVerses) {
                          handleUpdatePassage(idx, { startVerse: null, endVerse: null });
                        } else {
                          handleUpdatePassage(idx, { startVerse: 1, endVerse: 1 });
                        }
                      }}
                      className="text-[10px] text-church-green font-bold hover:underline"
                    >
                      {hasVerses ? 'Entire Chapter' : 'Specific Verses?'}
                    </button>
                  </div>
                  {hasVerses ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        placeholder="Start"
                        value={passage.startVerse || ''}
                        onChange={(e) => handleUpdatePassage(idx, { startVerse: parseInt(e.target.value, 10) || 1 })}
                        className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input
                        type="number"
                        min={passage.startVerse || 1}
                        placeholder="End"
                        value={passage.endVerse || ''}
                        onChange={(e) => handleUpdatePassage(idx, { endVerse: parseInt(e.target.value, 10) || passage.startVerse })}
                        className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 py-1.5 px-2 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                      Full Chapter(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Passage Button */}
      <button
        type="button"
        onClick={handleAddPassage}
        className="w-full py-2 px-3 border border-dashed border-gray-300 rounded-2xl text-xs font-bold text-church-navy hover:bg-gray-50 flex items-center justify-center transition-colors"
      >
        <Plus size={14} className="mr-1.5 text-church-green" />
        Add Scripture Reading / Split Book
      </button>
    </div>
  );
}
