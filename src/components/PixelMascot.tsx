import React from 'react';

interface PixelMascotProps {
  className?: string;
  size?: number;
}

/**
 * 8-bit retro pixel mascot matching Image 1
 * Terracotta pixel creature (#d97757 / #c26343)
 */
export const PixelMascot: React.FC<PixelMascotProps> = ({
  className = 'w-6 h-5 text-[#d97757]',
}) => {
  return (
    <svg
      viewBox="0 0 16 13"
      fill="currentColor"
      className={className}
      style={{ shapeRendering: 'crispEdges' }}
      aria-label="Codex Mascot"
    >
      {/* 2 Top Antennas / Horns */}
      <rect x="2" y="0" width="2" height="2" />
      <rect x="12" y="0" width="2" height="2" />

      {/* Top Head Bar */}
      <rect x="3" y="2" width="10" height="2" />

      {/* Main Face Row */}
      <rect x="1" y="4" width="14" height="4" />

      {/* Eye cutouts (dark contrast) */}
      <rect x="4" y="5" width="2" height="2" fill="#0d1017" />
      <rect x="10" y="5" width="2" height="2" fill="#0d1017" />

      {/* Lower Torso */}
      <rect x="3" y="8" width="10" height="2" />

      {/* Legs / Tentacles */}
      <rect x="2" y="10" width="2" height="3" />
      <rect x="5" y="10" width="2" height="2" />
      <rect x="9" y="10" width="2" height="2" />
      <rect x="12" y="10" width="2" height="3" />
    </svg>
  );
};
