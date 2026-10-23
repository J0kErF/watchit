import type { ReactNode } from "react";

function Icon({ children, size = 28 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15a.5.5 0 0 0 .76.43l12.5-7.5a.5.5 0 0 0 0-.86L7.76 4.07A.5.5 0 0 0 7 4.5z" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <rect x="5.5" y="4" width="4.5" height="16" rx="1" />
    <rect x="14" y="4" width="4.5" height="16" rx="1" />
  </Icon>
);

/** Circular arrow with the seek amount inside, pointing back or forward. */
export const SeekIcon = ({ forward, seconds }: { forward?: boolean; seconds: number }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g transform={forward ? "translate(24 0) scale(-1 1)" : undefined} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4.6 8.5A8.5 8.5 0 1 1 3.5 12" />
      <path d="M4.5 3.5v5h5" strokeLinejoin="round" />
    </g>
    <text x="12" y="15.6" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor" fontFamily="system-ui, sans-serif">
      {seconds}
    </text>
  </svg>
);

export const VolumeIcon = ({ level }: { level: number }) => (
  <Icon>
    <path d="M4 9.5v5a1 1 0 0 0 1 1h3l4.4 3.7a.5.5 0 0 0 .8-.4V5.2a.5.5 0 0 0-.8-.4L8 8.5H5a1 1 0 0 0-1 1z" />
    {level === 0 ? (
      <path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ) : (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        {level > 0.5 && <path d="M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />}
      </>
    )}
  </Icon>
);

export const NextIcon = () => (
  <Icon>
    <path d="M5 5.4v13.2a.5.5 0 0 0 .78.42L15.5 12.4a.5.5 0 0 0 0-.8L5.78 4.98A.5.5 0 0 0 5 5.4z" />
    <rect x="16.5" y="4.5" width="3" height="15" rx="1" />
  </Icon>
);

export const EpisodesIcon = () => (
  <Icon>
    <rect x="7" y="3.5" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M3 8v11a1.5 1.5 0 0 0 1.5 1.5H17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
);

export const SubtitlesIcon = () => (
  <Icon>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M6 12h4m2 0h6M6 15.5h7m2 0h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
);

export const SpeedIcon = () => (
  <Icon>
    <path d="M12 4a9 9 0 0 0-7.8 13.5h15.6A9 9 0 0 0 12 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 14l4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
);

export const SettingsIcon = () => (
  <Icon>
    <path
      d="M10.3 2.5h3.4l.5 2.6a7.5 7.5 0 0 1 1.9 1.1l2.5-.9 1.7 2.9-2 1.7a7.6 7.6 0 0 1 0 2.2l2 1.7-1.7 2.9-2.5-.9a7.5 7.5 0 0 1-1.9 1.1l-.5 2.6h-3.4l-.5-2.6a7.5 7.5 0 0 1-1.9-1.1l-2.5.9-1.7-2.9 2-1.7a7.6 7.6 0 0 1 0-2.2l-2-1.7 1.7-2.9 2.5.9a7.5 7.5 0 0 1 1.9-1.1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </Icon>
);

export const PipIcon = () => (
  <Icon>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="12" y="11.5" width="7" height="5" rx="1" />
  </Icon>
);

export const FullscreenIcon = ({ exit }: { exit?: boolean }) => (
  <Icon>
    <path
      d={exit ? "M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6" : "M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const BackIcon = () => (
  <Icon size={32}>
    <path d="M20 12H5m6-7l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const ServerIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="7" cy="7.5" r="1.2" />
    <circle cx="7" cy="16.5" r="1.2" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon size={18}>
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
