import React from 'react';
import { Castle } from 'lucide-react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', className = '' }) => {
  const dimensions = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`${dimensions} brand-mark relative flex items-center justify-center rounded-xl bg-[#1b1722] text-[#d8b56b] border border-[#55435c] shadow-[0_8px_20px_rgba(27,23,34,0.18)] ${className}`}
      aria-label="Araw gothic brand mark"
      title="Araw"
    >
      <Castle className={`${iconSize} stroke-[1.7]`} />
      <span className="absolute bottom-0.5 right-1 text-[8px] font-bold tracking-[0.12em] text-[#f0d493]">A</span>
    </div>
  );
};
