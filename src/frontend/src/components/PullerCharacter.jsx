import React from 'react';

export default function PullerCharacter({ team = 'A', index = 0, isPulling = false, isFallen = false }) {
  const isA = team === 'A';
  const colorPrimary = isA ? '#00F0FF' : '#FF6B00';
  const colorSecondary = isA ? '#0099FF' : '#FF3D00';
  const colorGlow = isA ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 107, 0, 0.6)';

  // Lean angle: normal lean back (-15 deg for A, 15 deg for B)
  const leanAngle = isFallen ? (isA ? -70 : 70) : isPulling ? (isA ? -24 : 24) : (isA ? -14 : 14);

  return (
    <div
      style={{
        display: 'inline-block',
        width: 36,
        height: 52,
        transform: `rotate(${leanAngle}deg) ${isFallen ? 'translateY(16px)' : ''}`,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        filter: `drop-shadow(0 4px 8px ${colorGlow})`,
        animation: !isFallen ? `characterIdle 1.6s infinite ease-in-out ${index * 0.2}s` : 'none',
        flexShrink: 0
      }}
      title={`Chiến binh ${team} #${index + 1}`}
    >
      <svg viewBox="0 0 40 60" width="100%" height="100%">
        {/* Head with Cyber Bandana & Glowing Visor */}
        <circle cx="20" cy="14" r="10" fill="#1C2541" stroke={colorPrimary} strokeWidth="1.8" />
        {/* Visor */}
        <rect
          x={isA ? "10" : "14"}
          y="11"
          width="16"
          height="6"
          rx="3"
          fill={colorPrimary}
          style={{ filter: `drop-shadow(0 0 4px ${colorPrimary})` }}
        />
        {/* Cyber Headband */}
        <path
          d={isA ? "M 10 9 Q 20 6 30 9 L 31 12 Q 20 9 10 12 Z" : "M 10 9 Q 20 6 30 9 L 31 12 Q 20 9 10 12 Z"}
          fill={colorSecondary}
        />

        {/* Torso & Cyber Vest */}
        <path
          d="M 12 24 L 28 24 L 25 42 L 15 42 Z"
          fill="#0B132B"
          stroke={colorPrimary}
          strokeWidth="1.6"
        />
        {/* Vest Stripe */}
        <line x1="20" y1="24" x2="20" y2="42" stroke={colorPrimary} strokeWidth="1.5" />

        {/* Arms pulling rope */}
        <path
          d={isA ? "M 13 27 Q 6 34 16 38" : "M 27 27 Q 34 34 24 38"}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Hands / Gloves */}
        <circle cx={isA ? "17" : "23"} cy="38" r="3" fill={colorPrimary} />

        {/* Legs planted firmly */}
        <path
          d="M 15 42 L 10 56 M 25 42 L 30 56"
          stroke="#3A506B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Boots */}
        <rect x="7" y="54" width="7" height="4" rx="1.5" fill={colorPrimary} />
        <rect x="26" y="54" width="7" height="4" rx="1.5" fill={colorPrimary} />
      </svg>
    </div>
  );
}
