import React from 'react';

type IconProps = {
  className?: string;
  ariaLabel?: string;
};

export const PrismLogo: React.FC<IconProps> = ({ className, ariaLabel = 'Prism Logo' }) => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      d="M50 10L90 80H10L50 10Z"
      stroke="white"
      strokeWidth={4}
      strokeLinejoin="round"
      opacity={0.9}
    />
    <path
      d="M50 10L50 80"
      stroke="white"
      strokeWidth={2}
      strokeOpacity={0.3}
    />
    <path
      d="M50 10L10 80"
      stroke="white"
      strokeWidth={1}
      strokeOpacity={0.2}
    />
    <path
      d="M50 10L90 80"
      stroke="white"
      strokeWidth={1}
      strokeOpacity={0.2}
    />
    <circle cx={50} cy={10} r={4} fill="white" fillOpacity={0.85} />
    <rect x={35} y={75} width={30} height={5} fill="white" fillOpacity={0.8} />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Upload Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.2}
    stroke="white"
    className={`w-16 h-16 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
    />
    <path strokeLinecap="round" d="M7 10l5-7 5 7" className="opacity-40" />
  </svg>
);

export const PlusSquareIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Plus Square Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={3}
    stroke="white"
    className={`w-8 h-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Trash Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="white"
    className={`w-6 h-6 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.34 9m-4.78 0-.34-9m9.96-1.91c.08.13.13.26.13.41 0 .21-.17.38-.38.38H4.12c-.21 0-.38-.17-.38-.38 0-.15.05-.28.13-.41L5.22 5.06c.15-.45.57-.75 1.05-.75h10.46c.48 0 .9.3 1.05.75l1.01 2.03ZM9 3.75h6M4.5 6h15"
    />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Chevron Right Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={4}
    stroke="white"
    className={`w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Arrow Left Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={3}
    stroke="white"
    className={`w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Home Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="white"
    className={`w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);

export const GalleryIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Gallery Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="white"
    className={`w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Eye Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="white"
    className={`w-7 h-7 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.399 8.049 7.21 5 12 5c4.79 0 8.601 3.049 9.964 6.678a1.012 1.012 0 0 1 0 .644C20.601 15.951 16.79 19 12 19c-4.79 0-8.601-3.049-9.964-6.678Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const EyeSlashIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Eye Slash Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="white"
    className={`w-7 h-7 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.822 7.822L21 21m-2.278-2.278-6.859-6.859m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  </svg>
);

export const ScribbleIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Scribble Icon' }) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      d="M4 12C4 12 7 8 12 8C17 8 20 12 20 12M4 12C4 12 7 16 12 16C17 16 20 12 20 12"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.85}
    />
    <path
      d="M3 3L21 21"
      stroke="white"
      strokeWidth={1}
      strokeOpacity={0.3}
      strokeDasharray="2 2"
    />
    <path
      d="M12 4V20"
      stroke="white"
      strokeWidth={1}
      strokeOpacity={0.2}
    />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ className, ariaLabel = 'Refresh Icon' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="white"
    className={`w-5 h-5 drop-shadow-[0_0_7px_rgba(255,255,255,0.5)] ${className || ''}`}
    role="img"
    aria-label={ariaLabel}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);
