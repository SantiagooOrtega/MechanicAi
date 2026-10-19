import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../auth';
import CollapsibleSidebar, { type ThemeMode } from './ui/collapsible-sidebar';

function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    localStorage.getItem('mechanicia.theme') === 'light' ? 'light' : 'dark'
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mechanicia.theme', theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

export const SWITCH_USER_FLAG = 'mechanicia.openLogin';

export default function Layout() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useTheme();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [pathname]);

  // "Cambiar de usuario": cierra la sesión y abre directamente el acceso
  const switchUser = () => {
    try { sessionStorage.setItem(SWITCH_USER_FLAG, '1'); } catch { /* ignorar */ }
    logout();
  };

  return (
    <div className="app">
      {user && (
        <CollapsibleSidebar user={user} theme={theme} onThemeChange={setTheme} onLogout={logout} onSwitchUser={switchUser} />
      )}
      <main className="main" ref={mainRef}>
        <motion.div key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
