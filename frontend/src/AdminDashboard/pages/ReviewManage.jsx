import React, { useState } from 'react';
import {
  FiSearch, FiStar, FiCheck, FiTrash2, FiFlag, FiX, FiRefreshCw,
  FiAlertCircle, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import {
  useReviews,
  useUpdateReviewStatus,
  useDeleteReview,
} from '../../features/reviews/useReviewHooks';
import { ConfirmDialog } from './CategoryManage';

const PAGE_SIZE = 20;

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ReviewManage() {
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = {
    status,
    search,
    page,
    limit: PAGE_SIZE,
    ...(ratingFilter !== 'all' ? { rating: ratingFilter } : {}),
  };
  const { data, isLoading, isError, refetch, isFetching } = useReviews(params);
  const updateMut = useUpdateReviewStatus();
  const deleteMut = useDeleteReview();

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const onStatus = (s) => { setStatus(s); setPage(1); };
  const onRating = (r) => { setRatingFilter(r); setPage(1); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch { /* hook toast */ }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Moderate customer feedback before it goes live.</p>
        </div>

        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-max">
          {['pending', 'approved', 'flagged', 'all'].map((s) => (
            <TabButton key={s} active={status === s} onClick={() => onStatus(s)}>
              {s}
            </TabButton>
          ))}
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by customer, product, or comment"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-max">
          <TabButton active={ratingFilter === 'all'} onClick={() => onRating('all')}>Any rating</TabButton>
          {[5, 4, 3, 2, 1].map((r) => (
            <TabButton key={r} active={ratingFilter === r} onClick={() => onRating(r)}>
              <span className="inline-flex items-center gap-1">{r} <FiStar size={10} className="fill-current" /></span>
            </TabButton>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid */}
      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 mx-auto flex items-center justify-center mb-3">
            <FiCheck size={22} />
          </div>
          <p className="text-sm text-slate-500">
            {search || ratingFilter !== 'all'
              ? 'No reviews match your filters.'
              : `No ${status === 'all' ? '' : status + ' '}reviews yet.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                isSaving={updateMut.isPending}
                onApprove={() => updateMut.mutate({ id: r._id, status: 'approved' })}
                onFlag={() => updateMut.mutate({ id: r._id, status: 'flagged' })}
                onReopen={() => updateMut.mutate({ id: r._id, status: 'pending' })}
                onDelete={() => setDeleteTarget(r)}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-sm">
              <div className="text-xs text-slate-500">
                Page <span className="font-medium text-slate-700">{pagination.page}</span> of{' '}
                <span className="font-medium text-slate-700">{pagination.pages}</span> · {pagination.total} total
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pagination.pages || isFetching}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="w-8 h-8 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete review"
          message={`Permanently delete ${deleteTarget.user?.name || 'this customer'}'s review? This can't be undone.`}
          confirmLabel={deleteMut.isPending ? 'Deleting…' : 'Delete'}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

/* ------------ subcomponents ------------ */

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
        active ? 'bg-[#007074] text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function ReviewCard({ review, isSaving, onApprove, onFlag, onReopen, onDelete }) {
  const { user, product, rating, comment, status, createdAt } = review;
  const initials = (user?.name || '?').split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <article className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
      <div className={`h-1 ${statusBarClass(status)}`} />
      <div className="p-5 flex-1 flex flex-col">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <FiStar
                key={i}
                size={13}
                className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-400">{fmtDate(createdAt)}</span>
        </header>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Unknown'}</div>
            <div className="text-xs text-[#007074] truncate">{product?.name || 'Unknown product'}</div>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-4">
          {comment ? `"${comment}"` : <span className="italic text-slate-400">No comment provided.</span>}
        </p>

        <footer className="flex items-center gap-2 pt-3 border-t border-slate-100">
          {status !== 'approved' && (
            <button
              disabled={isSaving}
              onClick={onApprove}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium bg-[#007074] text-white hover:bg-[#005a5d] disabled:opacity-60"
            >
              <FiCheck size={12} /> Approve
            </button>
          )}
          {status !== 'flagged' && (
            <button
              disabled={isSaving}
              onClick={onFlag}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 disabled:opacity-60"
            >
              <FiFlag size={12} /> Flag
            </button>
          )}
          {status !== 'pending' && (
            <button
              disabled={isSaving}
              onClick={onReopen}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-60"
            >
              Reopen
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-9 h-9 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 flex-shrink-0"
            title="Delete"
          >
            <FiTrash2 size={13} />
          </button>
        </footer>
      </div>
    </article>
  );
}

function statusBarClass(status) {
  if (status === 'approved') return 'bg-emerald-400';
  if (status === 'flagged') return 'bg-rose-400';
  return 'bg-amber-400';
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
      <h3 className="text-sm font-semibold text-slate-900">Couldn't load reviews</h3>
      <p className="text-sm text-slate-500 mt-1">Check that the backend is running and you're signed in as an admin.</p>
      <button
        onClick={() => onRetry()}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
      >
        <FiRefreshCw size={14} /> Try again
      </button>
    </div>
  );
}
