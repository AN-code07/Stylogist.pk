import React, { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { ShieldCheck } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import ComonButton from './ComonButton';
import { useSignup } from '../features/auth/useAuthHooks';
import { useLocation } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', agree: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: signup, isPending, isError, error } = useSignup();

  // ...
  const location = useLocation();
  const email = location.state?.email;

  console.log("email", email);


  // Real-time Validation Engine
  const validate = (name, value) => {
    let error = "";
    if (name === "name" && value.length < 3) error = "Name required";
    if (name === "email" && !/\S+@\S+\.\S+/.test(value)) error = "Invalid email";
    if (name === "phone" && !/^((\+92)|(03))\d{9}$/.test(value)) error = "03xxxxxxxxx";
    if (name === "password") {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!strongPasswordRegex.test(value)) {
        // Kept short so it fits perfectly in your UI without breaking the layout
        error = "8+ chars, 1 Upper, 1 Lower, 1 Num, 1 Symbol";
      }
    }
    if (name === "confirmPassword" && value !== formData.password) error = "Mismatch";

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: finalValue });
    if (type !== 'checkbox') validate(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(errors).some(x => x !== "") || !formData.agree) return;

    signup({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    });

    setIsSubmitting(true);
    // Backend Logic Here
    console.log("MERN Payload:", formData);
    setTimeout(() => setIsSubmitting(false), 2000);
  };



  return (
    // Strict Screen Lock: Prevents overall page scrolling
    <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFB] overflow-hidden p-4 sm:p-6">

      {/* Scaled Inner Container: Max height limits ensure it fits laptops perfectly */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl h-full max-h-[850px] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl sm:rounded-[2.5rem] overflow-hidden">

        {/* --- LEFT SIDE: BRANDING --- */}
        <div className="hidden lg:flex w-[45%] relative flex-col justify-end p-10 overflow-hidden border-r border-slate-100">
          <div className="absolute inset-0 z-0">
            <img
              src="https://img.freepik.com/premium-photo/colorful-paper-shopping-bag_1273586-38616.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80"
              className="w-full h-full object-cover scale-105"
              alt="Stylogist"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#007074] via-[#007074]/70 to-transparent z-10" />

          <div className="relative z-20 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <span className="text-white text-xl font-serif font-black">S</span>
              </div>
              <span className="text-white text-lg font-bold tracking-[0.2em] uppercase">tylogist</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-serif font-black text-white leading-tight">
              Elevate Your <br /> <span className="text-[#FCD9B8] italic">Persona.</span>
            </h1>
            <p className="text-white/90 text-sm font-medium leading-relaxed max-w-xs">
              Experience Pakistan's first boutique-centric e-commerce engine.
            </p>
          </div>
        </div>

        {/* --- RIGHT SIDE: FORM (Responsive & Scroll-Free) --- */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-12 xl:px-20 bg-white relative h-full">

          <div className="absolute top-6 right-6 hidden sm:flex items-center gap-1.5 opacity-40">
            <ShieldCheck className="text-[#007074]" size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Encrypted</span>
          </div>

          <div className="w-full max-w-md mx-auto">

            <header className="mb-6 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1.5">
                Join HarbalMart.pk today
              </p>
            </header>

            {/* Tightened vertical spacing (space-y-3.5) */}
            <form onSubmit={handleSubmit} className="space-y-3.5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <InputField icon={FiUser} name="name" placeholder="Full Name" value={formData.name} error={errors.name} onChange={handleChange} />
                <InputField icon={FiPhone} name="phone" placeholder="03xxxxxxxxx" value={formData.phone} error={errors.phone} onChange={handleChange} />
              </div>

              <InputField icon={FiMail} name="email" placeholder="Email Address" value={formData.email} error={errors.email} onChange={handleChange} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Password Box */}
                <div className="space-y-1 group w-full">
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-4 py-3 transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-[#007074] focus-within:bg-white focus-within:shadow-md'}`}>
                    <FiLock className={`${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#007074]'} transition-colors`} size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      onChange={handleChange}
                      className="w-full bg-transparent ml-3 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-[#007074]">
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-black text-red-500 uppercase ml-1 absolute">{errors.password}</p>}
                </div>

                {/* Confirm Password Box */}
                <div className="space-y-1 group w-full">
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-4 py-3 transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-[#007074] focus-within:bg-white focus-within:shadow-md'}`}>
                    <FiLock className={`${errors.confirmPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#007074]'} transition-colors`} size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm"
                      autoComplete="new-password"
                      onChange={handleChange}
                      className="w-full bg-transparent ml-3 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] font-black text-red-500 uppercase ml-1 absolute">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms - Reduced padding */}
              <div className="flex items-center gap-2.5 pt-1 pb-2">
                <input type="checkbox" name="agree" id="agree" onChange={handleChange} className="w-4 h-4 accent-[#007074] cursor-pointer" />
                <label htmlFor="agree" className="text-[11px] font-bold text-slate-500 cursor-pointer">
                  I accept the <Link to="/terms" className="text-[#007074] hover:underline">Terms</Link> and Privacy Policy
                </label>
              </div>

              <ComonButton
                btntitle={isSubmitting ? "Processing..." : "Create Account"}
                padding="py-3.5"
                icon={<FiArrowRight />}
                disabled={isSubmitting}
              />
            </form>

            {/* OR DIVIDER & SOCIAL LOGIN - Tighter spacing */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-5">
                <div className="w-full border-t border-slate-200"></div>
                <span className="absolute bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Sign Up With</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <SocialBtn img="https://cdn-icons-png.flaticon.com/512/300/300221.png" label="Google" />
                <SocialBtn img="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" label="Facebook" />
                <SocialBtn img="https://cdn-icons-png.flaticon.com/512/0/747.png" label="Apple" />
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-[#007074] transition-colors">
                Already registered? <span className="text-[#007074] underline underline-offset-4 font-black ml-1">Sign In</span>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Highly Visible Input Component
const InputField = ({ icon: Icon, name, placeholder, value, error, onChange }) => (
  <div className="space-y-1 group w-full relative">
    <div className={`flex items-center bg-slate-50 border rounded-xl px-4 py-3 transition-all ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-[#007074] focus-within:bg-white focus-within:shadow-md'}`}>
      <Icon className={`${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#007074]'} transition-colors`} size={16} />
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent ml-3 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
      />
    </div>
    {/* Absolute positioning prevents errors from shifting the layout up and down */}
    {error && <p className="text-[10px] font-black text-red-500 uppercase ml-1 absolute -bottom-4">{error}</p>}
  </div>
);

// High Contrast Social Buttons
const SocialBtn = ({ img, label }) => (
  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-2 bg-white border border-slate-200 rounded-xl hover:border-[#007074] hover:bg-teal-50/30 transition-all duration-300 active:scale-95 group">
    <img src={img} className="w-4 h-4 object-contain" alt={label} />
    <span className="hidden sm:inline-block text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-[#007074]">{label}</span>
  </button>
);