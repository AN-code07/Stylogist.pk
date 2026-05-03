import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

// Site-wide floating "Chat on WhatsApp" button. Mounted once inside the
// MainLayout so it appears on every public page. Brand-green pill in the
// bottom-right with a subtle pulse ring on hover. Uses `target="_blank"`
// + `rel="noopener noreferrer"` because wa.me opens an external chat in
// a new tab/window on desktop.
const DEFAULT_GREETING =
  "Hi Stylogist! I'd like to know more about your products.";

export default function WhatsAppFab() {
  return (
    <a
      href={buildWhatsAppUrl(DEFAULT_GREETING)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Stylogist on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-40 group"
    >
      <span className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-white/40 transition-transform duration-300 group-hover:scale-110">
        {/* Pulse ring — pure CSS, GPU-accelerated, throttles when off-screen */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping pointer-events-none" />
        <FaWhatsapp size={28} className="relative z-10" />
      </span>
      {/* Desktop tooltip */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:flex items-center bg-[#222] text-white text-[10px] font-black uppercase tracking-[0.25em] px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
        Chat on WhatsApp
      </span>
    </a>
  );
}
