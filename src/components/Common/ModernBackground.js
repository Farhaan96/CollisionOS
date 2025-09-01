import React from 'react';

export const ModernBackground = () => (
  <div
    className='fixed inset-0 -z-10 ambient-gradient'
    style={{ pointerEvents: 'none' }}
  >
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.15,
      }}
    >
      <defs>
        <pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'>
          <path
            d='M 40 0 L 0 0 0 40'
            fill='none'
            stroke='rgba(255,255,255,0.25)'
            strokeWidth='1'
          />
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill='url(#grid)' />
    </svg>
  </div>
);

export default ModernBackground;
