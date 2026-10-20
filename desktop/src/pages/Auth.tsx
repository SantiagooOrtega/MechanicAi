import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { SWITCH_USER_FLAG } from '../components/Layout';
import { LogoMark } from '../components/Logo';
import { HeroScrub } from '../components/ui/hero-scrub';
import { drawExplodedCar } from '../components/ui/car-exploded';
import MercuryLogin from '../components/ui/mercury-login';

type Mode = 'login' | 'register';

// Fotogramas del video propio (public/frames/0001.jpg ...), generado con IA, interpolado a 60 fps y ampliado con ffmpeg.
const HERO_FRAMES = {
  count: 256,
  url: (i: number) => `${import.meta.env.BASE_URL}frames/${String(i + 1).padStart(4, '0')}.jpg`,
};

export default function Auth() {
  const { login, register } = useAuth();
  const { t, lang, setLang } = useT();
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<Mode | null>(() => {
    try {
      if (sessionStorage.getItem(SWITCH_USER_FLAG)) {
        sessionStorage.removeItem(SWITCH_USER_FLAG);
        return 'login';
      }
    } catch { /* ignorar */ }
    return null;
  });
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  const open = (mode: Mode) => {
    setError(null);
    setPanel(mode);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, progress: number, w: number, h: number) => drawExplodedCar(ctx, progress, w, h),
    []
  );

  const headlineLines = useMemo(() => t('land.headline').split('\n'), [t]);

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

  return (
    <div className="landing">
      <div className="landing-scroll" ref={setScroller}>
        <header className="land-bar">
          <div className="land-brand">
            <LogoMark size={34} />
            <span>Mechanic<em>IA</em></span>
          </div>
          <div className="land-actions">
            <div className="land-lang" role="group" aria-label="Language">
              {(['es', 'en'] as const).map((l) => (
                <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => open('login')}>{t('land.signIn')}</button>
            <button className="btn btn-primary" onClick={() => open('register')}>{t('land.create')}</button>
          </div>
        </header>

        {scroller && (
          <HeroScrub
            scroller={scroller}
            frames={HERO_FRAMES}
            draw={draw}
            titleTop="Mechanic"
            titleBottom={<em>IA</em>}
            scrollHint={t('land.scroll')}
          />
        )}

        <section className="land-cta">
          <p className="land-eyebrow">{t('land.ctaEyebrow')}</p>
          <h1>
            {headlineLines[0]}
            <br />
            <em>{headlineLines[1]}</em>
          </h1>
          <p className="land-body">{t('land.body')}</p>
          <div className="land-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => open('register')}>
              {t('land.create')} <ArrowRight size={18} />
            </button>
            <button className="btn btn-lg" onClick={() => open('login')}>{t('land.haveAccount')}</button>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {panel && (
          <motion.div key="login" style={{ position: 'absolute', inset: 0, zIndex: 30 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
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
        )}
      </AnimatePresence>
    </div>
  );
}
