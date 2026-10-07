import { useId } from 'react';

export function LogoMark({ size = 34 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path d="M9.5 16.5l4.2 4.2 8.8-9.2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <a href="#top" className="logo" aria-label="Ytasker home">
      <LogoMark />
      <span>
        ytasker<span className="logo__dot">.</span>
      </span>
    </a>
  );
}
