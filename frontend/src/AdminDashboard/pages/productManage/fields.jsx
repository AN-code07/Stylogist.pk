import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiCheck, FiSearch, FiPlus } from 'react-icons/fi';
import { inputCls } from './shared';

// --- small layout primitives ------------------------------------------------

export function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
      <span className="w-7 h-7 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
    </div>
  );
}

// `as="div"` is used by the rich-text editor wrappers — wrapping a
// contenteditable inside a <label> causes the label to forward clicks to the
// first form control inside (e.g. the toolbar's heading <select>), stealing
// focus from the editor and making it impossible to type.
export function Field({ label, hint, required, children, as: As = 'label' }) {
  return (
    <As className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
    </As>
  );
}

export function SelectInput({ value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputCls} appearance-none pr-8 ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
    </div>
  );
}

// Counted text input — shows a live "used / max" indicator so admins can
// write meta copy that fits Google's SERP budget without external tooling.
export function CountedField({ label, hint, value, max, onChange, placeholder }) {
  const used = (value || '').length;
  const over = used > max;
  return (
    <label className="block">
      <span className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span
          className={`text-[10px] font-semibold tabular-nums ${
            over ? 'text-red-500' : used > max * 0.9 ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          {used} / {max}
        </span>
      </span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      {hint && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

// --- category tree multi-select --------------------------------------------

export function CategoryMultiSelect({ tree, selected, onChange, onAdd }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);

  const selSet = useMemo(() => new Set(selected.map(String)), [selected]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.trim().toLowerCase();
    return tree
      .map((parent) => {
        const parentMatch = parent.name.toLowerCase().includes(q);
        const children = parent.children.filter((c) => c.name.toLowerCase().includes(q));
        if (parentMatch || children.length) return { ...parent, children };
        return null;
      })
      .filter(Boolean);
  }, [tree, search]);

  const toggleParent = (parent) => {
    const ids = [parent._id, ...parent.children.map((c) => c._id)].map(String);
    if (selSet.has(String(parent._id))) {
      onChange(selected.filter((id) => !ids.includes(String(id))));
    } else {
      onChange([...new Set([...selected, String(parent._id)])]);
    }
  };

  const toggleChild = (parent, child) => {
    const cId = String(child._id);
    const pId = String(parent._id);
    if (selSet.has(cId)) {
      onChange(selected.filter((id) => String(id) !== cId));
    } else {
      onChange([...new Set([...selected, pId, cId])]);
    }
  };

  const selectedLabels = useMemo(() => {
    const all = tree.flatMap((p) => [p, ...p.children]);
    return all.filter((c) => selSet.has(String(c._id))).map((c) => c.name);
  }, [tree, selSet]);

  return (
    <div className="space-y-2">
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
          <div className="relative flex-1">
            <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
            />
          </div>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="shrink-0 px-2 py-1.5 border border-slate-200 rounded-md text-[11px] font-medium text-[#007074] hover:bg-[#007074]/5 flex items-center gap-1"
            >
              <FiPlus size={11} /> New
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {filteredTree.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">No categories match.</p>
          )}
          {filteredTree.map((parent) => {
            const pSelected = selSet.has(String(parent._id));
            const isOpen =
              open === parent._id ||
              !!search ||
              parent.children.some((c) => selSet.has(String(c._id)));
            return (
              <div key={parent._id}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={pSelected}
                    onChange={() => toggleParent(parent)}
                    className="w-4 h-4 accent-[#007074]"
                  />
                  <span className="flex-1 text-sm text-slate-800 font-medium">{parent.name}</span>
                  {parent.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : parent._id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <FiChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {isOpen && parent.children.length > 0 && (
                  <div className="ml-6 border-l border-slate-100 pl-2 py-1 space-y-0.5">
                    {parent.children.map((child) => (
                      <label
                        key={child._id}
                        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selSet.has(String(child._id))}
                          onChange={() => toggleChild(parent, child)}
                          className="w-4 h-4 accent-[#007074]"
                        />
                        <span className="text-xs text-slate-600">{child.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#007074]/10 text-[#007074] px-2 py-0.5 rounded-full"
            >
              <FiCheck size={10} /> {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- searchable single-select combobox -------------------------------------

export function SearchableSelect({ value, onChange, options, placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label || '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputCls} text-left flex items-center justify-between gap-2`}
      >
        <span className={selectedLabel ? 'text-slate-900' : 'text-slate-400'}>
          {selectedLabel || placeholder}
        </span>
        <FiChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
              />
            </div>
            {onAdd && (
              <button
                type="button"
                onClick={() => { setOpen(false); onAdd(); }}
                className="shrink-0 px-2 py-1.5 border border-slate-200 rounded-md text-[11px] font-medium text-[#007074] hover:bg-[#007074]/5 flex items-center gap-1"
              >
                <FiPlus size={11} /> New
              </button>
            )}
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  Clear selection
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">No matches.</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                    o.value === value ? 'text-[#007074] font-medium' : 'text-slate-700'
                  }`}
                >
                  {o.label}
                  {o.value === value && <FiCheck size={14} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
