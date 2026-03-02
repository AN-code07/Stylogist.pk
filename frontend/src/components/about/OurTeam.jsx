import React from 'react';
import { FiLinkedin, FiTwitter, FiInstagram } from 'react-icons/fi';

export default function OurTeam() {
  const teamMembers = [
    {
      id: 1,
      name: "Zoya Rahman",
      role: "Founder & Creative Director",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Ali Hassan",
      role: "Lead AI Engineer",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "Sara Khan",
      role: "Head of Curation",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
    },
    {
      id: 4,
      name: "Omer Tariq",
      role: "Director of E-Commerce",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1974&auto=format&fit=crop",
    }
  ];

  return (
    <section className="w-full bg-[#F7F3F0] py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16">
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-0.5 bg-[#007074]"></span>
              <span className="text-[#007074] text-xs font-bold tracking-widest uppercase">
                The Minds Behind the Magic
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#222222] font-serif leading-tight">
              Meet The <span className="text-[#007074]">Visionaries</span>
            </h2>
          </div>
          <p className="text-gray-500 mt-4 md:mt-0 text-sm md:text-base max-w-md md:text-right">
            A diverse team of fashion experts, AI developers, and industry veterans dedicated to elevating your style.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <div key={member.id} className="group relative">
              
              {/* Image Container with Hover Effects */}
              <div className="relative w-full h-[300px]  overflow-hidden rounded-md shadow-md mb-5 bg-[#222222]">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover grayscale opacity-90 transition-all duration-700 ease-in-out group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                />
                
                {/* Social Links Overlay (Slides up on hover) */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#222222] to-transparent opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out flex justify-center space-x-4">
                  <a href="#" className="w-8 h-8 rounded-full bg-white text-[#222222] flex items-center justify-center hover:bg-[#007074] hover:text-white transition-colors">
                    <FiLinkedin size={14} />
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-white text-[#222222] flex items-center justify-center hover:bg-[#007074] hover:text-white transition-colors">
                    <FiTwitter size={14} />
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-white text-[#222222] flex items-center justify-center hover:bg-[#007074] hover:text-white transition-colors">
                    <FiInstagram size={14} />
                  </a>
                </div>
              </div>

              {/* Text Info */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#222222] mb-1 group-hover:text-[#007074] transition-colors">
                  {member.name}
                </h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  {member.role}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}