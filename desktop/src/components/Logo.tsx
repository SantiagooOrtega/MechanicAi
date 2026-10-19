import { useId } from 'react';
import { motion } from 'motion/react';

/**
 * Calavera de mecánico con gorra y llaves cruzadas.
 * El cuerpo usa el color de texto del tema (claro/oscuro) y la gorra el acento de la marca.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  const wrenchMask = `${uid}-w`;
  const skullMask = `${uid}-s`;
  const cutMask = `${uid}-c`;
  const body = 'var(--text, #f5f5f5)';
  const cap = 'var(--accent, #ef4444)';

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <defs>
        {/* Boca abierta de las dos cabezas de la llave */}
        <mask id={wrenchMask} maskUnits="userSpaceOnUse" x="-110" y="-40" width="220" height="80">
          <rect x="-110" y="-40" width="220" height="80" fill="#fff" />
          <rect x="-96" y="-6.5" width="32" height="13" fill="#000" transform="rotate(-24 -76 0)" />
          <rect x="64" y="-6.5" width="32" height="13" fill="#000" transform="rotate(24 76 0)" />
        </mask>
        {/* Hueco alrededor de la calavera para separarla de las llaves */}
        <mask id={cutMask} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <rect width="200" height="200" fill="#fff" />
          <path d="M64 62C64 55 80 53 100 53s36 2 36 9l2 24c0 8-6 12-10 16v12c0 4-4 6-8 6H80c-4 0-8-2-8-6v-12c-4-4-10-8-10-16Z" fill="#000" stroke="#000" strokeWidth="9" strokeLinejoin="round" />
          <rect x="56" y="44" width="88" height="20" rx="8" fill="#000" />
        </mask>
        {/* Ojos, nariz y dientes recortados en la calavera */}
        <mask id={skullMask} maskUnits="userSpaceOnUse" x="50" y="40" width="100" height="90">
          <rect x="50" y="40" width="100" height="90" fill="#fff" />
          <path d="M70 73 L93 79 L91 93 C84 96 73 93 70 85 Z" fill="#000" />
          <path d="M130 73 L107 79 L109 93 C116 96 127 93 130 85 Z" fill="#000" />
          <path d="M100 92 L92.5 105 L100 102.5 L107.5 105 Z" fill="#000" />
          <path d="M78 108.5h44" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <path d="M84 111v9M92 111v9M100 111v9M108 111v9M116 111v9" stroke="#000" strokeWidth="2.6" strokeLinecap="round" />
        </mask>
      </defs>

      {/* Llaves cruzadas */}
      <motion.g mask={`url(#${cutMask})`} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: '100px 128px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
        {[40, -40].map((deg) => (
          <g key={deg} transform={`translate(100 128) rotate(${deg})`}>
            <g mask={`url(#${wrenchMask})`} fill={body}>
              <rect x="-66" y="-5.5" width="132" height="11" rx="5.5" />
              <circle cx="-76" cy="0" r="17" />
              <circle cx="76" cy="0" r="17" />
            </g>
          </g>
        ))}
      </motion.g>

      {/* Calavera */}
      <path
        mask={`url(#${skullMask})`}
        fill={body}
        d="M64 62C64 55 80 53 100 53s36 2 36 9l2 24c0 8-6 12-10 16v12c0 4-4 6-8 6H80c-4 0-8-2-8-6v-12c-4-4-10-8-10-16Z"
      />

      {/* Gorra */}
      <motion.g initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}>
        <path d="M60 45C60 22 80 12 100 12s40 10 40 33Z" fill={cap} />
        <path d="M56 49h88c0 0 2 11-6 11H62c-8 0-6-11-6-11Z" fill={cap} />
        <path d="M70 52h60" stroke="var(--bg, #0a0a0b)" strokeWidth="1.6" strokeDasharray="4 3.5" strokeLinecap="round" opacity="0.55" />
        <path d="M100 13v14" stroke="var(--bg, #0a0a0b)" strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" opacity="0.4" />
      </motion.g>
    </svg>
  );
}

export function Brand({ size = 36 }: { size?: number }) {
  return (
    <div className="brand">
      <LogoMark size={size} />
      <span className="brand-name">
        Mechanic<span>IA</span>
      </span>
    </div>
  );
}
