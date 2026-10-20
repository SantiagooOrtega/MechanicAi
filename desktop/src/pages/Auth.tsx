import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { SWITCH_USER_FLAG } from '../components/Layout';
import { LogoMark } from '../components/Logo';
import { CarLoop } from '../components/ui/car-loop';
import MercuryLogin from '../components/ui/mercury-login';

type Mode = 'login' | 'register';
type Origin = { x: number; y: number };

// Fotogramas del video propio (public/frames/0001.jpg ...), generado con IA, interpolado a 60 fps y ampliado con ffmpeg.
const HERO_FRAMES = {
  count: 256,
  url: (i: number) => `${import.meta.env.BASE_URL}frames/${String(i + 1).padStart(4, '0')}.jpg`,
};

const EASE = [0.2, 0.7, 0.2, 1] as const;
const WIPE = [0.65, 0, 0.35, 1] as const;

const circle = (o: Origin, r: string) => `circle(${r} at ${o.x}px ${o.y}px)`;

export default function Auth() {
  const { login, register } = useAuth();
  const { t, lang, setLang } = useT();
  const [panel, setPanel] = useState<Mode | null>(() => {
    try {
      if (sessionStorage.getItem(SWITCH_USER_FLAG)) {
        sessionStorage.removeItem(SWITCH_USER_FLAG);
        return 'login';
      }
    } catch { /* ignorar */ }
    return null;
  });
  const [origin, setOrigin] = useState<Origin>(() => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.8 }));
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  // el login se abre con un círculo que nace en el botón pulsado
  const open = (mode: Mode, e?: React.MouseEvent<HTMLElement>) => {
    if (e) {
      const r = e.currentTarget.getBoundingClientRect();
      setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    setError(null);
    setPanel(mode);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (panel === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const [headline, accent] = t('land.headline').split('\n');
  const closed = circle(origin, '0px');
  const opened = circle(origin, '170vmax');

  return (
    <div className="welcome">
      <div className="welcome-bg" aria-hidden />

      <motion.header className="welcome-bar" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}>
        <div className="welcome-brand">
          <LogoMark size={36} />
          <span>Mechanic<em>IA</em></span>
        </div>
        <div className="welcome-lang" role="group" aria-label="Language">
          {(['es', 'en'] as const).map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
      </motion.header>

      <motion.div className="welcome-stage" initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: panel ? 1.06 : 1 }} transition={{ duration: panel ? 0.8 : 1, ease: EASE }}>
        <CarLoop frames={HERO_FRAMES} paused={panel !== null} />
      </motion.div>

      <motion.div className="welcome-copy" initial={{ opacity: 0, y: 22 }} animate={{ opacity: panel ? 0 : 1, y: panel ? 10 : 0 }}
        transition={{ duration: panel ? 0.35 : 0.7, delay: panel ? 0 : 0.3, ease: EASE }}>
        <p className="welcome-eyebrow">{t('land.eyebrow')}</p>
        <h1>
          {headline} <em>{accent}</em>
        </h1>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={(e) => open('login', e)}>
            {t('land.signIn')} <ArrowRight size={18} />
          </button>
          <button className="btn" onClick={(e) => open('register', e)}>{t('land.create')}</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {panel && (
          <>
            <motion.div key="red" className="reveal reveal-red" aria-hidden
              initial={{ clipPath: closed }} animate={{ clipPath: opened }} exit={{ clipPath: closed }}
              transition={{ duration: 0.8, ease: WIPE }} />
            <motion.div key="login" className="reveal"
              initial={{ clipPath: closed }} animate={{ clipPath: opened }} exit={{ clipPath: closed }}
              transition={{ duration: 0.8, delay: 0.14, ease: WIPE }}>
              <MercuryLogin
                mode={panel}
                values={form}
                onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
                onSubmit={submit}
                onSwitchMode={() => open(panel === 'login' ? 'register' : 'login')}
                onClose={() => setPanel(null)}
                busy={busy}
                error={error}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
