import React from 'react';
import { FiPlus, FiTag, FiX } from 'react-icons/fi';
import { SectionTitle } from './fields';
import { inputCls } from './shared';

export default function VariantsEditor({ variants, addVariant, removeVariant, updateVariant }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<FiTag size={14} />}>Variants</SectionTitle>
        <button
          type="button"
          onClick={addVariant}
          className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
        >
          <FiPlus size={12} /> Add variant
        </button>
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Use <strong>Pack size</strong> for capsule/bottle counts (e.g. <em>30 capsules</em>) and{' '}
        <strong>Potency</strong> for the strength/dosage on the label
        (e.g. <em>1000mg</em>, <em>5000 IU</em>). Leave SKU blank to auto-generate one.
      </p>

      <div className="space-y-3">
        {variants.map((v, idx) => (
          <VariantRow
            key={idx}
            index={idx}
            variant={v}
            onUpdate={(patch) => updateVariant(idx, patch)}
            onRemove={variants.length > 1 ? () => removeVariant(idx) : null}
          />
        ))}
      </div>
    </div>
  );
}

function VariantRow({ index, variant: v, onUpdate, onRemove }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Variant {index + 1}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-600">
            <FiX size={14} />
          </button>
        )}
      </div>
      <input
        value={v.sku}
        onChange={(e) => onUpdate({ sku: e.target.value })}
        placeholder="SKU (auto if blank)"
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={v.size}
          onChange={(e) => onUpdate({ size: e.target.value })}
          placeholder="Size (S / M / L)"
          className={inputCls}
        />
        <input
          value={v.packSize}
          onChange={(e) => onUpdate({ packSize: e.target.value })}
          placeholder="Pack size (30 capsules)"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={v.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
          placeholder="Color"
          className={inputCls}
        />
        <input
          value={v.potency || ''}
          onChange={(e) => onUpdate({ potency: e.target.value })}
          placeholder="Potency (1000mg / 5000 IU)"
          aria-label="Potency"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input type="number" min="0" step="0.01" value={v.originalPrice}
          onChange={(e) => onUpdate({ originalPrice: e.target.value })} placeholder="MRP" className={inputCls} />
        <input type="number" min="0" step="0.01" value={v.salePrice}
          onChange={(e) => onUpdate({ salePrice: e.target.value })} placeholder="Sale" className={inputCls} />
        <input type="number" min="0" step="1" value={v.stock}
          onChange={(e) => onUpdate({ stock: e.target.value })} placeholder="Stock (50)" title="Defaults to 50 when blank" className={inputCls} />
      </div>
    </div>
  );
}
