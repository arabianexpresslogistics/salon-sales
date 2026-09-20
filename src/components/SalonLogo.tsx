'use client';

import React from 'react';
import { Scissors, Crown, Sparkles } from 'lucide-react';

interface SalonLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const SalonLogo: React.FC<SalonLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 18,
    md: 26,
    lg: 38,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div 
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#2a2415] via-[#1a1710] to-[#0d0c09] border border-[#d4af37]/60 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
        style={{
          width: size === 'sm' ? 40 : size === 'md' ? 52 : 72,
          height: size === 'sm' ? 40 : size === 'md' ? 52 : 72,
        }}
      >
        <div className="absolute -top-1.5 -right-1 text-[#f5cf68] animate-pulse">
          <Crown size={size === 'sm' ? 10 : 14} />
        </div>
        <Scissors 
          size={iconSizes[size]} 
          className="text-[#f5cf68] transform -rotate-45 drop-shadow-[0_2px_8px_rgba(212,175,55,0.6)]" 
        />
        <div className="absolute inset-0 rounded-2xl border border-[#f5cf68]/20 pointer-events-none" />
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight text-white font-serif uppercase ${textSizes[size]}`}>
            Beard<span className="text-[#f5cf68] font-sans font-black ml-1">Lounge</span>
          </span>
          <span className="gold-badge py-0.5 px-2 text-[10px] tracking-widest hidden sm:inline-flex">
            PREMIUM
          </span>
        </div>
        {showSubtitle && (
          <p className="text-xs text-[#94a3b8] font-medium tracking-wider uppercase flex items-center gap-1 mt-0.5">
            <Sparkles size={11} className="text-[#d4af37]" />
            Salon & Executive Grooming
          </p>
        )}
      </div>
    </div>
  );
};
