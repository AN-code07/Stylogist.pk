import { useMemo } from 'react';
import Seo from './Seo';

// Sitewide structured data emitted on every storefront page (mounted once
// inside MainLayout). Provides Google with the two foundation entities it
// uses to build sitelinks-style search results:
//
//   - WebSite      → enables the "sitelinks search box" rich result
//   - Organization → drives the brand knowledge panel + Google Business
//                    cards by giving Google an authoritative business
//                    record with social profiles, contact, and logo.
//
// Per-page <Seo /> instances still own their own jsonLdId, so this never
// fights with Product / FAQ / Breadcrumb schemas.
export default function GlobalSeo() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://stylogist.pk';

  const websiteJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Stylogist',
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${origin}/products/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }),
    [origin]
  );

  const organizationJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      '@id': `${origin}#organization`,
      name: 'Stylogist',
      url: origin,
      logo: `${origin}/logo.png`,
      sameAs: [
        'https://instagram.com/stylogist.pk',
        'https://facebook.com/stylogist.pk',
        'https://twitter.com/stylogist_pk',
      ],
      // Pakistan-only support phone + COD. `contactPoint` is an array
      // because Schema validators warn when it's a single object that's
      // not strict @type:ContactPoint.
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          areaServed: 'PK',
          availableLanguage: ['en', 'ur'],
        },
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PK',
      },
      paymentAccepted: 'Cash on Delivery',
      currenciesAccepted: 'PKR',
    }),
    [origin]
  );

  return (
    <>
      <Seo jsonLd={websiteJsonLd} jsonLdId="global-website" />
      <Seo jsonLd={organizationJsonLd} jsonLdId="global-organization" />
    </>
  );
}
