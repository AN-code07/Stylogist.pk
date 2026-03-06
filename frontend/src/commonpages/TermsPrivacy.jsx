import React from "react";

export default function TermsPrivacy() {
  return (
    <section className="w-full bg-[#F7F3F0] py-16 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-14">

        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#222222]">
            Terms of Service & <span className="text-[#007074]">Privacy Policy</span>
          </h1>
          <p className="text-gray-500 mt-3 text-sm md:text-base">
            Please read our terms carefully before using Stylogist.pk
          </p>
        </div>

        {/* ===================== */}
        {/* TERMS OF SERVICE */}
        {/* ===================== */}
        <div>
          <h2 className="text-2xl font-bold text-[#222222] mb-3">
            Terms of Service
          </h2>

          <div className="w-16 h-1 bg-[#007074] mb-6 rounded"></div>

          <div className="text-gray-600 space-y-4 leading-relaxed text-sm md:text-base">
            <p>
              Welcome to Stylogist.pk. By accessing or using our website,
              you agree to comply with and be bound by the following terms
              and conditions.
            </p>

            <p>
              These terms apply to all users of the platform including
              customers, vendors, and visitors browsing our online store.
            </p>

            <p>
              Users must provide accurate personal information while creating
              accounts and are responsible for maintaining the confidentiality
              of their login credentials.
            </p>

            <p>
              Stylogist.pk reserves the right to cancel orders, restrict
              accounts, or refuse service if fraudulent or abusive behavior
              is detected.
            </p>

            <p>
              We may update these terms from time to time. Continued use of
              the platform after updates means you accept the revised terms.
            </p>
          </div>
        </div>

        {/* ===================== */}
        {/* PRIVACY POLICY */}
        {/* ===================== */}
        <div>
          <h2 className="text-2xl font-bold text-[#222222] mb-3">
            Privacy Policy
          </h2>

          <div className="w-16 h-1 bg-[#007074] mb-6 rounded"></div>

          <div className="text-gray-600 space-y-4 leading-relaxed text-sm md:text-base">
            <p>
              At Stylogist.pk, protecting your personal information is one
              of our top priorities. We are committed to safeguarding your
              privacy while providing a secure shopping experience.
            </p>

            <p>
              When you create an account or place an order, we may collect
              personal details such as your name, email address, phone number,
              and shipping address.
            </p>

            <p>
              This information is used only to process orders, improve our
              services, and provide better customer support.
            </p>

            <p>
              Stylogist.pk does not sell or share your personal information
              with third parties except for essential services such as
              payment processing, shipping partners, or legal obligations.
            </p>

            <p>
              We use secure encryption and modern security practices to ensure
              that your personal data remains protected.
            </p>

            <p>
              By using our website, you agree to the collection and use of
              information in accordance with this privacy policy.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}