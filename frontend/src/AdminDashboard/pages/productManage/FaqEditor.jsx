import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { inputCls } from './shared';

// FAQ editor used in the product form. Stores rows as
// [{ question, answer }] in form state. Empty rows are dropped at
// submit time by useProductManage so we never POST half-filled
// entries (the backend FAQPage JSON-LD requires both fields).
export default function FaqEditor({ value = [], onChange }) {
  const items = value.length ? value : [{ question: '', answer: '' }];

  const setAt = (idx, patch) => {
    const copy = items.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange(copy);
  };

  const addRow = () => onChange([...items, { question: '', answer: '' }]);

  const removeRow = (idx) => {
    if (items.length === 1) {
      onChange([]);
      return;
    }
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {items.map((row, idx) => (
        <div
          key={idx}
          className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Q{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="text-slate-400 hover:text-red-600 p-1"
              aria-label="Remove FAQ"
            >
              <FiX size={14} />
            </button>
          </div>
          <input
            value={row.question}
            onChange={(e) => setAt(idx, { question: e.target.value })}
            placeholder="Question (e.g. How long does one bottle last?)"
            className={inputCls}
          />
          <textarea
            value={row.answer}
            onChange={(e) => setAt(idx, { answer: e.target.value })}
            placeholder="Answer — keep it short and helpful."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
      >
        <FiPlus size={12} /> Add FAQ
      </button>
    </div>
  );
}
