import React from 'react';
import { FiAlertTriangle, FiEye, FiPlus } from 'react-icons/fi';
import ProductList from './productManage/ProductList';
import ProductForm from './productManage/ProductForm';
import CategoryOffcanvas from './productManage/CategoryOffcanvas';
import BrandOffcanvas from './productManage/BrandOffcanvas';
import IngredientOffcanvas from './productManage/IngredientOffcanvas';
import useProductManage from './productManage/useProductManage';

export default function ProductManage() {
  const ctl = useProductManage();

  return (
    <div className="space-y-6 pb-12">
      <Header
        view={ctl.view}
        editingId={ctl.editingId}
        onToggle={() => (ctl.view === 'list' ? ctl.setView('form') : ctl.resetForm())}
      />

      {ctl.view === 'list' ? (
        <ProductList
          products={ctl.products}
          loading={ctl.loadingProducts}
          search={ctl.search}
          setSearch={ctl.setSearch}
          statusFilter={ctl.statusFilter}
          setStatusFilter={ctl.setStatusFilter}
          onEdit={ctl.startEdit}
          onDelete={ctl.setDeleteTarget}
        />
      ) : (
        <ProductForm
          form={ctl.form}
          setForm={ctl.setForm}
          editingId={ctl.editingId}
          categoryTree={ctl.categoryTree}
          brands={ctl.brands}
          ingredients={ctl.ingredients}
          onGenerateSlug={ctl.handleGenerateSlug}
          onThumbnailUpload={ctl.handleThumbnailUpload}
          onRemoveThumbnail={ctl.removeThumbnail}
          onMediaUpload={ctl.handleMediaUpload}
          onRemoveMedia={ctl.removeMedia}
          addVariant={ctl.addVariant}
          removeVariant={ctl.removeVariant}
          updateVariant={ctl.updateVariant}
          onSubmit={ctl.handleSubmit}
          onCancel={ctl.resetForm}
          submitting={ctl.createMut.isPending || ctl.updateMut.isPending}
          uploadingOne={ctl.uploadOne.isPending}
          uploadingMany={ctl.uploadMany.isPending}
          onOpenCategory={() => ctl.setOffcanvas('category')}
          onOpenBrand={() => ctl.setOffcanvas('brand')}
          onOpenIngredient={() => ctl.setOffcanvas('ingredient')}
        />
      )}

      {ctl.deleteTarget && (
        <DeleteDialog
          target={ctl.deleteTarget}
          pending={ctl.deleteMut.isPending}
          onCancel={() => ctl.setDeleteTarget(null)}
          onConfirm={ctl.handleDelete}
        />
      )}

      {ctl.offcanvas === 'category' && (
        <CategoryOffcanvas
          categories={ctl.categories}
          onClose={() => ctl.setOffcanvas(null)}
          onCreated={(cat) => {
            ctl.setForm((f) => ({
              ...f,
              categories: [...new Set([...(f.categories || []), cat._id])],
              category: f.category || cat._id,
            }));
            ctl.setOffcanvas(null);
          }}
        />
      )}

      {ctl.offcanvas === 'brand' && (
        <BrandOffcanvas
          onClose={() => ctl.setOffcanvas(null)}
          onCreated={(brand) => {
            ctl.setForm((f) => ({ ...f, brand: brand._id }));
            ctl.setOffcanvas(null);
          }}
        />
      )}

      {ctl.offcanvas === 'ingredient' && (
        <IngredientOffcanvas
          onClose={() => ctl.setOffcanvas(null)}
          onCreated={(ingredient) => {
            ctl.setForm((f) => ({
              ...f,
              ingredients: [...new Set([...(f.ingredients || []), ingredient._id])],
            }));
            ctl.setOffcanvas(null);
          }}
        />
      )}
    </div>
  );
}

function Header({ view, editingId, onToggle }) {
  const subtitle =
    view === 'list'
      ? 'All products across your catalog.'
      : editingId
        ? 'Edit an existing product.'
        : 'Add a new product to your catalog.';

  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      <button
        onClick={onToggle}
        className="px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] flex items-center gap-2"
      >
        {view === 'list' ? (<><FiPlus size={16} /> New product</>) : (<><FiEye size={16} /> View list</>)}
      </button>
    </header>
  );
}

function DeleteDialog({ target, pending, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <FiAlertTriangle size={22} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 text-center">Delete product</h3>
        <p className="text-sm text-slate-500 mt-2 text-center">
          Permanently delete <span className="font-medium text-slate-800">{target.name}</span> and all its variants & media?
        </p>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
