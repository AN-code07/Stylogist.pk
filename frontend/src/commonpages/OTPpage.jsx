import React, { useState, useEffect, useRef } from 'react';
import { FiArrowRight, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ComonButton from './ComonButton';
import { useVerifyOTP, useRequestOTP } from '../features/auth/useAuthHooks';
import toast from 'react-hot-toast';

export default function EnterOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  // const [activeOTPIndex, setActiveOTPIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRef = useRef([]);

  const email = location.state?.email;
  const flow = location.state?.flow || 'registration';


  const { mutate: verifyOTP, isPending: isVerifying } = useVerifyOTP();
  const { mutate: resendOTP } = useRequestOTP();

  // Auto-focus the first input on load
  useEffect(() => {
    inputRef.current[0]?.focus();
  }, []);

  // Resend Timer Logic
  useEffect(() => {
    const interval = timer > 0 && setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = ({ target }, index) => {
    const { value } = target;
    if (isNaN(value)) return; // Only allow numbers

    const newOtp = [...otp];
    // Take only the last character in case they type fast
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle Backspace auto-rewind
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).trim();
    if (isNaN(pastedData)) return;

    const pastedArray = pastedData.split("");
    const newOtp = [...otp];
    pastedArray.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus the last filled input
    const focusIndex = pastedArray.length < 6 ? pastedArray.length : 5;
    inputRef.current[focusIndex]?.focus();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) return;

    if (!email) {
      toast.error("Missing email context. Please restart the flow.");
      navigate(flow === 'reset' ? '/forgot-password' : '/signup');
      return;
    }

    verifyOTP({ email, otp: otpValue }, {
      onSuccess: () => {
        if (flow === 'reset') {
          toast.success("Code verified. Set your new password.");
          navigate('/reset-password', { state: { email } });
        } else {
          toast.success("Account verified! Please sign in.");
          navigate('/login');
        }
      }
    });
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(new Array(6).fill(""));
    inputRef.current[0]?.focus();

    // Trigger the resend hook
    resendOTP({ email });
  };
  return (
    // Strict Screen Lock: Matches Login/Signup exactly
    <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFB] overflow-hidden p-4 sm:p-6 font-sans">

      {/* Scaled Inner Container */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl h-full max-h-[850px] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl sm:rounded-[2.5rem] overflow-hidden">

        {/* --- LEFT SIDE: BRANDING (45%) --- */}
        <div className="hidden lg:flex w-[45%] relative flex-col justify-end p-10 overflow-hidden border-r border-slate-100">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full object-cover scale-105"
              alt="Fashion Security"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#007074] via-[#007074]/80 to-transparent z-10" />

          <div className="relative z-20 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <span className="text-white text-xl font-serif font-black">S</span>
              </div>
              <span className="text-white text-lg font-bold tracking-[0.2em] uppercase">tylogist</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-serif font-black text-white leading-tight">
              Secure <br /> <span className="text-[#FCD9B8] italic">Verification.</span>
            </h1>
            <p className="text-white/90 text-sm font-medium leading-relaxed max-w-xs">
              We employ military-grade encryption to ensure your data and purchases remain strictly confidential.
            </p>
          </div>
        </div>

        {/* --- RIGHT SIDE: OTP FORM (55%) --- */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-12 xl:px-20 bg-white relative h-full">

          <div className="absolute top-6 right-6 hidden sm:flex items-center gap-1.5 opacity-40">
            <ShieldCheck className="text-[#007074]" size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Encrypted</span>
          </div>

          <div className="w-full max-w-md mx-auto">

            <header className="mb-8 text-center lg:text-left">
              <div className="w-12 h-12 bg-teal-50 text-[#007074] rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0 shadow-inner">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enter Secure Code</h2>
              <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                We've dispatched a 6-digit confirmation code to your registered email address.
              </p>
            </header>

            <form onSubmit={handleVerify} className="space-y-8">

              {/* High-Contrast OTP Grid */}
              <div className="flex justify-between items-center gap-2 sm:gap-3">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(el) => (inputRef.current[index] = el)}
                    value={data}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all outline-none 
                      ${data ? 'border-[#007074] bg-white text-[#007074] shadow-md' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-[#007074] focus:bg-white focus:shadow-md'}`
                    }
                  />
                ))}
              </div>

              <ComonButton
                btntitle={isSubmitting ? "Verifying..." : "Confirm Identity"}
                padding="py-4"
                icon={<FiArrowRight />}
                disabled={isSubmitting || otp.join("").length < 6}
              />
            </form>

            {/* Resend Logic & Navigation */}
            <div className="mt-8 flex flex-col items-center justify-center gap-6">

              {timer > 0 ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-not-allowed">
                  Resend code in <span className="text-slate-900">00:{timer.toString().padStart(2, '0')}</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className=" cursor-pointer flex items-center gap-2 text-xs font-bold text-[#007074] uppercase tracking-widest hover:text-[#005a5d] transition-colors"
                >
                  <FiRefreshCw className="animate-spin-slow" /> Resend Code Now
                </button>
              )}

              <div className="w-full border-t border-slate-100"></div>

              <Link to="/login" className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors group">
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Sign In
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}