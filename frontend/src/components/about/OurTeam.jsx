import React from 'react';
import { FiLinkedin, FiExternalLink, FiUsers } from 'react-icons/fi';
import { useSiteSettings } from '../../features/settings/useSettingsHooks';
import { resolveImageUrl } from '../../utils/imageUrl';

// About → Meet the Visionaries. Fully admin-driven: heading, blurb, and
// every person card come from SiteSettings.about (editable in the admin
// dashboard → Settings → Visionaries tab). If the list is empty we hide
// the rail entirely rather than rendering a dead section.
export default function OurTeam() {
  const { data, isLoading } = useSiteSettings();
  const about = data?.about;
  const members = about?.visionaries || [];

  if (!isLoading && members.length === 0) return null;

  return (
    <section className="w-full bg-[#FDFDFD] py-10 relative overflow-hidden font-sans border-t border-gray-100">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#007074]/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-8">
          <div className="text-center md:text-left">
            <div className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em]">
              Neural Minds
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-[#222] tracking-tight">
              {about?.visionHeading || 'Meet The Visionaries'}
            </h2>
            {about?.visionBlurb && (
              <p className="text-gray-400 mt-6 max-w-md text-sm leading-relaxed uppercase tracking-widest font-medium">
                {about.visionBlurb}
              </p>
            )}
          </div>

          <div className="hidden md:flex flex-col items-end opacity-20">
            <div className="w-20 h-[1px] bg-[#222] mb-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Est. 2024</span>
          </div>
        </div>

        {isLoading ? (
          <SkeletonRow />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-10">
            {members.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="group flex flex-col relative w-full animate-[slideUp_0.5s_ease-out_forwards]"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative aspect-[4/4] lg:aspect-[4/5] rounded-md lg:rounded-[2.5rem] bg-white border border-gray-100 p-2 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 overflow-hidden">
                  <div className="w-full h-full rounded-md lg:rounded-[2rem] overflow-hidden bg-[#F7F3F0] relative">
                    {member.image ? (
                      <img
                        src={resolveImageUrl(member.image)}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover grayscale transition-all duration-1000 ease-out group-hover:grayscale-0 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FiUsers size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {member.socialUrl && (
                      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3 p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                        <a
                          href={member.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-white text-[#222] flex items-center justify-center hover:bg-[#007074] hover:text-white transition-all shadow-lg active:scale-90"
                          aria-label={`Visit ${member.name}'s profile`}
                        >
                          {/linkedin/i.test(member.socialUrl) ? <FiLinkedin size={14} /> : <FiExternalLink size={14} />}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 text-center px-2">
                  <h3 className="text-lg font-serif font-black text-[#222] group-hover:text-[#007074] transition-colors tracking-tight">
                    {member.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="w-1.5 h-[1px] bg-[#007074]" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em]">
                      {member.role}
                    </p>
                    <div className="w-1.5 h-[1px] bg-[#007074]" />
                  </div>
                  {member.bio && (
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx="true">{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/5] bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse mx-auto" />
          <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  );
}
