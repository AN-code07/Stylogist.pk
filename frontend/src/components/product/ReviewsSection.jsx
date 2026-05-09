import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiSend, FiLoader, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import {
  useProductReviews,
  useReviewEligibility,
  useCreateReview,
} from '../../features/reviews/useReviewHooks';
import Seo from '../common/Seo';

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

// Renders the approved reviews list + an inline form. The backend gates the
// form by delivered orders (one review per product/user), so anyone we DO
// receive a review from is implicitly a verified buyer. We surface that
// state visually via a "Verified buyer" badge per row.
export default function ReviewsSection({ product }) {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const { data: reviews = [], isLoading } = useProductReviews(product?._id);
  const { data: eligibility } = useReviewEligibility(product?._id, isAuthed);

  // Aggregate stats — derived from the same reviews payload so we never
  // diverge from what's rendered. Avoids a second API call.
  const stats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1★, index 4 = 5★
    let total = 0;
    let sum = 0;
    reviews.forEach((r) => {
      const n = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
      counts[n - 1] += 1;
      total += 1;
      sum += n;
    });
    return {
      total,
      avg: total ? sum / total : 0,
      counts, // [1★, 2★, 3★, 4★, 5★]
    };
  }, [reviews]);

  // Cap JSON-LD review entries at the most-recent 10 — Google rejects pages
  // with hundreds of inline reviews, and the cap keeps the rendered <head>
  // payload tight without losing rich-result eligibility.
  const reviewJsonLd = useMemo(() => {
    if (!product || !reviews.length) return null;
    const slice = reviews.slice(0, 10);
    return slice.map((r, idx) => ({
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Product',
        name: product.name,
        sku: product.slug,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: { '@type': 'Person', name: r.user?.name || 'Verified buyer' },
      datePublished: r.createdAt,
      reviewBody: r.comment || '',
      _idx: idx,
    }));
  }, [reviews, product]);

  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Each review entry gets its own JSON-LD block (Google prefers
          discrete @type:Review nodes over an aggregated array). The
          aggregateRating is already emitted by SingleProductPage's
          Product schema, so we don't duplicate it here. */}
      {reviewJsonLd && reviewJsonLd.map((entry, idx) => {
        const { _idx, ...payload } = entry;
        return (
          <Seo
            key={_idx}
            jsonLd={payload}
            jsonLdId={`product-review-${product._id}-${_idx}`}
          />
        );
      })}

      {/* Aggregate stats panel — average, total count, and a 1–5 distribution
          histogram. Improves trust + scannability. */}
      {stats.total > 0 && <ReviewStats stats={stats} />}

      <ReviewForm product={product} isAuthed={isAuthed} eligibility={eligibility} />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li key={r._id} className="border-b border-gray-100 pb-5 last:border-b-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F7F3F0] flex items-center justify-center text-[10px] font-black uppercase text-[#007074]">
                    {(r.user?.name || 'U').slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#222]">{r.user?.name || 'Customer'}</span>
                      {/* Backend gates review creation by a delivered order
                          for the same user/product, so every approved review
                          is implicitly a verified buyer. Surface that. */}
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <FiCheck size={9} /> Verified buyer
                      </span>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400">{fmtDate(r.createdAt)}</div>
                  </div>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Aggregate review stats — average, count, and per-star distribution bars.
// Pure presentational, no fetching here.
function ReviewStats({ stats }) {
  const { total, avg, counts } = stats;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
      <div className="text-center md:text-left">
        <div className="text-4xl font-black text-[#222] tabular-nums leading-none">
          {avg.toFixed(1)}
        </div>
        <div className="mt-1.5 flex items-center justify-center md:justify-start gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <FiStar
              key={n}
              size={14}
              className={n <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1.5 font-semibold">
          {total} {total === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      <ul className="space-y-1.5" aria-label="Rating distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={star} className="flex items-center gap-3 text-xs text-gray-600">
              <span className="w-12 inline-flex items-center gap-1 tabular-nums">
                {star} <FiStar className="text-amber-400 fill-amber-400" size={11} aria-hidden="true" />
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" role="presentation">
                <div
                  className="h-full bg-[#007074] rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums text-gray-500">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewForm({ product, isAuthed, eligibility }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview(product._id);

  if (!isAuthed) {
    return (
      <div className="bg-[#F7F3F0] border border-[#007074]/10 rounded-xl p-4 text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>Sign in to leave a review for customers who've already ordered.</span>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#222] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#007074]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (eligibility?.hasReviewed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
        You already reviewed this product — thanks for the feedback!
      </div>
    );
  }

  if (eligibility && !eligibility.canReview) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        You can write a review once your order for this product is marked as delivered.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return toast.error('Pick a rating between 1 and 5');
    try {
      await createReview.mutateAsync({
        product: product._id,
        rating,
        comment: comment.trim() || undefined,
        order: eligibility?.orderId || undefined,
      });
      setRating(5);
      setComment('');
    } catch {
      /* toast already surfaced by hook */
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[#222]">Share your experience</h3>
        <RatingInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="What did you love? Anything to improve?"
        className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">
          Reviews are moderated before going live
        </span>
        <button
          type="submit"
          disabled={createReview.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#005a5d] disabled:opacity-60"
        >
          {createReview.isPending ? <FiLoader className="animate-spin" size={13} /> : <FiSend size={13} />}
          Submit
        </button>
      </div>
    </form>
  );
}

function RatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="p-0.5"
        >
          <FiStar
            size={18}
            className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
          />
        </button>
      ))}
    </div>
  );
}

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={12}
          className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
