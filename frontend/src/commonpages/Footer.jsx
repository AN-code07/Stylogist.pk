import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMail,
  FiPhoneCall,
  FiMapPin,
  FiInstagram,
  FiFacebook,
  FiTwitter,
  FiYoutube,
  FiLinkedin,
  FiGlobe,
  FiArrowRight
} from 'react-icons/fi';
import gsap from 'gsap';
import logo from '/logo.png';
import { useSiteSettings } from '../features/settings/useSettingsHooks';

// Maps a platform slug (stored on the settings document) to its icon.
// Unknown platforms fall back to a generic globe so adding a new social
// channel in the admin settings doesn't require a code change.
const SOCIAL_ICONS = {
  instagram: FiInstagram,
  facebook: FiFacebook,
  twitter: FiTwitter,
  x: FiTwitter,
  youtube: FiYoutube,
  linkedin: FiLinkedin,
};

const pickIcon = (platform) =>
  SOCIAL_ICONS[(platform || '').toLowerCase()] || FiGlobe;

export default function Footer() {
  const { data } = useSiteSettings();
  const footer = data?.footer;

  // GSAP scroll-triggered entrance + continuous micro-animations.
  // We use IntersectionObserver to trigger the entrance once the footer
  // enters the viewport so the animation doesn't play off-screen on long
  // pages. Continuous loops (socials float, CTA shimmer) start immediately.
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;

    const brand = root.querySelector('[data-anim="brand"]');
    const cols = root.querySelectorAll('[data-anim="col"]');
    const socials = root.querySelectorAll('[data-anim="social"]');
    const bottom = root.querySelector('[data-anim="bottom"]');
    const cta = root.querySelector('[data-anim="cta"]');
    const tagline = root.querySelector('[data-anim="tagline"]');

    // Seed hidden state synchronously so the browser never paints the
    // un-animated version before GSAP takes over.
    gsap.set([brand, cols, bottom].filter(Boolean), { opacity: 0, y: 24 });
    gsap.set(socials, { opacity: 0, y: 10, scale: 0.85 });

    let entranceTl;
    let shimmerTween;
    let socialsTween;

    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();

          entranceTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (brand) {
            entranceTl.to(brand, { opacity: 1, y: 0, duration: 0.75 });
          }
          if (tagline) {
            entranceTl.from(tagline, { opacity: 0, y: 10, duration: 0.55 }, '-=0.4');
          }
          if (cols.length) {
            entranceTl.to(
              cols,
              { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
              '-=0.45'
            );
          }
          if (socials.length) {
            entranceTl.to(
              socials,
              { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(1.7)' },
              '-=0.3'
            );
          }
          if (bottom) {
            entranceTl.to(bottom, { opacity: 1, y: 0, duration: 0.55 }, '-=0.25');
          }

          // Continuous shimmer on the newsletter CTA — a soft scale + glow
          // heartbeat that draws the eye to the primary conversion surface.
          if (cta) {
            shimmerTween = gsap.to(cta, {
              boxShadow: '0 0 0 6px rgba(0,112,116,0.18)',
              scale: 1.03,
              duration: 1.4,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            });
          }

          // Gentle float on the social icons so the row feels alive without
          // being distracting.
          if (socials.length) {
            socialsTween = gsap.to(socials, {
              y: -3,
              duration: 1.8,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
              stagger: { each: 0.15, from: 'start' },
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    io.observe(root);

    return () => {
      io.disconnect();
      entranceTl?.kill();
      shimmerTween?.kill();
      socialsTween?.kill();
    };
  }, [data]); // rebind once settings arrive (node count for lists may change)

  // Fall back to empty arrays/strings while the settings request is in flight;
  // the server always returns populated defaults so this is only the
  // very-first-paint case.
  const shopLinks = footer?.shopLinks || [];
  const customerCareLinks = footer?.customerCareLinks || [];
  const legalLinks = footer?.legalLinks || [];
  const socials = footer?.socials || [];
  const paymentBadges = footer?.paymentBadges || [];

  return (
    <footer ref={rootRef} className="w-full bg-[#111111] text-white pt-10 pb-8 ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

          {/* Column 1: Brand Info (Spans 4 cols on large screens) */}
          <div data-anim="brand" className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center group mb-6" aria-label="Stylogist.pk home">
              <img
                src={logo}
                alt="Stylogist.pk"
                width="140"
                height="44"
                className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </Link>
            {footer?.brandTagline && (
              <p data-anim="tagline" className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
                {footer.brandTagline}
              </p>
            )}

            <div className="space-y-4">
              {footer?.address && (
                <div className="flex items-center space-x-3 text-gray-400">
                  <FiMapPin className="text-[#007074]" size={18} />
                  <span className="text-sm">{footer.address}</span>
                </div>
              )}
              {footer?.phone && (
                <a
                  href={`tel:${footer.phone.replace(/\s+/g, '')}`}
                  className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                >
                  <FiPhoneCall className="text-[#007074]" size={18} />
                  <span className="text-sm">{footer.phone}</span>
                </a>
              )}
              {footer?.email && (
                <a
                  href={`mailto:${footer.email}`}
                  className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                >
                  <FiMail className="text-[#007074]" size={18} />
                  <span className="text-sm">{footer.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Shop Links (Spans 2 cols) */}
          <div data-anim="col" className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">
              Shop Categories
            </h3>
            <ul className="space-y-4">
              {shopLinks.map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <Link
                    to={link.path}
                    className="text-gray-400 text-sm hover:text-[#007074] inline-block transform hover:translate-x-1 transition-all ease-in-out duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care (Spans 2 cols) */}
          <div data-anim="col" className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">
              Customer Care
            </h3>
            <ul className="space-y-4">
              {customerCareLinks.map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <Link
                    to={link.path}
                    className="text-gray-400 text-sm hover:text-[#007074]  inline-block transform hover:translate-x-1 transition-all ease-in-out duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter & Socials (Spans 4 cols) */}
          <div data-anim="col" className="lg:col-span-4">
            {footer?.newsletterHeading && (
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">
                {footer.newsletterHeading}
              </h3>
            )}
            {footer?.newsletterBlurb && (
              <p className="text-gray-400 text-sm mb-4">{footer.newsletterBlurb}</p>
            )}

            <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full bg-[#222222] border border-gray-700 text-white px-4 py-3.5 rounded-md focus:outline-none focus:border-[#007074] text-sm transition-colors pr-14"
                  required
                />
                <button
                  type="submit"
                  data-anim="cta"
                  className="absolute right-1.5 p-2 bg-[#007074] text-white rounded-md hover:bg-[#005a5d] transition-colors"
                  aria-label="Subscribe"
                >
                  <FiArrowRight size={18} />
                </button>
              </div>
            </form>

            {socials.length > 0 && (
              <>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                  Follow Us
                </h3>
                <div className="flex space-x-4">
                  {socials.map((s, idx) => {
                    const Icon = pickIcon(s.platform);
                    return (
                      <a
                        key={`${s.platform}-${idx}`}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label || `Follow on ${s.platform}`}
                        data-anim="social"
                        className="w-10 h-10 rounded-md bg-[#222222] flex items-center justify-center text-gray-300 hover:bg-[#007074] hover:text-white transition-all duration-300"
                      >
                        <Icon size={18} aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>

        {/* Bottom Bar (Divider, Copyright, Legal, Payments) */}
        <div data-anim="bottom" className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

          <div className="text-gray-500 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} {footer?.copyright || 'All Rights Reserved.'}
          </div>

          {legalLinks.length > 0 && (
            <div className="flex items-center space-x-6 text-gray-500 text-xs">
              {legalLinks.map((link, idx) => (
                <Link
                  key={`${link.label}-${idx}`}
                  to={link.path}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {paymentBadges.length > 0 && (
            <div className="flex items-center space-x-2">
              {paymentBadges.map((badge, idx) => (
                <div
                  key={`${badge.label}-${idx}`}
                  className={`bg-[#222222] border border-gray-700 text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${
                    badge.tone === 'accent' ? 'text-[#007074]' : 'text-gray-400'
                  }`}
                >
                  {badge.label}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </footer>
  );
}
