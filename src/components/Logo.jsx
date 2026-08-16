import React from 'react';

export default function Logo({ size = 24, className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {/* Padlock Shackle */}
      <path d="M256 32c-79.5 0-144 64.5-144 144v80h48v-80c0-53 43-96 96-96s96 43 96 96v80h48v-80c0-79.5-64.5-144-144-144z" />
      
      {/* Padlock Body */}
      <rect x="48" y="208" width="416" height="272" rx="64" ry="64" />
      
      {/* Keyhole */}
      <path
        d="M256 272c-22 0-40 18-40 40 0 17 10 31 25 37l-13 54c-2 9 4 17 13 17h30c9 0 15-8 13-17l-13-54c15-6 25-20 25-37 0-22-18-40-40-40z"
        fill="var(--bg-primary, #000000)"
      />
    </svg>
  );
}
