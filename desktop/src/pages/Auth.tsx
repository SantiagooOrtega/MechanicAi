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
import { ScrollGallery, type ScrollGallerySlide } from '../components/ui/scroll-gallery';

type Mode = 'login' | 'register';

// Fotogramas del video propio (public/frames/0001.jpg ...), generado con IA, interpolado a 60 fps y ampliado con ffmpeg.
const HERO_FRAMES = {
  count: 256,
  url: (i: number) => `${import.meta.env.BASE_URL}frames/${String(i + 1).padStart(4, '0')}.jpg`,
};

// Apartados de la app, cada uno sobre una foto de taller (public/garage, fotos de Unsplash)
const garage = (f: string) => `${import.meta.env.BASE_URL}garage/${f}`;
const FEATURES: Record<'es' | 'en', ScrollGallerySlide[]> = {
  es: [
    { image: garage('1-diagnostico.jpg'), eyebrow: 'Diagnóstico con IA', title: 'Cuéntale qué le pasa.', description: 'Describe el ruido, la vibración o el olor con tus palabras y la IA te da las causas más probables.' },
    { image: garage('2-obd.jpg'), eyebrow: 'Códigos OBD-II', title: 'Tu escáner, traducido.', description: 'Pega los códigos P0300, P0420… y entiende qué significan sin buscar en foros.' },
    { image: garage('3-vehiculos.jpg'), eyebrow: 'Mis vehículos', title: 'Todo tu garaje en un lugar.', description: 'Registra cada carro con su marca, modelo y kilometraje, y guarda su historial de diagnósticos.' },
    { image: garage('4-mantenimiento.jpg'), eyebrow: 'Mantenimiento', title: 'Nunca más un cambio de aceite tarde.', description: 'Programa servicios y recibe recordatorios antes de que llegue la fecha o el kilometraje.' },
    { image: garage('5-taller.jpg'), eyebrow: 'Urgencia y pasos', title: 'Llega al taller sabiendo.', description: 'Cada diagnóstico te dice qué tan urgente es y qué revisar primero, para que nadie te cobre de más.' },
  ],
  en: [
    { image: garage('1-diagnostico.jpg'), eyebrow: 'AI diagnosis', title: 'Tell it what is wrong.', description: 'Describe the noise, vibration or smell in your own words and the AI gives you the most likely causes.' },
    { image: garage('2-obd.jpg'), eyebrow: 'OBD-II codes', title: 'Your scanner, translated.', description: 'Paste codes like P0300 or P0420 and understand what they mean without digging through forums.' },
    { image: garage('3-vehiculos.jpg'), eyebrow: 'My vehicles', title: 'Your whole garage in one place.', description: 'Register each car with its make, model and mileage, and keep its diagnosis history.' },
    { image: garage('4-mantenimiento.jpg'), eyebrow: 'Maintenance', title: 'Never late for an oil change again.', description: 'Schedule services and get reminders before the date or mileage arrives.' },
    { image: garage('5-taller.jpg'), eyebrow: 'Urgency and steps', title: 'Walk into the shop informed.', description: 'Every diagnosis tells you how urgent it is and what to check first, so nobody overcharges you.' },
  ],
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
  const [ctaEl, setCtaEl] = useState<HTMLElement | null>(null);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Cuando la sección final (con sus propios botones) está en pantalla, se ocultan los de la barra
  useEffect(() => {
    if (!ctaEl || !scroller) return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { root: scroller, threshold: 0.35 });
    io.observe(ctaEl);
    return () => io.disconnect();
  }, [ctaEl, scroller]);

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
            <div className={`land-auth${ctaVisible ? ' hidden' : ''}`} aria-hidden={ctaVisible}>
              <button className="btn btn-ghost" tabIndex={ctaVisible ? -1 : 0} onClick={() => open('login')}>{t('land.signIn')}</button>
              <button className="btn btn-primary land-primary" tabIndex={ctaVisible ? -1 : 0} onClick={() => open('register')}>{t('land.create')}</button>
            </div>
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

        {scroller && <ScrollGallery scroller={scroller} slides={FEATURES[lang]} />}

        <section className="land-cta" ref={setCtaEl}>
          <p className="land-eyebrow">{t('land.ctaEyebrow')}</p>
          <h1>
            {headlineLines[0]}
            <br />
            <em>{headlineLines[1]}</em>
          </h1>
          <p className="land-body">{t('land.body')}</p>
          <div className="land-buttons">
            <button className="btn btn-primary btn-lg land-primary" onClick={() => open('register')}>
              {t('land.create')} <ArrowRight size={18} />
            </button>
            <button className="btn btn-lg land-secondary" onClick={() => open('login')}>{t('land.haveAccount')}</button>
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
