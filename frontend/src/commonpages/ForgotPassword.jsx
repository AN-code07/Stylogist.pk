import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // later connect API here
    console.log("Reset link sent to:", email);
  };

  return (
    <div className="min-h-screen bg-[#F7F3F0] flex items-center justify-center px-4">
      
      <div className="w-full max-w-md bg-white shadow-lg shadaow-[#007074] rounded-xl p-8 border border-gray-100">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#222222]">
            Forgot <span className="text-[#007074]">Password</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Enter your email and we’ll send you a password reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email Input */}
          <div>
            <label className="text-sm font-semibold text-[#222222] block mb-2">
              Email Address
            </label>

            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#007074] outline-none text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#007074] hover:bg-[#005d60] text-white font-semibold py-3 rounded-lg transition-all duration-300"
          >
            Send Reset Link
          </button>

        </form>

        {/* Footer Links */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-[#007074] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </div>

        <div className="text-center mt-3 text-sm text-gray-500">
          New to Stylogist?{" "}
          <Link
            to="/signup"
            className="text-[#007074] font-semibold hover:underline"
          >
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}