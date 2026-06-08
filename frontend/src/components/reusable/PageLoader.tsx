import React, { useEffect, useState } from 'react';

// Each page passes its own icon (any React node) and a colour theme
export interface PageLoaderProps {
  /** Lucide icon or any React node to display in the circle */
  icon?: React.ReactNode;
  /** Tailwind gradient class for the circle bg, e.g. "from-indigo-600 to-violet-600" */
  gradient?: string;
  /** Tailwind colour for glow ring + shimmer + dots, e.g. "indigo" */
  color?: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'orange' | 'teal';
  /** Short label shown below the spinner, e.g. "Loading campaigns…" */
  label?: string;
}

const MESSAGES = [
  'Fetching your latest data…',
  'Crunching the numbers…',
  'Building your insights…',
  'Analysing signals…',
  'Almost ready…',
];

// colour → tailwind classes mapping (must be in source for Tailwind JIT)
const COLOR_MAP: Record<NonNullable<PageLoaderProps['color']>, {
  ring: string;
  shimmer: string;
  dot: string;
}> = {
  indigo:  { ring: 'bg-indigo-500/20',  shimmer: 'from-indigo-200 via-indigo-400 to-indigo-200',  dot: 'bg-indigo-400'  },
  violet:  { ring: 'bg-violet-500/20',  shimmer: 'from-violet-200 via-violet-400 to-violet-200',  dot: 'bg-violet-400'  },
  emerald: { ring: 'bg-emerald-500/20', shimmer: 'from-emerald-200 via-emerald-400 to-emerald-200', dot: 'bg-emerald-400' },
  amber:   { ring: 'bg-amber-500/20',   shimmer: 'from-amber-200 via-amber-400 to-amber-200',    dot: 'bg-amber-400'   },
  rose:    { ring: 'bg-rose-500/20',    shimmer: 'from-rose-200 via-rose-400 to-rose-200',        dot: 'bg-rose-400'    },
  sky:     { ring: 'bg-sky-500/20',     shimmer: 'from-sky-200 via-sky-400 to-sky-200',           dot: 'bg-sky-400'     },
  orange:  { ring: 'bg-orange-500/20',  shimmer: 'from-orange-200 via-orange-400 to-orange-200',  dot: 'bg-orange-400'  },
  teal:    { ring: 'bg-teal-500/20',    shimmer: 'from-teal-200 via-teal-400 to-teal-200',        dot: 'bg-teal-400'    },
};

// Default "G" SVG mark used when no icon is provided
const DefaultGMark = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 4C10.268 4 4 10.268 4 18s6.268 14 14 14c6.627 0 12.167-4.603 13.618-10.8H18v-4.4h9.6C27.6 9.336 23.164 4 18 4z"
      fill="white"
      fillOpacity={0.95}
    />
  </svg>
);

export const PageLoader: React.FC<PageLoaderProps> = ({
  icon,
  gradient = 'from-indigo-600 to-violet-600',
  color = 'indigo',
  label,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible]   = useState(true);
  const c = COLOR_MAP[color];

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
      aria-busy="true"
      aria-label="Loading"
    >
      {/* Animated icon circle */}
      <div className="relative mb-8">
        {/* Pulsing glow ring */}
        <div
          className={`absolute inset-0 rounded-full ${c.ring}`}
          style={{ animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }}
        />
        {/* Icon circle */}
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-xl`}
          style={{ boxShadow: undefined }}
        >
          {/* Render icon at 32px white, or default G mark */}
          <span className="text-white [&>svg]:h-8 [&>svg]:w-8 [&>svg]:stroke-white [&>svg]:fill-none">
            {icon ?? <DefaultGMark />}
          </span>
        </div>
      </div>

      {/* Shimmer skeleton bars */}
      <div className="mb-8 w-72 space-y-3">
        {[80, 55, 70].map((w, i) => (
          <div
            key={i}
            className="h-2.5 rounded-full bg-gray-100 overflow-hidden"
            style={{ width: `${w}%`, marginLeft: i % 2 === 1 ? 'auto' : undefined }}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${c.shimmer}`}
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Status message */}
      <p
        className="text-sm font-semibold text-gray-500 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {label ?? MESSAGES[msgIndex]}
      </p>

      {/* Dot progress indicator */}
      <div className="mt-4 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`block h-1.5 w-1.5 rounded-full ${c.dot}`}
            style={{ animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.35; }
          40%            { transform: translateY(-6px); opacity: 1;    }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
