import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { inputCls } from './shared';

// Repeater editor for "Why customers love it" benefit cards. Each row is
// `{ icon, title, body }` — the icon is a free-form string so admins can
// paste any emoji (😴 💪 ⚡ 🧠 etc.) without committing to an icon library.
// Empty rows (no title) are dropped at submit time by useProductManage.
export default function WhyLoveItEditor({ value = [], onChange }) {
  const items = value.length ? value : [emptyRow()];

  const setAt = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const addRow = () => onChange([...items, emptyRow()]);

  const removeRow = (idx) => {
    if (items.length === 1) {
      onChange([]);
      return;
    }
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/40 space-y-2">
          <div className="flex items-start gap-2">
            <input
              value={item.icon || ''}
              onChange={(e) => setAt(idx, { icon: e.target.value })}
              placeholder="😴"
              maxLength={4}
              aria-label="Icon (emoji)"
              className={`${inputCls} w-14 text-center text-lg`}
            />
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
          <textarea
            value={item.body || ''}
            onChange={(e) => setAt(idx, { body: e.target.value })}
            placeholder="One short sentence about the outcome (optional)."
            rows={2}
            aria-label="Short body"
            className={`${inputCls} resize-y`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
      >
        <FiPlus size={12} /> Add benefit card
      </button>
    </div>
  );
}

const emptyRow = () => ({ icon: '✨', title: '', body: '' });
