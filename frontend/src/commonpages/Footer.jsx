import React, { useEffect, useRef, memo } from 'react';
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
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logo from '/logo.png';
import { useSiteSettings } from '../features/settings/useSettingsHooks';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

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

// Memoized to prevent re-renders on parent state changes
const Footer = memo(function Footer() {
  const { data } = useSiteSettings();
  const footer = data?.footer;
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !footer) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;

    // Targets
    const brand = root.querySelector('[data-anim="brand"]');
    const cols = root.querySelectorAll('[data-anim="col"]');
    const socials = root.querySelectorAll('[data-anim="social"]');
    const bottom = root.querySelector('[data-anim="bottom"]');
    const cta = root.querySelector('[data-anim="cta"]');

    // Initial State (Clean Paint)
    gsap.set([brand, cols, bottom], { opacity: 0, y: 30 });
    gsap.set(socials, { opacity: 0, scale: 0.8 });

    // 1. ENTRANCE ANIMATION (Scroll-Triggered)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top 90%", // Starts when footer is 10% visible
        toggleActions: "play none none none"
      }
    });

    tl.to(brand, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
      .to(cols, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power2.out" }, "-=0.5")
      .to(socials, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.3")
      .to(bottom, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2");

    // 2. CONTINUOUS "ALIVE" EFFECTS
    // Gentle pulse on Newsletter CTA
    const pulse = gsap.to(cta, {
      boxShadow: '0 0 0 8px rgba(0,112,116,0.15)',
      scale: 1.04,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Gentle float on Social Icons
    const float = gsap.to(socials, {
      y: -4,
      duration: 2,
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.2, from: "random" },
      ease: "sine.inOut"
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      tl.kill();
      pulse.kill();
      float.kill();
    };
  }, [footer]); // Only re-run if footer data actually loads/changes

  const shopLinks = footer?.shopLinks || [];
  const customerCareLinks = footer?.customerCareLinks || [];
  const legalLinks = footer?.legalLinks || [];
  const socials = footer?.socials || [];
  const paymentBadges = footer?.paymentBadges || [];

  return (
    <footer ref={rootRef} className="w-full bg-[#111111] text-white pt-20 pb-10 border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">

          {/* Brand Info */}
          <div data-anim="brand" className="lg:col-span-4 will-change-transform">
            <Link to="/" className="inline-flex items-center group mb-8">
              <img
                src={logo}
                alt="HarbalMart.pk"
                width="200"
                height="50"
                className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </Link>
            {footer?.brandTagline && (
              <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm font-light">
                {footer.brandTagline}
              </p>
            )}

            <div className="space-y-4">
              {footer?.address && (
                <div className="flex items-center space-x-3 text-gray-400 group cursor-default">
                  <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#007074] transition-colors group-hover:bg-[#007074] group-hover:text-white">
                    <FiMapPin size={16} />
                  </div>
                  <span className="text-xs uppercase tracking-widest">{footer.address}</span>
                </div>
              )}
              {footer?.phone && (
                <a href={`tel:${footer.phone}`} className="flex items-center space-x-3 text-gray-400 group transition-colors hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#007074] transition-colors group-hover:bg-[#007074] group-hover:text-white">
                    <FiPhoneCall size={16} />
                  </div>
                  <span className="text-xs uppercase tracking-widest">{footer.phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Links Columns */}
          <div data-anim="col" className="lg:col-span-2 will-change-transform">
            <h3 className="text-[10px] font-black text-[#007074] uppercase tracking-[0.3em] mb-8">Collections</h3>
            <ul className="space-y-4">
              {shopLinks.map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-gray-400 text-xs uppercase tracking-wider hover:text-white transition-all hover:translate-x-2 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div data-anim="col" className="lg:col-span-2 will-change-transform">
            <h3 className="text-[10px] font-black text-[#007074] uppercase tracking-[0.3em] mb-8">Help Desk</h3>
            <ul className="space-y-4">
              {customerCareLinks.map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-gray-400 text-xs uppercase tracking-wider hover:text-white transition-all hover:translate-x-2 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div data-anim="col" className="lg:col-span-4 will-change-transform">
            <h3 className="text-[10px] font-black text-[#007074] uppercase tracking-[0.3em] mb-8">Newsletter</h3>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-6">Get early access to drops & deals.</p>

            <form className="mb-10" onSubmit={(e) => e.preventDefault()}>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="w-full bg-transparent border-b border-gray-800 py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-[#007074] transition-colors"
                />
                <button
                  type="submit"
                  data-anim="cta"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#007074] text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500"
                >
                  <FiArrowRight size={18} />
                </button>
              </div>
            </form>

            <div className="flex space-x-4">
              {socials.map((s, idx) => {
                const Icon = pickIcon(s.platform);
                return (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-anim="social"
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all duration-500 will-change-transform"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div data-anim="bottom" className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-8 will-change-transform">
          <p className="text-[9px] font-medium text-gray-600 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} {footer?.copyright || 'Stylogist Studio.'}
          </p>

          <div className="flex items-center space-x-8">
            {legalLinks.map((link, i) => (
              <Link key={i} to={link.path} className="text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#007074] transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {paymentBadges.map((badge, i) => (
              <div key={i} className="px-3 py-1 border border-white/10 rounded text-[8px] font-black tracking-tighter uppercase">
                {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;