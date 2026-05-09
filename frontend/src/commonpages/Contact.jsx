import React from 'react';
import { 
  FiMapPin, FiPhone, FiMail, FiSend, FiHeadphones, FiZap, FiChevronRight, FiClock, FiShield 
} from 'react-icons/fi';
import { FaWhatsapp, FaInstagram, FaFacebookF } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Contact() {
  const customStyles = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    .animate-reveal { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `;

  return (
    <div className="w-full bg-[#FDFDFD] font-sans pb-20 overflow-hidden relative">
      <style>{customStyles}</style>

      {/* ========================================= */}
      {/* CINEMATIC HERO SECTION                    */}
      {/* ========================================= */}
      <section className="relative w-full h-[500px] lg:h-[60vh] flex items-center justify-center overflow-hidden bg-[#111]">
        <img 
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 animate-[slowZoom_20s_linear_infinite alternate]"
          alt="Contact Header"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#007074]/30 via-transparent to-[#FDFDFD]" />
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <div className="animate-reveal [animation-delay:200ms] inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[12px] font-black tracking-[0.3em] uppercase mb-8">
            <FiHeadphones className="text-[#007074] animate-pulse" /> Client Concierge
          </div>
          <h1 className="animate-reveal [animation-delay:400ms] text-5xl md:text-7xl font-serif font-black text-gray-400 leading-tight tracking-tighter mb-6">
            Get in <span className="italic text-[#007074]">Touch.</span>
          </h1>
          <p className="animate-reveal lg:hidden [animation-delay:600ms] text-white lg:text-gray-500 text-sm md:text-base uppercase tracking-widest font-medium max-w-2xl mx-auto">
            From neural styling advice to order tracking, our team is ready to curate your experience.
          </p>
        </div>
      </section>

      {/* ========================================= */}
      {/* MAIN INTERFACE: FORM & INFO               */}
      {/* ========================================= */}
      <div className="container mx-auto px-6 max-w-6xl -mt-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT: PREMIUM CONCIERGE FORM */}
          <div className="lg:col-span-7 bg-white rounded-md lg:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-reveal [animation-delay:800ms]">
            <div className="bg-[#222] p-8 md:p-12 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#007074]/20 rounded-full blur-3xl" />
               <h3 className="text-xl lg:text-2xl lg:font-serif lg:font-black mb-2 relative z-10">Send an Inquiry</h3>
               <p className="text-gray-400 text-[10px] lg:text-[12px] font-black uppercase tracking-[0.2em] relative z-10">Average response time: 2 Hours</p>
            </div>

            <form className="p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                <div className="group space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-widest text-gray-700 group-focus-within:text-[#007074] transition-colors">Full Name</label>
                  <input type="text" placeholder="Javeria Khan" className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 text-sm  focus:ring-2 shadow-lg focus:ring-[#007074]/20 outline-none transition-all" />
                </div>
                <div className="group space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-widest text-gray-700 group-focus-within:text-[#007074] transition-colors">Email Address</label>
                  <input type="email" placeholder="concierge@HarbalMart.pk" className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 text-sm focus:ring-2 shadow-lg focus:ring-[#007074]/20 outline-none transition-all" />
                </div>
              </div>

              <div className="group space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-gray-700 group-focus-within:text-[#007074] transition-colors">Inquiry Type</label>
                <select className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 text-sm focus:ring-2 shadow-lg focus:ring-[#007074]/20 outline-none transition-all appearance-none cursor-pointer">
                  <option>Order Tracking</option>
                  <option>Neural Style Consultation</option>
                  <option>Returns & Exchanges</option>
                  <option>Wholesale Inquiry</option>
                </select>
              </div>

              <div className="group space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-gray-700 group-focus-within:text-[#007074] transition-colors">Your Message</label>
                <textarea rows="4" placeholder="How can we elevate your journey?" className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm focus:ring-2 shadow-lg focus:ring-[#007074]/20 outline-none transition-all resize-none" />
              </div>

              <button className="w-full bg-[#222] text-white  py-3 lg:py-5 rounded-full lg:font-black lg:uppercase tracking-[0.3em] text-[11px] hover:bg-[#007074] shadow-xl hover:shadow-[#007074]/40 transition-all duration-500 active:scale-95 flex items-center justify-center gap-3">
                Dispatch Inquiry <FiSend size={16} />
              </button>
            </form>
          </div>

          {/* RIGHT: FRAMED INFO CARDS */}
          <div className="lg:col-span-5  space-y-3 lg:space-y-6 animate-reveal [animation-delay:1000ms]">
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#007074]/5 rounded-bl-[5rem]" />
              <h3 className="lg:text-xl  font-serif font-black text-[#222] mb-10">The Hub</h3>

              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1  lg:space-y-10">
                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#222] group-hover:bg-[#007074] group-hover:text-white transition-all shadow-md">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-[12px] lg:ext-[12px] font-black uppercase tracking-widest text-[#007074] mb-2">Headquarters</h4>
                    <p className="text-[10px] lg:text-sm font-medium text-gray-500 leading-relaxed">Stylogist Digital Studio <br/>Commercial Hub, Bahawalpur<br/>Punjab, Pakistan</p>
                  </div>
                </div>

                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#222] group-hover:bg-[#007074] group-hover:text-white transition-all shadow-md">
                    <FiPhone size={20} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-[#007074] mb-2">Direct Line</h4>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed">+92 300 123 4567<br/><span className="text-[12px] text-gray-700">Mon-Sat, 9AM - 6PM</span></p>
                  </div>
                </div>

                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#222] group-hover:bg-[#007074] group-hover:text-white transition-all shadow-md">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-[#007074] mb-2">Digital Mail</h4>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed">concierge@HarbalMart.pk</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700">Follow The Story</span>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-700 hover:text-[#007074] transition-colors"><FaWhatsapp size={20} /></a>
                  <a href="#" className="text-gray-700 hover:text-[#007074] transition-colors"><FaInstagram size={20} /></a>
                  <a href="#" className="text-gray-700 hover:text-[#007074] transition-colors"><FaFacebookF size={18} /></a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MAP SHOWCASE */}
      <div className="container mx-auto px-6 mt-10 animate-reveal [animation-delay:1200ms]">
        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px] border-white h-80 grayscale hover:grayscale-0 transition-all duration-1000">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110502.6038503112!2d71.61118165039327!3d29.3957211186716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x393b90c490ef4315%3A0x926de2f748039755!2sBahawalpur%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1741270000000!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Stylogist Hub"
          ></iframe>
        </div>
      </div>
    </div>
  );
}