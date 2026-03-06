import React from 'react';
import { FaStar } from 'react-icons/fa';

export default function TestimonialSlider() {
    // --- MOCK REVIEW DATA ---
    const reviews = [
        {
            id: 1,
            name: "Sarah Johnson",
            role: "Verified Buyer",
            text: "Since integrating this wardrobe into my daily routine, I've experienced a significant improvement in both comfort and confidence. The quality is unmatched.",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
        },
        {
            id: 2,
            name: "David Patel",
            role: "Fashion Enthusiast",
            text: "I've tested numerous premium brands in this category, but Stylogist stands out for its intuitive AI curation and comprehensive collection.",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        },
        {
            id: 3,
            name: "Emily Carter",
            role: "Loyal Customer",
            text: "The pieces we've ordered have surpassed our expectations, providing invaluable style and support as my personal aesthetic continues to grow.",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
        },
        {
            id: 4,
            name: "Marcus Thorne",
            role: "Verified Buyer",
            text: "Absolutely phenomenal craftsmanship. The checkout process was seamless, and the delivery was incredibly fast. I'll definitely be returning.",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
        },
        {
            id: 5,
            name: "Aisha Rahman",
            role: "Style Consultant",
            text: "I recommend this platform to all my clients. The attention to detail, fabric quality, and personalized sizing recommendations are truly next-level.",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
        }
    ];

    // Duplicate the array to create a seamless infinite loop
    const duplicatedReviews = [...reviews, ...reviews];

    return (
        <section className="relative w-full border-t-1 border-[#007074] bg-white py-10 overflow-hidden font-sans">


            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#007074 1px, transparent 1px), linear-gradient(90deg, #007074 1px, transparent 1px)',
                    backgroundSize: '80px 80px'
                }}
            ></div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">

                <div className="text-center mb-12 lg:mb-16 max-w-2xl mx-auto">
                    <h2 className="text-xl md:text-3xl font-semibold  font-serif text-[#222222] mb-2">
                        What People <span className='text-[#007074]'>Say</span>
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Discover what our satisfied customers have to say about their experience with our premium products and AI styling services.
                    </p>
                </div>

            </div>

         
            <div
                className="relative w-full flex overflow-hidden py-4 slider-container"
                style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
            >

                {/* The Scrolling Track */}
                <div className="flex w-max animate-testimonial-scroll gap-4 md:gap-6 px-3">

                    {duplicatedReviews.map((review, index) => (
                        <div
                            key={index}
                            // Fixed height added here: h-[320px] on mobile, h-[260px] on desktop to prevent breaking
                            className="w-[300px] md:w-[380px] h-[260px] bg-[#F7F3F0] p-6 rounded-2xl border  border-[#0070746b] hover:border-[#007074] transition-all duration-300 flex flex-col shadow-xl hover:shadow-lg shrink-0 cursor-pointer"
                        >
                            {/* Avatar */}
                            <img
                                src={review.avatar}
                                alt={review.name}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover mb-4 border-2 border-[#007074]/30"
                            />

                            {/* Name & Role */}
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h4 className="text-[#222222] text-base md:text-lg font-bold tracking-wide">{review.name}</h4>
                                    <p className="text-[#007074] text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">{review.role}</p>
                                </div>
                                <div className="flex text-yellow-400 text-sm mt-4">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                </div>
                            </div>

                            {/* Review Text */}
                            <p className="text-gray-600 text-xs md:text-sm leading-relaxed flex-1">
                                {review.text}
                            </p>

                        </div>
                    ))}

                </div>
            </div>

            {/* Custom Keyframes & Hover Pause Logic */}
            <style jsx="true">{`
        @keyframes scrollTestimonials {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-testimonial-scroll {
          /* Adjust the '40s' to make it scroll faster or slower */
          animation: scrollTestimonials 40s linear infinite;
        }
        
        /* THIS FIXES THE HOVER ISSUE */
        .slider-container:hover .animate-testimonial-scroll {
          animation-play-state: paused;
        }
      `}</style>

        </section>
    );
}