import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { inputCls } from './shared';

// Simplified "Why customers love it" editor. The icon + body inputs were
// removed per product spec — each row is just a headline now. The PDP
// renders them as a clean text grid.
export default function WhyLoveItEditor({ value = [], onChange }) {
  const items = value.length ? value : [{ title: '' }];

  const setAt = (idx, patch) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addRow = () => onChange([...items, { title: '' }]);

  const removeRow = (idx) => {
    if (items.length === 1) {
      onChange([]);
      return;
    }
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#007074]/10 text-[#007074] text-[10px] font-semibold flex items-center justify-center shrink-0">
            {idx + 1}
          </span>
          <input
            value={item.title || ''}
            onChange={(e) => setAt(idx, { title: e.target.value })}
            placeholder="Better sleep"
            aria-label="Headline"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="text-slate-400 hover:text-red-600 p-1.5"
            aria-label="Remove benefit"
          >
            <FiX size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
      >
        <FiPlus size={12} /> Add benefit
      </button>
    </div>
  );
}
