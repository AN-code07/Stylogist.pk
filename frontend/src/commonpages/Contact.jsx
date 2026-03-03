import React from 'react';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiSend,
  FiBox,
  FiTruck,
  FiRefreshCcw,
  FiClock,
  FiCheckCircle,
  FiMessageCircle,
  FiHeadphones
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';

export default function Contact() {
  return (
    <div className="w-full bg-[#F7F3F0] font-sans pb-10">

      {/* ========================================= */}
      {/* HERO SECTION WITH YOUR COLOR SCHEME */}
      {/* ========================================= */}
      <div className="w-full bg-gradient-to-br from-[#222222] via-[#2a2a2a] to-[#1a1a1a] pt-20 pb-32 px-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#007074]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B08463]/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <FiHeadphones className="text-[#007074]" />
            <p className="text-[#F7F3F0] text-xs font-bold tracking-widest uppercase">
              Stylogist Client Services
            </p>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-serif mb-6">
            Get in <span className="text-[#007074]">Touch</span>
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            From styling advice to order inquiries, our dedicated concierges are available
            to provide you with an exceptional shopping experience.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <FiCheckCircle className="text-[#007074]" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <FiClock className="text-[#007074]" />
              <span>Reply within 2 hours</span>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MAIN CONTENT - FLOATING CARD DESIGN */}
      {/* ========================================= */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl -mt-24 relative z-20">
        <div className="grid grid-cols-1 items-center lg:grid-cols-12 gap-8">

          {/* LEFT: Contact Form with Teal Accents */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#007074] to-[#005a5e] p-8">
              <h3 className="text-2xl font-bold text-white font-serif mb-2">Send an Inquiry</h3>
              <p className="text-white/80 text-sm">We aim to reply to all inquiries within 12 business hours.</p>
            </div>

            <form className="p-8 md:p-10 space-y-6">
              {/* Name & Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#B08463] uppercase tracking-widest mb-2">
                    Full Name <span className="text-[#007074]">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#F7F3F0] border-2 border-transparent rounded-xl py-3 px-4 text-sm text-[#222222] focus:outline-none focus:border-[#007074] transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B08463] uppercase tracking-widest mb-2">
                    Email Address <span className="text-[#007074]">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[#F7F3F0] border-2 border-transparent rounded-xl py-3 px-4 text-sm text-[#222222] focus:outline-none focus:border-[#007074] transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Phone & Order Number Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#B08463] uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full bg-[#F7F3F0] border-2 border-transparent rounded-xl py-3 px-4 text-sm text-[#222222] focus:outline-none focus:border-[#007074] transition-all"
                    placeholder="+92 XXX XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B08463] uppercase tracking-widest mb-2">Order Number</label>
                  <input
                    type="text"
                    className="w-full bg-[#F7F3F0] border-2 border-transparent rounded-xl py-3 px-4 text-sm text-[#222222] focus:outline-none focus:border-[#007074] transition-all"
                    placeholder="#STYL-123456"
                  />
                </div>
              </div>

              {/* Inquiry Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#B08463] uppercase tracking-widest mb-2">Inquiry Type</label>
                <select className="w-full bg-[#F7F3F0] border-2 border-transparent rounded-xl py-3 px-4 text-sm text-[#222222] focus:outline-none focus:border-[#007074] transition-all cursor-pointer appearance-none">
                  <option value="">Select a topic...</option>
                  <option value="shipping">🚚 Shipping & Delivery</option>
                  <option value="returns">🔄 Returns & Exchanges</option>
                  <option value="product">👕 Product Information</option>
                  <option value="order">📦 Order Status</option>
                  <option value="other">💬 Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-[#B08463] uppercase tracking-widest mb-2">Message</label>
                <textarea
                  rows="4"
                  className="w-full bg-[#F7F3F0] border-2 border-transparent rounded-xl p-4 text-sm text-[#222222] focus:outline-none focus:border-[#007074] transition-all resize-none"
                  placeholder="How can we help you today?"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="group w-full bg-gradient-to-r from-[#007074] to-[#005a5e] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-[#007074]/30 hover:scale-[1.02] transition-all duration-300 active:scale-95 flex items-center justify-center space-x-3"
              >
                <span>Submit Request</span>
                <FiSend className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Live Chat Option */}
              <p className="text-center text-xs text-gray-500 mt-4">
                Need immediate assistance? <a href="#" className="text-[#007074] font-semibold hover:underline">Start Live Chat</a>
              </p>
            </form>
          </div>

          {/* RIGHT: Contact Info with Map */}
          <div className="lg:col-span-5 space-y-6">
            {/* Contact Cards */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-[#222222] font-serif mb-6">Contact Information</h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4 group hover:bg-[#F7F3F0] p-3 rounded-xl transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#007074]/10 flex items-center justify-center text-[#007074] group-hover:bg-[#007074] group-hover:text-white transition-all">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-[#222222] text-sm font-bold uppercase tracking-wider mb-1">Headquarters</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Stylogist Digital Hub<br />
                      Commercial Area, Bahawalpur<br />
                      Punjab, Pakistan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group hover:bg-[#F7F3F0] p-3 rounded-xl transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#007074]/10 flex items-center justify-center text-[#007074] group-hover:bg-[#007074] group-hover:text-white transition-all">
                    <FiPhone size={20} />
                  </div>
                  <div>
                    <h4 className="text-[#222222] text-sm font-bold uppercase tracking-wider mb-1">Phone Support</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      +92 300 123 4567<br />
                      <span className="text-xs text-[#B08463]">Mon-Sat, 9AM to 6PM PKT</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group hover:bg-[#F7F3F0] p-3 rounded-xl transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#007074]/10 flex items-center justify-center text-[#007074] group-hover:bg-[#007074] group-hover:text-white transition-all">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <h4 className="text-[#222222] text-sm font-bold uppercase tracking-wider mb-1">Email</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      support@stylogist.pk<br />
                      returns@stylogist.pk
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-[#B08463] uppercase tracking-wider mb-3">Connect With Us</p>
                <div className="flex items-center space-x-3">
                  <a href="#" className="w-10 h-10 bg-[#F7F3F0] rounded-xl flex items-center justify-center text-[#007074] hover:bg-[#007074] hover:text-white transition-all">
                    <FaWhatsapp size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-[#F7F3F0] rounded-xl flex items-center justify-center text-[#007074] hover:bg-[#007074] hover:text-white transition-all">
                    <FaFacebookF size={16} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-[#F7F3F0] rounded-xl flex items-center justify-center text-[#007074] hover:bg-[#007074] hover:text-white transition-all">
                    <FaInstagram size={18} />
                  </a>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
      {/* Map Card */}
      <div className="bg-white mt-3 rounded-md shadow-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-[#007074] to-[#005a5e]">
          <h4 className="text-white font-semibold flex items-center space-x-2">
            <FiMapPin />
            <span>Our Location</span>
          </h4>
        </div>
        <div className="h-64 w-full">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.123456789!2d71.123456!3d29.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x393b4f53528b8a75%3A0xc354b1f6187db1c3!2sBahawalpur%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Stylogist Location Map"
          ></iframe>
        </div>
      </div>

    </div>
  );
}