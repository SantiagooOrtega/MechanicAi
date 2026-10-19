import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import '@fontsource/instrument-serif/400-italic.css';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { SWITCH_USER_FLAG } from '../components/Layout';
import SculptureHero from '../components/ui/liquid-sculpture-hero';
import MercuryLogin from '../components/ui/mercury-login';

type Mode = 'login' | 'register';

export default function Auth() {
  const { login, register } = useAuth();
  const { t } = useT();
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

  // Los enlaces del hero usan #entrar / #registro; el resto no navega
  function onHeroClick(e: MouseEvent) {
    const link = (e.target as HTMLElement).closest('a');
    if (!link || link.target === '_blank') return;
    e.preventDefault();
    const hash = link.getAttribute('href');
    if (hash === '#entrar') open('login');
    if (hash === '#registro') open('register');
  }

  function open(mode: Mode) {
    setError(null);
    setPanel(mode);
  }

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
    <div className="landing" onClick={onHeroClick}>
      <SculptureHero
        theme="dark"
        themeToggle={false}
        loadFonts={false}
        darkBackground="#0a0a0b"
        textColor="#f5f5f5"
        accentColor="#ef4444"
        headingFont="'Space Grotesk Variable', 'Inter Variable', sans-serif"
        accentFont="'Instrument Serif', Georgia, serif"
        bodyFont="'Inter Variable', system-ui, sans-serif"
        brand="MechanicIA"
        navLinks={[
          { label: t('nav.diagnosis'), href: '#' },
          { label: t('nav.vehicles'), href: '#' },
          { label: t('nav.maintenance'), href: '#' },
        ]}
        navCta={{ label: t('land.signIn'), href: '#entrar' }}
        eyebrow={t('land.eyebrow')}
        headline={t('land.headline')}
        headlineAccent={t('land.accent')}
        body={t('land.body')}
        primaryCta={{ label: t('land.create'), href: '#registro' }}
        secondaryCta={{ label: t('land.haveAccount'), href: '#entrar' }}
        hint={t('land.hint')}
        backdropText={t('land.backdrop')}
        radius={240}
        strength={1.1}
        turbulence={1.2}
        liquid={1.2}
        intro
      />

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
