import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, BookOpen, FileText, Sparkles, HeartHandshake } from 'lucide-react';
import ScripturePicker from '../../components/bible/ScripturePicker';

export default function DaySequenceBuilder({ day, onChange }) {
  const items = day.items || [];

  const updateItems = (newItems) => {
    onChange({
      ...day,
      items: newItems
    });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    updateItems(newItems);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    updateItems(newItems);
  };

  const handleDeleteItem = (index) => {
    updateItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index, updates) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    updateItems(newItems);
  };

  const handleAddDevotional = () => {
    const newDevotional = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'devotional',
      title: day.title || 'Today\'s Devotional',
      content: '',
      author: '',
      estimatedMinutes: 3
    };
    updateItems([...items, newDevotional]);
  };

  const handleAddScriptures = (passagesList) => {
    const nonScriptureItems = items.filter(it => it.type !== 'scripture');
    updateItems([...items, ...passagesList]);
  };

  // Quick preset: Devotional first
  const handlePresetDevotionalFirst = () => {
    const devotionals = items.filter(it => it.type === 'devotional');
    const scriptures = items.filter(it => it.type === 'scripture');
    const others = items.filter(it => it.type !== 'devotional' && it.type !== 'scripture');
    updateItems([...devotionals, ...scriptures, ...others]);
  };

  // Quick preset: Scripture first
  const handlePresetScriptureFirst = () => {
    const scriptures = items.filter(it => it.type === 'scripture');
    const devotionals = items.filter(it => it.type === 'devotional');
    const others = items.filter(it => it.type !== 'devotional' && it.type !== 'scripture');
    updateItems([...scriptures, ...devotionals, ...others]);
  };

  // Collect current scripture items to pass to ScripturePicker
  const scriptureItems = items.filter(it => it.type === 'scripture');

  const handleScripturesChange = (updatedScriptures) => {
    // Preserve other items in relative position, replace scriptures
    const otherItems = items.filter(it => it.type !== 'scripture');
    // Determine whether scriptures were initially before or after devotionals
    const firstDevotionalIdx = items.findIndex(it => it.type === 'devotional');
    const firstScriptureIdx = items.findIndex(it => it.type === 'scripture');

    if (firstDevotionalIdx !== -1 && firstScriptureIdx !== -1 && firstDevotionalIdx < firstScriptureIdx) {
      // Devotional was first
      updateItems([...otherItems, ...updatedScriptures]);
    } else {
      // Scripture was first or no devotional yet
      updateItems([...updatedScriptures, ...otherItems]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sequence Header & Reorder Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
        <div>
          <span className="text-xs font-bold text-church-navy">Daily Reading Flow & Sequence</span>
          <p className="text-[11px] text-gray-500">Arrange the reading order your members will experience in the mobile app.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePresetScriptureFirst}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-church-navy"
          >
            📖 Scripture First
          </button>
          <button
            type="button"
            onClick={handlePresetDevotionalFirst}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-church-navy"
          >
            ✍️ Devotional First
          </button>
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm space-y-3 transition-shadow hover:shadow-md"
          >
            {/* Item Card Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-church-navy text-white text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-church-slate flex items-center">
                  {item.type === 'devotional' ? (
                    <>
                      <FileText size={14} className="mr-1 text-amber-600" />
                      Devotional Article
                    </>
                  ) : (
                    <>
                      <BookOpen size={14} className="mr-1 text-church-green" />
                      Scripture Reading: {item.display || `${item.bookId} ${item.chapter}`}
                    </>
                  )}
                </span>
              </div>

              {/* Reorder Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="p-1 text-gray-400 hover:text-church-navy disabled:opacity-20"
                  title="Move Up in Sequence"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === items.length - 1}
                  className="p-1 text-gray-400 hover:text-church-navy disabled:opacity-20"
                  title="Move Down in Sequence"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(idx)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Remove Item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Devotional Item Content */}
            {item.type === 'devotional' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-church-navy mb-1">
                      Devotional Title *
                    </label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => handleUpdateItem(idx, { title: e.target.value })}
                      placeholder="e.g. The Priority of Love"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-church-navy mb-1">
                      Author / Source
                    </label>
                    <input
                      type="text"
                      value={item.author || ''}
                      onChange={(e) => handleUpdateItem(idx, { author: e.target.value })}
                      placeholder="e.g. R.C. Sproul"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-church-navy mb-1">
                    Devotional Reflection / Body Text *
                  </label>
                  <textarea
                    rows="6"
                    value={item.content || ''}
                    onChange={(e) => handleUpdateItem(idx, { content: e.target.value })}
                    placeholder="Enter multi-paragraph devotional reflection..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green resize-y font-serif leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Scripture Item Summary */}
            {item.type === 'scripture' && (
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-emerald-900">{item.display}</span>
                  <span className="text-[10px] text-emerald-700 ml-2">({item.bookId} • Ch {item.chapter}{item.endChapter > item.chapter ? `-${item.endChapter}` : ''})</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                  Canonical Scripture
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Scripture Section via ScripturePicker */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-church-navy mb-2">
          Manage Scripture Readings (Canonical Picker):
        </label>
        <ScripturePicker
          passages={scriptureItems}
          onChange={handleScripturesChange}
        />
      </div>

      {/* Add Devotional Button if not yet present */}
      {!items.some(it => it.type === 'devotional') && (
        <button
          type="button"
          onClick={handleAddDevotional}
          className="w-full py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 hover:bg-amber-100 flex items-center justify-center transition-colors"
        >
          <FileText size={15} className="mr-1.5 text-amber-700" />
          + Add Devotional Reading (Full Article)
        </button>
      )}
    </div>
  );
}
