import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform, type Variants } from 'motion/react';

export const spring = { type: 'spring', stiffness: 260, damping: 26 } as const;

export const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring },
};

/** Contenedor que revela a sus hijos `motion` (con itemVariants) en cascada */
export function Stagger({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <motion.div className={className} style={style} variants={containerVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function Item({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <motion.div className={className} style={style} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Número que cuenta desde 0 hasta su valor */
export function Counter({ value, format = (n: number) => String(n) }: { value: number; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const text = useTransform(() => format(Math.round(mv.get())));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.2, 0.7, 0.2, 1] });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/** Línea de pulso de diagnóstico que se dibuja en bucle */
export function PulseLine({ width = 220 }: { width?: number }) {
  return (
    <svg width={width} height={56} viewBox="0 0 220 56" fill="none" aria-hidden="true">
      <path d="M0 28h220" stroke="var(--surface-3)" strokeWidth="2" />
      <motion.path
        d="M0 28h58l10-22 14 44 12-34 8 12h118"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.7, 1] }}
      />
    </svg>
  );
}
