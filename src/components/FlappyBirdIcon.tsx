import React from 'react';

interface FlappyBirdIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  isFlapping?: boolean;
}

export default function FlappyBirdIcon({
  className = "",
  style,
  size = 64,
  isFlapping = false,
}: FlappyBirdIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      style={style}
    >
      {/* 1. Yellow Main Body with a solid dark 3px outline */}
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="#FDE047"
        stroke="#0F172A"
        strokeWidth="3"
      />

      {/* 2. Soft shadow/highlight at the bottom of the body */}
      <path
        d="M 17 38 A 18 18 0 0 0 45 42 A 18 18 0 0 1 17 38 Z"
        fill="#EAB308"
        opacity="0.6"
      />

      {/* 3. White eye/chest crescent patch on the front-right of the body */}
      {/* This uses the same radius to align perfectly with the front edge of the body */}
      <path
        d="M 32 14 
           A 18 18 0 0 1 48 32 
           A 18 18 0 0 1 32 50 
           C 37 45, 39 39, 39 32 
           C 39 25, 37 19, 32 14 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* 4. Cute Retro Vertical Eye */}
      <rect
        x="40"
        y="25"
        width="4.5"
        height="10.5"
        rx="2.25"
        fill="#0F172A"
      />

      {/* 5. Pink Beak (pill-shaped lips with outline and midline) */}
      {/* Top beak lip */}
      <path
        d="M 44 26 
           L 55 26 
           C 59 26, 59 32, 55 32 
           L 44 32 Z"
        fill="#FFA1B1"
        stroke="#0F172A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Bottom beak lip */}
      <path
        d="M 44 32 
           L 53 32 
           C 57 32, 57 38, 53 38 
           L 44 38 Z"
        fill="#FF5274"
        stroke="#0F172A"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* 6. Wing (White feathered cartoon wing on the left side) */}
      {/* Adjust rotation/scale dynamically to simulate flapping */}
      <g
        className="transition-transform duration-100 ease-in-out"
        style={{
          transformOrigin: '28px 32px',
          transform: isFlapping ? 'rotate(-20deg) scaleY(0.85)' : 'rotate(0deg)',
        }}
      >
        <path
          d="M 28 32 
             C 24 24, 18 18, 12 18 
             C 6 18, 2 24, 6 28 
             C 1 30, 2 36, 10 36 
             C 6 38, 8 44, 16 44 
             C 24 44, 28 36, 28 32 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
