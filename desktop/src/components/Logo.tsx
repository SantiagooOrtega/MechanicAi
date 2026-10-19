import { useId } from 'react';
import { motion } from 'motion/react';

/** Tuerca hexagonal con pulso de diagnóstico: mecánica + inteligencia */
export function LogoMark({ size = 36 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F87171" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <path
        d="M24 2.5 42.2 13v22L24 45.5 5.8 35V13L24 2.5Z"
        fill={`url(#${id})`}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <motion.path
        d="M9.5 25h8l3.2-8.2 5.2 15.2 3.6-9.4 1.8 2.4h7.2"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.25, ease: 'easeInOut' }}
      />
    </svg>
  );
}

export function Brand({ size = 36 }: { size?: number }) {
  return (
    <div className="brand">
      <motion.div initial={{ scale: 0.6, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }} whileHover={{ rotate: 60 }} style={{ display: 'grid' }}>
        <LogoMark size={size} />
      </motion.div>
      <span className="brand-name">
        Mechanic<span>IA</span>
      </span>
    </div>
  );
}
