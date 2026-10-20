import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { SWITCH_USER_FLAG } from '../components/Layout';
import { LogoMark } from '../components/Logo';
import { CarLoop } from '../components/ui/car-loop';

type Mode = 'login' | 'register';

// Fotogramas del video propio (public/frames/0001.jpg ...), generado con IA, interpolado a 60 fps y ampliado con ffmpeg.
const HERO_FRAMES = {
  count: 256,
  url: (i: number) => `${import.meta.env.BASE_URL}frames/${String(i + 1).padStart(4, '0')}.jpg`,
};

const EASE = [0.2, 0.7, 0.2, 1] as const;

export default function Auth() {
  const { login, register } = useAuth();
  const { t, lang, setLang } = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // "Cambiar de usuario" llega aquí con el acceso ya abierto: solo se limpia la marca
  useEffect(() => {
    try { sessionStorage.removeItem(SWITCH_USER_FLAG); } catch { /* ignorar */ }
  }, []);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setError(null);
    setMode(next);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = (k: 'name' | 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const [headline, accent] = t('land.headline').split('\n');

  return (
    <div className="auth">
      <section className="auth-visual" aria-label="Mechanic IA">
        <div className="auth-visual-bg" aria-hidden />
        <div className="auth-brand">
          <LogoMark size={36} />
          <span>Mechanic<em>IA</em></span>
        </div>

        <motion.div className="auth-stage" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE }}>
          <CarLoop frames={HERO_FRAMES} />
        </motion.div>

        <motion.div className="auth-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}>
          <p className="auth-eyebrow">{t('land.eyebrow')}</p>
          <h1>
            {headline}
            <br />
            <em>{accent}</em>
          </h1>
        </motion.div>
      </section>

      <section className="auth-panel">
        <div className="auth-lang" role="group" aria-label="Language">
          {(['es', 'en'] as const).map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>

        <motion.div className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}>
          <div className="auth-tabs" role="tablist">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => switchMode(m)}>
                {mode === m && <motion.span layoutId="auth-tab" className="auth-tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                <span>{t(m === 'login' ? 'land.signIn' : 'land.create')}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>
              <h2>{t(mode === 'login' ? 'auth.loginTitle' : 'auth.registerTitle')}</h2>
              <p className="auth-sub">{t(mode === 'login' ? 'auth.loginSub' : 'auth.registerSub')}</p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={submit} className="auth-form" noValidate>
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div key="name" className="field" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <label htmlFor="auth-name">{t('login.name')}</label>
                  <input id="auth-name" className="input" autoComplete="name" required value={form.name}
                    onChange={set('name')} placeholder={t('login.namePlaceholder')} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="field">
              <label htmlFor="auth-email">{t('login.email')}</label>
              <input id="auth-email" className="input" type="email" autoComplete="email" required value={form.email}
                onChange={set('email')} placeholder="tu@correo.com" />
            </div>

            <div className="field">
              <label htmlFor="auth-password">{t('login.password')}</label>
              <div className="auth-pass">
                <input id="auth-password" className="input" type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required value={form.password}
                  onChange={set('password')} placeholder={mode === 'register' ? t('login.passwordPlaceholder') : '••••••••'} />
                <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)}
                  aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.div key="err" className="auth-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={busy}>
              {busy ? t('login.wait') : (<>{t(mode === 'login' ? 'auth.loginAction' : 'auth.registerAction')} <ArrowRight size={18} /></>)}
            </button>
          </form>

          <p className="auth-switch">
            {t(mode === 'login' ? 'login.noAccount' : 'login.hasAccount')}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {t(mode === 'login' ? 'land.create' : 'land.signIn')}
            </button>
          </p>
        </motion.div>
      </section>
    </div>
  );
}
