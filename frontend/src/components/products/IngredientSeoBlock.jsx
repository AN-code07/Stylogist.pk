import React, { useMemo, useState } from 'react';
import {
  FiCheck, FiHeart, FiBookOpen, FiChevronDown, FiAward,
} from 'react-icons/fi';
import Seo from '../common/Seo';

// Rich SEO + content block rendered BELOW the product grid on
// /ingredient/:slug. Lives separately from ProductsPage because the
// content concerns (benefits, FAQ, deep-dive copy, JSON-LD) are
// ingredient-specific. Other scopes (brand, category) get lighter blocks.
//
// Emits FAQPage JSON-LD and a per-ingredient meta override; the parent
// ProductsPage already emits the page-level meta + canonical, so we only
// add what's specific (FAQ schema, deeper description).
export default function IngredientSeoBlock({ ingredient }) {
  const [openFaq, setOpenFaq] = useState(0);

  const faqJsonLd = useMemo(() => {
    if (!ingredient?.faq?.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: ingredient.faq.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    };
  }, [ingredient]);

  if (!ingredient) return null;

  const hasContent =
    (ingredient.benefits?.length || 0) +
    (ingredient.uses?.length || 0) +
    (ingredient.faq?.length || 0) +
    (ingredient.description?.length || 0) > 0;
  if (!hasContent) return null;

  return (
    <section className="space-y-12 mt-16">
      {faqJsonLd && (
        <Seo jsonLd={faqJsonLd} jsonLdId={`ingredient-faq-${ingredient._id}`} />
      )}
      {ingredient.isIndexable === false && <NoIndexHint />}

      {/* Benefits + uses */}
      {(ingredient.benefits?.length > 0 || ingredient.uses?.length > 0) && (
        <div>
          <header className="mb-7 text-center max-w-2xl mx-auto">
            <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
              Why it matters
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black text-[#222] tracking-tight">
              What {ingredient.name} <span className="italic text-[#007074]">does for you</span>
            </h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ingredient.benefits?.length > 0 && (
              <article className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-xl bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                    <FiHeart size={18} />
                  </span>
                  <h3 className="font-serif text-xl font-black text-[#222] tracking-tight">Benefits</h3>
                </div>
                <ul className="space-y-3">
                  {ingredient.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center flex-shrink-0">
                        <FiCheck size={11} strokeWidth={3} />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
            {ingredient.uses?.length > 0 && (
              <article className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-xl bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                    <FiBookOpen size={18} />
                  </span>
                  <h3 className="font-serif text-xl font-black text-[#222] tracking-tight">How to use</h3>
                </div>
                <ol className="space-y-3">
                  {ingredient.uses.map((u, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-[#222] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ol>
              </article>
            )}
          </div>
        </div>
      )}

      {/* Long SEO description */}
      {ingredient.description && (
        <article className="bg-white border border-gray-100 rounded-2xl p-6 md:p-10 shadow-sm">
          <header className="mb-6 pb-5 border-b border-gray-100">
            <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
              Deep dive
            </span>
            <h2 className="font-serif text-xl md:text-2xl font-black text-[#222] tracking-tight">
              Everything you need to know about {ingredient.name}
            </h2>
          </header>
          <div
            className="product-rich tiptap max-w-3xl"
            dangerouslySetInnerHTML={{ __html: ingredient.description }}
          />
        </article>
      )}

      {/* FAQ */}
      {ingredient.faq?.length > 0 && (
        <div>
          <header className="mb-7 text-center max-w-2xl mx-auto">
            <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
              Got questions?
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black text-[#222] tracking-tight">
              Frequently asked <span className="italic text-[#007074]">questions</span>
            </h2>
          </header>
          <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden max-w-3xl mx-auto">
            {ingredient.faq.map((q, idx) => {
              const open = openFaq === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#F7F3F0]/50 transition-colors"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-bold text-[#222] leading-snug pr-4">{q.question}</span>
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        open ? 'bg-[#007074] text-white rotate-180' : 'bg-[#F7F3F0] text-[#007074]'
                      }`}
                    >
                      <FiChevronDown size={14} />
                    </span>
                  </button>
                  {open && (
                    <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed">
                      {q.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function NoIndexHint() {
  React.useEffect(() => {
    const tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    tag.setAttribute('content', 'noindex, follow');
    tag.setAttribute('data-ingredient-noindex', '1');
    document.head.appendChild(tag);
    return () => {
      document.head.querySelectorAll('meta[data-ingredient-noindex="1"]').forEach((n) => n.remove());
    };
  }, []);
  return null;
}
