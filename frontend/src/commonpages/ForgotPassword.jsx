import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiZap, FiChevronRight } from "react-icons/fi";
import { useForgotPassword } from "../features/auth/useAuthHooks"; // IMPORT HOOK
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // 1. Initialize Forgot Password Hook
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    // 2. Trigger the real API (this will navigate to /verify-otp on success)
    forgotPassword({ email });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center font-sans text-[#222] p-4 overflow-hidden relative">
      
      {/* Background Decorative Orbs - Reduced Opacity */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#007074]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#007074]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card - Tightened width from XL to MD (max-w-md) */}
      <div className="w-full max-w-md bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden border border-gray-100 relative z-10 animate-[slideUp_0.6s_ease-out]">
        
        {/* Luxury Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#007074] via-teal-400 to-[#007074]" />

        <div className="p-8 md:p-10">
          {/* Header - Scaled Down */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-[#007074]/10 text-[#007074] text-[8px] font-black tracking-[0.2em] uppercase mb-4">
              <FiZap className="animate-pulse" /> Security
            </div>
            <h2 className="text-3xl font-serif font-black tracking-tight mb-3">
              Forgot <span className="italic text-[#007074]">Password?</span>
            </h2>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest max-w-[220px] mx-auto leading-relaxed">
              Verify your digital identity to reset credentials.
            </p>
          </div>

          {/* Form - Verified Functional */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group space-y-3">
              <label className={`text-[12px] font-black uppercase tracking-widest transition-colors duration-300 ${isFocused ? 'text-[#007074]' : 'text-gray-500'}`}>
                Email Address
              </label>
              
              <div className="relative">
                {/* Active Focus Glow */}
                <div className={`absolute inset-0 bg-[#007074] rounded-xl blur-md opacity-0 transition-opacity duration-500 ${isFocused ? 'opacity-10' : ''}`} />
                
                <FiMail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-20 pointer-events-none ${isFocused ? 'text-[#007074]' : 'text-gray-300'}`} size={16} />
                
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@HarbalMart.pk"
                  value={email}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setEmail(e.target.value)} // Fully Enabled Input
                  className="relative w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl text-xs font-bold text-[#222] outline-none focus:ring-2 focus:ring-[#007074]/10 focus:bg-white transition-all shadow-md z-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="group w-full bg-[#222] text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#007074] shadow-lg hover:shadow-[#007074]/30 transition-all duration-500 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? "Sending OTP..." : "Request OTP"}
              <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Footer - Minimalist Grid */}
          <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
            <Link
              to="/login"
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 hover:text-[#007074] transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Sign In
            </Link>

            <Link
              to="/signup"
              className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 hover:text-[#222] transition-colors"
            >
              Create <span className="text-[#007074]">Account</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
}