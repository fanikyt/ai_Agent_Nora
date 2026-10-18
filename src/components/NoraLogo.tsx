import React from 'react';

interface NoraLogoProps {
  className?: string;
  size?: number;
}

export const NoraLogo: React.FC<NoraLogoProps> = ({ className = 'w-7 h-7', size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="noraGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="noraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <linearGradient id="noraGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        <linearGradient id="noraGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        <linearGradient id="noraGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>

        <linearGradient id="noraGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        <linearGradient id="noraGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <g transform="translate(50, 50)" filter="url(#noraGlowFilter)">
        {/* Symmetrical 6-petal neon knot */}
        {[
          { angle: 0, grad: 'url(#noraGrad1)' },
          { angle: 60, grad: 'url(#noraGrad2)' },
          { angle: 120, grad: 'url(#noraGrad3)' },
          { angle: 180, grad: 'url(#noraGrad4)' },
          { angle: 240, grad: 'url(#noraGrad5)' },
          { angle: 300, grad: 'url(#noraGrad6)' },
        ].map(({ angle, grad }, index) => (
          <g key={index} transform={`rotate(${angle})`}>
            <path
              d="M 0 -36 C 14 -36 24 -26 24 -12 C 24 2 14 14 0 14 C -9 14 -16 9 -16 0 C -16 -5 -13 -9 -8 -9 C -3 -9 0 -5 0 0 C 0 7 -6 13 -13 13"
              fill="none"
              stroke={grad}
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Central Glowing Sparkle / 4-pointed Star */}
        <path
          d="M 0 -7.5 Q 0 0 7.5 0 Q 0 0 0 7.5 Q 0 0 -7.5 0 Q 0 0 0 -7.5 Z"
          fill="#cffafe"
        />
        <path
          d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
};
