import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {
  ArrowLeftRight, Car, Check, ChevronLeft, ChevronRight, ChevronsUpDown,
  LayoutDashboard, LogOut, Stethoscope, Wrench, type LucideIcon,
} from 'lucide-react';
import { useT, type Key, type Lang } from '../../i18n';
import { LogoMark } from '../Logo';

/**
 * Sidebar colapsable: se contrae a íconos, tiene un grupo desplegable y un menú de ajustes
 * (idioma, tema, cambiar de usuario y cerrar sesión). Diseño basado en el Sidenavbar de 21st.dev.
 */

export type ThemeMode = 'dark' | 'light';

interface SidebarProps {
  user: { name: string; email: string };
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  onLogout: () => void;
  onSwitchUser: () => void;
}

const STORAGE_KEY = 'mechanicia.sidebar';

function Item({ to, icon: Icon, label, end, child, tip }: { to: string; icon?: LucideIcon; label: string; end?: boolean; child?: boolean; tip?: string }) {
  return (
    <NavLink to={to} end={end} className={'sb-link' + (child ? ' child' : '')} title={tip}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="sb-pill" className="sb-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
          {Icon && <Icon size={18} className="sb-icon" />}
          <span className="sb-label">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function CollapsibleSidebar({ user, theme, onThemeChange, onLogout, onSwitchUser }: SidebarProps) {
  const { t, lang, setLang } = useT();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'closed'; } catch { return true; }
  });
  const inDiagnosis = pathname.startsWith('/diagnos');
  const [groupOpen, setGroupOpen] = useState(inDiagnosis);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed'); } catch { /* ignorar */ }
  }, [open]);
  useEffect(() => { if (inDiagnosis) setGroupOpen(true); }, [inDiagnosis]);

  const toggleGroup = () => {
    if (!open) { setOpen(true); setGroupOpen(true); return; }
    setGroupOpen((g) => !g);
  };

  return (
    <motion.aside className="sb" data-open={open} initial={false} animate={{ width: open ? 256 : 76 }}
      transition={{ type: 'spring', stiffness: 320, damping: 36 }}>
      <button className="sb-edge" onClick={() => setOpen((o) => !o)} aria-label={open ? t('sidebar.collapse') : t('sidebar.expand')}
        title={open ? t('sidebar.collapse') : t('sidebar.expand')}>
        <motion.span animate={{ rotate: open ? 0 : 180 }} style={{ display: 'grid' }}><ChevronLeft size={14} /></motion.span>
      </button>

      <div className="sb-head">
        <motion.div initial={{ scale: 0.6, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }} whileHover={{ rotate: 60 }} style={{ display: 'grid', flexShrink: 0 }}>
          <LogoMark size={34} />
        </motion.div>
        <span className="sb-brand sb-label">Mechanic<span>IA</span></span>
      </div>

      <nav className="sb-nav">
        <div className="sb-section sb-label">{t('nav.menu')}</div>
        <Item to="/" end icon={LayoutDashboard} label={t('nav.dashboard')} tip={t('nav.dashboard')} />

        <button className={'sb-link sb-group' + (inDiagnosis ? ' has-active' : '')} onClick={toggleGroup}
          aria-expanded={groupOpen && open} title={t('nav.diagnosis')}>
          <Stethoscope size={18} className="sb-icon" />
          <span className="sb-label">{t('nav.diagnosis')}</span>
          <motion.span className="sb-chev sb-label" animate={{ rotate: groupOpen ? 90 : 0 }}><ChevronRight size={15} /></motion.span>
        </button>
        <AnimatePresence initial={false}>
          {groupOpen && open && (
            <motion.div key="children" className="sb-children" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
              <Item to="/diagnosis/new" label={t('nav.newDiagnosis')} child />
              <Item to="/diagnoses" label={t('nav.history')} child end />
            </motion.div>
          )}
        </AnimatePresence>

        <Item to="/vehicles" icon={Car} label={t('nav.vehicles')} tip={t('nav.vehicles')} />
        <Item to="/maintenance" icon={Wrench} label={t('nav.maintenance')} tip={t('nav.maintenance')} />
      </nav>

      <div className="sb-foot">
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button className="sb-user" title={t('settings.title')}>
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-meta sb-label">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <ChevronsUpDown size={15} className="sb-label sb-chev" />
            </button>
          </Dropdown.Trigger>

          <Dropdown.Portal>
            <Dropdown.Content className="dd" side="top" align="start" sideOffset={10} collisionPadding={12}>
              <Dropdown.Label className="dd-label">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </Dropdown.Label>
              <Dropdown.Separator className="dd-sep" />

              <Dropdown.Label className="dd-section">{t('settings.language')}</Dropdown.Label>
              <Dropdown.RadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
                {(['es', 'en'] as const).map((l) => (
                  <Dropdown.RadioItem key={l} value={l} className="dd-item">
                    <span>{t(`lang.${l}` as Key)}</span>
                    <Dropdown.ItemIndicator className="dd-check"><Check size={15} /></Dropdown.ItemIndicator>
                  </Dropdown.RadioItem>
                ))}
              </Dropdown.RadioGroup>
              <Dropdown.Separator className="dd-sep" />

              <Dropdown.Label className="dd-section">{t('settings.theme')}</Dropdown.Label>
              <Dropdown.RadioGroup value={theme} onValueChange={(v) => onThemeChange(v as ThemeMode)}>
                {(['dark', 'light'] as const).map((m) => (
                  <Dropdown.RadioItem key={m} value={m} className="dd-item">
                    <span>{t(`theme.${m}` as Key)}</span>
                    <Dropdown.ItemIndicator className="dd-check"><Check size={15} /></Dropdown.ItemIndicator>
                  </Dropdown.RadioItem>
                ))}
              </Dropdown.RadioGroup>
              <Dropdown.Separator className="dd-sep" />

              <Dropdown.Item className="dd-item" onSelect={onSwitchUser}>
                <ArrowLeftRight size={16} /><span>{t('user.switch')}</span>
              </Dropdown.Item>
              <Dropdown.Item className="dd-item danger" onSelect={onLogout}>
                <LogOut size={16} /><span>{t('user.logout')}</span>
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </div>
    </motion.aside>
  );
}
