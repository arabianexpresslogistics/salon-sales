'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface SalonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showLocation?: boolean;
  centered?: boolean;
}

export const SalonLogo: React.FC<SalonLogoProps> = ({ 
  size = 'md', 
  showSubtitle = true,
  showLocation = false,
  centered = false
}) => {
  const iconPixelSizes = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 68,
  };

  const titleSizes = {
    sm: 'text-sm tracking-wider',
    md: 'text-lg tracking-wider',
    lg: 'text-2xl tracking-widest',
    xl: 'text-3xl tracking-widest',
  };

  const dim = iconPixelSizes[size];

  return (
    <div className={`flex items-center gap-3 select-none ${centered ? 'flex-col justify-center text-center' : ''}`}>
      {/* Bearded Logo Icon */}
      <div 
        className="flex items-center justify-center rounded-xl bg-[#141a24] border border-[#d4af37]/40 shrink-0"
        style={{ width: dim, height: dim }}
      >
        <svg 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[70%] h-[70%] text-[#d4af37]"
        >
          {/* Hair Pompadour */}
          <path 
            d="M20 18C20 12 24 8 32 8C40 8 44 12 44 18C44 19 46 22 47 25C44 23 39 23 32 23C25 23 20 23 17 25C18 22 20 19 20 18Z" 
            fill="#d4af37" 
          />
          {/* Sunglasses */}
          <path 
            d="M19 27C19 25.5 21 25 25 25C29 25 30 27 30 28.5C30 30.5 27 31.5 23.5 31.5C20.5 31.5 19 30 19 27Z" 
            fill="#0b0f17" 
            stroke="#d4af37" 
            strokeWidth="1.5"
          />
          <path 
            d="M34 28.5C34 27 35 25 39 25C43 25 45 25.5 45 27C45 30 43.5 31.5 40.5 31.5C37 31.5 34 30.5 34 28.5Z" 
            fill="#0b0f17" 
            stroke="#d4af37" 
            strokeWidth="1.5"
          />
          <line x1="29.5" y1="26.5" x2="34.5" y2="26.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Mustache */}
          <path 
            d="M23 36C26 36 29 37.5 32 39.5C35 37.5 38 36 41 36C44.5 36 46 38.5 44 40C39.5 41 35 41.5 32 43C29 41.5 24.5 41 20 40C18 38.5 19.5 36 23 36Z" 
            fill="#d4af37" 
          />
          
          {/* Full Beard */}
          <path 
            d="M17 30C16 35 17 44 23 50C27 54 30 56 32 56C34 56 37 54 41 50C47 44 48 35 47 30C45 33 42 35 42 35C40 46 36 50 32 50C28 50 24 46 22 35C22 35 19 33 17 30Z" 
            fill="#d4af37" 
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div>
        <div className={`flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>
          <span className={`font-bold text-white uppercase tracking-wider ${titleSizes[size]}`}>
            BEARD <span className="text-[#d4af37]">LOUNGE</span>
          </span>
          <span className="text-[10px] font-semibold text-[#d4af37] bg-[#d4af37]/10 px-1.5 py-0.5 rounded border border-[#d4af37]/30 tracking-wider uppercase">
            KW
          </span>
        </div>

        {showSubtitle && (
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mt-0.5">
            PREMIUM MEN&apos;S SALON
          </p>
        )}

        {showLocation && (
          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-[#d4af37]" />
            Farwaniya Block 1 &bull; Kuwait
          </p>
        )}
      </div>
    </div>
  );
};


