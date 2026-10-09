import React from 'react';

export default function ToothIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dental Molar Tooth Profile */}
      <path
        d="M6.5 3C4 3 2.5 5 2.1 8C1.7 11.2 2.8 14 3.7 17C4.4 19.3 5.4 22 7.2 22C8.7 22 9.5 19.5 10.3 16.8C10.7 15.4 11.3 14.8 12 14.8C12.7 14.8 13.3 15.4 13.7 16.8C14.5 19.5 15.3 22 16.8 22C18.6 22 19.6 19.3 20.3 17C21.2 14 22.3 11.2 21.9 8C21.5 5 20 3 17.5 3C15 3 13.8 4.2 12 4.2C10.2 4.2 9 3 6.5 3Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Subtle Inner Enamel Sparkle / Contour */}
      <path
        d="M6 7.5C6.5 6 7.8 5 9.5 5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="8" cy="10" r="0.8" fill="white" opacity="0.9" />
    </svg>
  );
}
