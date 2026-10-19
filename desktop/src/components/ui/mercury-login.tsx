import { useEffect, useId, useMemo, useRef, type ChangeEvent, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { useT } from "../../i18n"
import { LogoMark } from "../Logo"

/**
 * Login "mercurio líquido": blobs metálicos que flotan y siguen al cursor,
 * campos con línea luminosa y botón gooey. Adaptado de Mercury Login.
 */

export type MercuryMode = "login" | "register"

export interface MercuryLoginProps {
  mode: MercuryMode
  values: { name: string; email: string; password: string }
  onChange: (key: "name" | "email" | "password", value: string) => void
  onSubmit: (e: FormEvent) => void
  onSwitchMode: () => void
  onClose: () => void
  busy?: boolean
  error?: string | null
}

const BLOBS = 7

export default function MercuryLogin({ mode, values, onChange, onSubmit, onSwitchMode, onClose, busy, error }: MercuryLoginProps) {
  const { t, lang, setLang } = useT()
  const filterId = useId().replace(/:/g, "")
  const isLogin = mode === "login"

  // valores aleatorios estables durante la vida del componente
  const blobs = useMemo(
    () =>
      Array.from({ length: BLOBS }, (_, i) => ({
        size: Math.random() * 200 + 150,
        left: Math.random() * 80 + 10,
        top: Math.random() * 80 + 10,
        delay: Math.random() * -20,
        duration: Math.random() * 15 + 15,
        warm: i % 2 === 0,
      })),
    []
  )

  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const items = Array.from(stage.children) as HTMLElement[]
    let frame = 0
    let nx = 0.5
    let ny = 0.5
    const apply = () => {
      frame = 0
      for (let i = 0; i < items.length; i++) {
        const speed = (i + 1) * 20
        // `translate` es independiente de `transform`: no pisa la animación ni fuerza layout
        items[i].style.translate = `${nx * speed}px ${ny * speed}px`
      }
    }
    const onMove = (e: MouseEvent) => {
      nx = e.clientX / window.innerWidth
      ny = e.clientY / window.innerHeight
      if (!frame) frame = requestAnimationFrame(apply)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  const bind = (key: "name" | "email" | "password") => ({
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value),
  })

  return (
    <div className="mq-wrap" style={{ ["--mq-filter" as string]: `url(#${filterId})` }}>
      <style>{CSS}</style>

      <svg className="mq-svg" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="mq-stage" ref={stageRef} aria-hidden="true">
        {blobs.map((b, i) => (
          <div
            key={i}
            className={"mq-blob " + (b.warm ? "warm" : "steel")}
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              top: `${b.top}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="mq-vignette" aria-hidden="true" />

      <button type="button" className="mq-back" onClick={onClose}>
        <ArrowLeft size={14} /> {t("common.back")}
      </button>
      <div className="mq-lang" role="group" aria-label="Language">
        {(["es", "en"] as const).map((l) => (
          <button key={l} type="button" className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>

      <motion.main
        className="mq-container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.1 }}
      >
        <header className="mq-header">
          <div className="mq-brand">
            <LogoMark size={30} />
            <span className="mq-id">{t("login.access")}</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
            >
              {isLogin ? (
                <>
                  {t("login.welcome1")}
                  <br />
                  <span>{t("login.welcome2")}</span>
                </>
              ) : (
                <>
                  {t("login.create1")}
                  <br />
                  <span>{t("login.create2")}</span>
                </>
              )}
            </motion.h1>
          </AnimatePresence>
        </header>

        <form autoComplete="off" onSubmit={onSubmit}>
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="mq-group">
                  <label htmlFor="mq-name">{t("login.name")}</label>
                  <input id="mq-name" type="text" placeholder={t("login.namePlaceholder")} required autoFocus {...bind("name")} />
                  <div className="mq-glow" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mq-group">
            <label htmlFor="mq-email">{t("login.email")}</label>
            <input id="mq-email" type="email" placeholder="tu@correo.com" required autoFocus={isLogin} {...bind("email")} />
            <div className="mq-glow" />
          </div>

          <div className="mq-group">
            <label htmlFor="mq-pass">{t("login.password")}</label>
            <input id="mq-pass" type="password" placeholder={t("login.passwordPlaceholder")} required {...bind("password")} />
            <div className="mq-glow" />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="mq-error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertTriangle size={14} /> {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mq-submit">
            <div className="mq-drop" />
            <button type="submit" className="mq-btn" disabled={busy}>
              {busy ? t("login.wait") : isLogin ? t("land.signIn") : t("land.create")}
            </button>
          </div>
        </form>

        <footer className="mq-footer">
          <span>{isLogin ? t("login.noAccount") : t("login.hasAccount")}</span>
          <button type="button" onClick={onSwitchMode}>
            {isLogin ? t("login.toRegister") : t("login.toLogin")}
          </button>
        </footer>
      </motion.main>
    </div>
  )
}

const CSS = `
.mq-wrap{
  --mq-bg:#070708; --mq-text:#f5f5f5; --mq-dim:rgba(245,245,245,.5);
  --mq-amber:#ef4444; --mq-amber-soft:#f87171; --mq-steel:#ececec;
  position:absolute;inset:0;z-index:30;overflow:hidden;display:flex;-webkit-app-region:no-drag;align-items:center;justify-content:center;
  background:var(--mq-bg);color:var(--mq-text);font-family:'Inter Variable',system-ui,sans-serif;
}
.mq-wrap *{box-sizing:border-box}
.mq-svg{position:absolute;width:0;height:0}
.mq-stage{position:absolute;inset:0;z-index:0;filter:var(--mq-filter);opacity:.55}
.mq-blob{position:absolute;border-radius:50%;filter:blur(20px);animation:mq-float 20s infinite alternate ease-in-out;
  will-change:transform;transition:translate .35s ease-out}
.mq-blob.warm{background:linear-gradient(135deg,var(--mq-amber-soft),var(--mq-amber) 55%,#7f1d1d);
  box-shadow:inset -10px -10px 22px rgba(0,0,0,.5),8px 8px 34px rgba(239,68,68,.32)}
.mq-blob.steel{background:linear-gradient(135deg,var(--mq-steel),#9a9aa3 60%,#3f3f46);
  box-shadow:inset -10px -10px 22px rgba(0,0,0,.5),8px 8px 34px rgba(236,236,236,.18)}
@keyframes mq-float{
  0%{transform:translate(0,0) scale(1)}
  33%{transform:translate(10vw,20vh) scale(1.2)}
  66%{transform:translate(-5vw,10vh) scale(.8)}
  100%{transform:translate(5vw,-10vh) scale(1.1)}
}
.mq-vignette{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(ellipse 60% 70% at 50% 50%,rgba(7,7,8,.8),rgba(7,7,8,.38) 70%,transparent)}
.mq-back{position:absolute;z-index:12;top:40px;left:36px;display:inline-flex;align-items:center;gap:8px;padding:8px 14px;
  background:rgba(255,255,255,.04);color:var(--mq-dim);border:1px solid rgba(255,255,255,.1);border-radius:999px;
  font:500 12px 'Inter Variable',sans-serif;cursor:pointer;backdrop-filter:blur(8px);transition:color .2s,border-color .2s;-webkit-app-region:no-drag}
.mq-back:hover{color:var(--mq-text);border-color:rgba(255,255,255,.3)}
.mq-lang{position:absolute;z-index:12;top:40px;right:36px;display:flex;padding:3px;gap:2px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:999px;backdrop-filter:blur(8px)}
.mq-lang button{border:none;background:transparent;color:var(--mq-dim);padding:5px 12px;border-radius:999px;font:600 11px 'Inter Variable',sans-serif;letter-spacing:.08em;cursor:pointer;transition:background .2s,color .2s}
.mq-lang button.on{background:rgba(255,255,255,.12);color:var(--mq-text)}
.mq-container{position:relative;z-index:10;width:100%;max-width:460px;padding:40px}
.mq-header{margin-bottom:48px}
.mq-brand{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.mq-id{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--mq-dim)}
.mq-header h1{font-family:'Space Grotesk Variable','Inter Variable',sans-serif;font-weight:700;font-size:clamp(2.2rem,5vw,3.1rem);
  line-height:.92;letter-spacing:-2px;margin:0 0 0 -3px}
.mq-header h1 span{color:var(--mq-amber)}
.mq-group{position:relative;margin-bottom:30px;transition:transform .4s cubic-bezier(.2,1,.3,1)}
.mq-group:focus-within{transform:translateX(10px)}
.mq-group label{display:block;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;color:var(--mq-dim);
  margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em}
.mq-group input{width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.14);color:var(--mq-text);
  padding:12px 0;font:400 18px 'Inter Variable',sans-serif;outline:none;transition:border-color .4s}
.mq-group input::placeholder{color:rgba(238,241,246,.28);font-size:15px}
.mq-group input:-webkit-autofill{-webkit-text-fill-color:var(--mq-text);transition:background-color 9999s}
.mq-glow{position:absolute;bottom:0;left:0;width:100%;height:2px;background:var(--mq-amber);transform:scaleX(0);transform-origin:left;
  transition:transform .6s cubic-bezier(.2,1,.3,1);box-shadow:0 0 16px var(--mq-amber)}
.mq-group input:focus + .mq-glow{transform:scaleX(1)}
.mq-error{display:flex;align-items:flex-start;gap:8px;margin:-8px 0 22px;overflow:hidden;color:#ff7d7d;font-size:13px;line-height:1.4}
.mq-error svg{flex-shrink:0;margin-top:2px}
.mq-submit{margin-top:44px;position:relative;filter:var(--mq-filter)}
.mq-btn{width:100%;position:relative;z-index:2;padding:19px 40px;border:none;border-radius:14px;cursor:pointer;
  background:linear-gradient(135deg,var(--mq-amber-soft),#dc2626);color:#fff;
  font:800 14px 'Inter Variable',sans-serif;text-transform:uppercase;letter-spacing:2px;transition:letter-spacing .3s}
.mq-btn:hover:not(:disabled){letter-spacing:3.5px}
.mq-btn:disabled{opacity:.7;cursor:progress}
.mq-btn:focus-visible{outline:2px solid #fff;outline-offset:4px}
.mq-drop{position:absolute;top:50%;left:50%;width:100%;height:100%;background:#dc2626;z-index:1;border-radius:50px;
  transform:translate(-50%,-50%);transition:transform .5s cubic-bezier(.175,.885,.32,1.275),filter .5s}
.mq-submit:hover .mq-drop{transform:translate(-50%,-50%) scale(1.05,1.25);filter:brightness(1.15)}
.mq-footer{margin-top:36px;display:flex;justify-content:space-between;align-items:center;
  font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:10.5px;letter-spacing:.04em;color:var(--mq-dim)}
.mq-footer button{background:none;border:none;padding:0;color:var(--mq-text);font:inherit;letter-spacing:.08em;cursor:pointer;
  border-bottom:1px solid rgba(255,255,255,.25);transition:color .2s,border-color .2s}
.mq-footer button:hover{color:var(--mq-amber);border-color:var(--mq-amber)}
@media (prefers-reduced-motion:reduce){
  .mq-blob{animation:none}
  .mq-group,.mq-glow,.mq-drop,.mq-btn{transition:none}
}
`
