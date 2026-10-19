import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'es' | 'en';
const LANG_KEY = 'mechanicia.lang';

const es = {
  // Navegación
  'nav.menu': 'Menú',
  'nav.dashboard': 'Panel',
  'nav.diagnosis': 'Diagnóstico',
  'nav.newDiagnosis': 'Nuevo diagnóstico',
  'nav.history': 'Historial',
  'nav.vehicles': 'Mis vehículos',
  'nav.maintenance': 'Mantenimiento',
  'sidebar.collapse': 'Contraer menú',
  'sidebar.expand': 'Expandir menú',
  'settings.title': 'Ajustes',
  'settings.language': 'Idioma',
  'settings.theme': 'Tema',
  'settings.account': 'Cuenta',
  'theme.dark': 'Oscuro',
  'theme.light': 'Claro',
  'lang.es': 'Español',
  'lang.en': 'English',
  'user.switch': 'Cambiar de usuario',
  'user.logout': 'Cerrar sesión',

  // Común
  'common.close': 'Cerrar',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.saving': 'Guardando...',
  'common.back': 'Volver',
  'common.noVehicle': 'Sin vehículo asociado',
  'urgency.low': 'Urgencia baja',
  'urgency.medium': 'Urgencia media',
  'urgency.high': 'Urgencia alta',
  'urgency.critical': 'Urgencia crítica',
  'fuel.gasoline': 'Gasolina',
  'fuel.diesel': 'Diésel',
  'fuel.hybrid': 'Híbrido',
  'fuel.electric': 'Eléctrico',

  // Panel
  'dash.hello': 'Hola, {name}',
  'dash.subtitle': 'Este es el estado de tus vehículos.',
  'dash.newDiagnosis': 'Nuevo diagnóstico',
  'dash.stat.vehicles': 'Vehículos',
  'dash.stat.diagnoses': 'Diagnósticos',
  'dash.stat.open': 'Casos abiertos',
  'dash.stat.urgent': 'Urgentes',
  'dash.recent': 'Diagnósticos recientes',
  'dash.viewAll': 'Ver todos',
  'dash.emptyTitle': 'Aún no hay diagnósticos',
  'dash.emptyText': 'Describe un problema de tu vehículo y la IA te ayudará a entenderlo.',
  'dash.createFirst': 'Crear el primero',
  'dash.upcoming': 'Próximos servicios',
  'dash.viewEverything': 'Ver todo',
  'dash.upcomingEmpty': 'Registra un mantenimiento con fecha de próximo servicio y aparecerá aquí.',
  'dash.spending': 'Gasto en mantenimiento',
  'dash.spendingEmpty': 'Sin gastos registrados en los últimos meses.',

  // Vehículos
  'veh.title': 'Mis vehículos',
  'veh.subtitle': 'Con los datos de tu vehículo, los diagnósticos son más precisos.',
  'veh.add': 'Agregar vehículo',
  'veh.emptyTitle': 'Sin vehículos',
  'veh.emptyText': 'Agrega tu primer vehículo para asociarle diagnósticos y mantenimiento.',
  'veh.mileage': 'Kilometraje',
  'veh.fuel': 'Combustible',
  'veh.diagnose': 'Diagnosticar',
  'veh.edit': 'Editar',
  'veh.delete': 'Eliminar',
  'veh.confirmDelete': '¿Eliminar {name}? Se borrará también su mantenimiento.',
  'veh.modalNew': 'Nuevo vehículo',
  'veh.modalEdit': 'Editar vehículo',
  'veh.brand': 'Marca',
  'veh.model': 'Modelo',
  'veh.year': 'Año',
  'veh.plate': 'Placa (opcional)',

  // Nuevo diagnóstico
  'new.title': 'Nuevo diagnóstico',
  'new.subtitle': 'Cuanto más detalle des, más útil será el análisis.',
  'new.vehicle': 'Vehículo',
  'new.unspecified': 'Sin especificar',
  'new.noVehiclesA': 'Aún no tienes vehículos.',
  'new.noVehiclesLink': 'Agrega uno',
  'new.noVehiclesB': 'para un análisis más preciso.',
  'new.whatHappens': '¿Qué le pasa a tu vehículo?',
  'new.placeholder': 'Ej: Al arrancar en frío hace un ruido metálico que desaparece a los pocos segundos. Hoy se encendió la luz del motor.',
  'new.obd': 'Códigos OBD-II (opcional)',
  'new.addCode': 'Agregar',
  'new.invalidCode': 'Código OBD-II inválido. Usa el formato P0301.',
  'new.removeCode': 'Quitar {code}',
  'new.disclaimer': 'Es una orientación. Ante dudas de seguridad, consulta a un taller.',
  'new.analyze': 'Analizar con IA',
  'new.analyzingTitle': 'Analizando el problema',
  'new.analyzingText': 'Estoy revisando los síntomas y los códigos. Puede tardar unos segundos.',

  // Historial
  'hist.title': 'Historial',
  'hist.subtitle': 'Todos tus diagnósticos en un solo lugar.',
  'hist.new': 'Nuevo diagnóstico',
  'hist.all': 'Todos',
  'hist.open': 'Abiertos',
  'hist.resolved': 'Resueltos',
  'hist.emptyTitle': 'Nada por aquí',
  'hist.emptyText': 'No hay diagnósticos con este filtro.',
  'hist.badgeResolved': 'Resuelto',

  // Detalle
  'diag.back': 'Historial',
  'diag.markResolved': 'Marcar resuelto',
  'diag.reopen': 'Reabrir',
  'diag.delete': 'Eliminar',
  'diag.confirmDelete': '¿Eliminar este diagnóstico y su conversación?',
  'diag.canDrive': 'Puedes conducirlo con precaución',
  'diag.cannotDrive': 'No se recomienda conducirlo',
  'diag.described': 'Lo que describiste',
  'diag.causes': 'Causas probables',
  'diag.steps': 'Qué hacer',
  'diag.conversation': 'Conversación',
  'diag.refine': 'Para afinar el diagnóstico, responde:',
  'diag.askPlaceholder': 'Haz una pregunta sobre este caso',
  'diag.send': 'Enviar',

  // Mantenimiento
  'mnt.title': 'Mantenimiento',
  'mnt.subtitleEmpty': 'Registra cada servicio de tus vehículos.',
  'mnt.subtitleCount': '{n} servicios · {total} en total',
  'mnt.register': 'Registrar servicio',
  'mnt.emptyNoVehTitle': 'Primero agrega un vehículo',
  'mnt.emptyNoVehText': 'El mantenimiento se registra sobre un vehículo.',
  'mnt.emptyTitle': 'Sin servicios registrados',
  'mnt.emptyText': 'Anota cambios de aceite, frenos o revisiones para llevar el control.',
  'mnt.next': 'Próximo {date}',
  'mnt.confirmDelete': '¿Eliminar este registro?',
  'mnt.service': 'Servicio',
  'mnt.servicePlaceholder': 'Cambio de aceite',
  'mnt.date': 'Fecha',
  'mnt.cost': 'Costo (USD)',
  'mnt.nextDate': 'Próximo servicio (fecha)',
  'mnt.notes': 'Notas',

  // Portada y acceso
  'land.eyebrow': 'Mecánico inteligente — IA + OBD-II',
  'land.headline': 'Tu vehículo habla.\nLa IA te lo traduce.',
  'land.accent': 'La IA te lo traduce.',
  'land.body': 'Describe el síntoma, agrega los códigos de tu escáner y recibe causas probables, urgencia y los pasos a seguir, antes de llegar al taller.',
  'land.create': 'Crear cuenta',
  'land.haveAccount': 'Ya tengo cuenta',
  'land.hint': 'Pasa el cursor por la escultura',
  'land.backdrop': 'mecánica',
  'land.signIn': 'Iniciar sesión',
  'login.access': 'MechanicIA · Acceso',
  'login.welcome1': 'BIENVENIDO',
  'login.welcome2': 'DE VUELTA',
  'login.create1': 'CREA TU',
  'login.create2': 'CUENTA',
  'login.name': 'Nombre',
  'login.namePlaceholder': 'Tu nombre',
  'login.email': 'Correo electrónico',
  'login.password': 'Contraseña',
  'login.passwordPlaceholder': 'Mínimo 6 caracteres y un número',
  'login.wait': 'Un momento...',
  'login.noAccount': '¿Aún sin cuenta?',
  'login.hasAccount': '¿Ya tienes cuenta?',
  'login.toRegister': 'CREAR CUENTA',
  'login.toLogin': 'INICIAR SESIÓN',
} as const;

export type Key = keyof typeof es;

const en: Record<Key, string> = {
  'nav.menu': 'Menu',
  'nav.dashboard': 'Dashboard',
  'nav.diagnosis': 'Diagnosis',
  'nav.newDiagnosis': 'New diagnosis',
  'nav.history': 'History',
  'nav.vehicles': 'My vehicles',
  'nav.maintenance': 'Maintenance',
  'sidebar.collapse': 'Collapse menu',
  'sidebar.expand': 'Expand menu',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.account': 'Account',
  'theme.dark': 'Dark',
  'theme.light': 'Light',
  'lang.es': 'Español',
  'lang.en': 'English',
  'user.switch': 'Switch user',
  'user.logout': 'Log out',

  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.back': 'Back',
  'common.noVehicle': 'No vehicle linked',
  'urgency.low': 'Low urgency',
  'urgency.medium': 'Medium urgency',
  'urgency.high': 'High urgency',
  'urgency.critical': 'Critical urgency',
  'fuel.gasoline': 'Gasoline',
  'fuel.diesel': 'Diesel',
  'fuel.hybrid': 'Hybrid',
  'fuel.electric': 'Electric',

  'dash.hello': 'Hello, {name}',
  'dash.subtitle': 'This is the status of your vehicles.',
  'dash.newDiagnosis': 'New diagnosis',
  'dash.stat.vehicles': 'Vehicles',
  'dash.stat.diagnoses': 'Diagnoses',
  'dash.stat.open': 'Open cases',
  'dash.stat.urgent': 'Urgent',
  'dash.recent': 'Recent diagnoses',
  'dash.viewAll': 'View all',
  'dash.emptyTitle': 'No diagnoses yet',
  'dash.emptyText': 'Describe a problem with your vehicle and the AI will help you understand it.',
  'dash.createFirst': 'Create the first one',
  'dash.upcoming': 'Upcoming services',
  'dash.viewEverything': 'View all',
  'dash.upcomingEmpty': 'Log a maintenance record with a next service date and it will show up here.',
  'dash.spending': 'Maintenance spending',
  'dash.spendingEmpty': 'No expenses recorded in recent months.',

  'veh.title': 'My vehicles',
  'veh.subtitle': 'With your vehicle data, diagnoses are more accurate.',
  'veh.add': 'Add vehicle',
  'veh.emptyTitle': 'No vehicles',
  'veh.emptyText': 'Add your first vehicle to link diagnoses and maintenance to it.',
  'veh.mileage': 'Mileage',
  'veh.fuel': 'Fuel',
  'veh.diagnose': 'Diagnose',
  'veh.edit': 'Edit',
  'veh.delete': 'Delete',
  'veh.confirmDelete': 'Delete {name}? Its maintenance records will be deleted too.',
  'veh.modalNew': 'New vehicle',
  'veh.modalEdit': 'Edit vehicle',
  'veh.brand': 'Make',
  'veh.model': 'Model',
  'veh.year': 'Year',
  'veh.plate': 'Plate (optional)',

  'new.title': 'New diagnosis',
  'new.subtitle': 'The more detail you give, the more useful the analysis.',
  'new.vehicle': 'Vehicle',
  'new.unspecified': 'Unspecified',
  'new.noVehiclesA': "You don't have any vehicles yet.",
  'new.noVehiclesLink': 'Add one',
  'new.noVehiclesB': 'for a more accurate analysis.',
  'new.whatHappens': "What's wrong with your vehicle?",
  'new.placeholder': 'E.g. On a cold start it makes a metallic noise that fades after a few seconds. Today the engine light came on.',
  'new.obd': 'OBD-II codes (optional)',
  'new.addCode': 'Add',
  'new.invalidCode': 'Invalid OBD-II code. Use the format P0301.',
  'new.removeCode': 'Remove {code}',
  'new.disclaimer': "This is guidance only. If you have safety doubts, see a mechanic.",
  'new.analyze': 'Analyze with AI',
  'new.analyzingTitle': 'Analyzing the problem',
  'new.analyzingText': "I'm reviewing the symptoms and codes. It may take a few seconds.",

  'hist.title': 'History',
  'hist.subtitle': 'All your diagnoses in one place.',
  'hist.new': 'New diagnosis',
  'hist.all': 'All',
  'hist.open': 'Open',
  'hist.resolved': 'Resolved',
  'hist.emptyTitle': 'Nothing here',
  'hist.emptyText': 'There are no diagnoses with this filter.',
  'hist.badgeResolved': 'Resolved',

  'diag.back': 'History',
  'diag.markResolved': 'Mark as resolved',
  'diag.reopen': 'Reopen',
  'diag.delete': 'Delete',
  'diag.confirmDelete': 'Delete this diagnosis and its conversation?',
  'diag.canDrive': 'You can drive it with caution',
  'diag.cannotDrive': 'Driving it is not recommended',
  'diag.described': 'What you described',
  'diag.causes': 'Likely causes',
  'diag.steps': 'What to do',
  'diag.conversation': 'Conversation',
  'diag.refine': 'To refine the diagnosis, answer:',
  'diag.askPlaceholder': 'Ask a question about this case',
  'diag.send': 'Send',

  'mnt.title': 'Maintenance',
  'mnt.subtitleEmpty': 'Log every service for your vehicles.',
  'mnt.subtitleCount': '{n} services · {total} total',
  'mnt.register': 'Log service',
  'mnt.emptyNoVehTitle': 'Add a vehicle first',
  'mnt.emptyNoVehText': 'Maintenance is logged against a vehicle.',
  'mnt.emptyTitle': 'No services logged',
  'mnt.emptyText': 'Note oil changes, brakes or inspections to keep track.',
  'mnt.next': 'Next {date}',
  'mnt.confirmDelete': 'Delete this record?',
  'mnt.service': 'Service',
  'mnt.servicePlaceholder': 'Oil change',
  'mnt.date': 'Date',
  'mnt.cost': 'Cost (USD)',
  'mnt.nextDate': 'Next service (date)',
  'mnt.notes': 'Notes',

  'land.eyebrow': 'Smart mechanic — AI + OBD-II',
  'land.headline': 'Your vehicle speaks.\nAI translates it for you.',
  'land.accent': 'AI translates it for you.',
  'land.body': 'Describe the symptom, add your scanner codes and get likely causes, urgency and the steps to follow, before you get to the shop.',
  'land.create': 'Create account',
  'land.haveAccount': 'I already have an account',
  'land.hint': 'Move the cursor over the sculpture',
  'land.backdrop': 'mechanic',
  'land.signIn': 'Sign in',
  'login.access': 'MechanicIA · Access',
  'login.welcome1': 'WELCOME',
  'login.welcome2': 'BACK',
  'login.create1': 'CREATE YOUR',
  'login.create2': 'ACCOUNT',
  'login.name': 'Name',
  'login.namePlaceholder': 'Your name',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'At least 6 characters and a number',
  'login.wait': 'One moment...',
  'login.noAccount': 'No account yet?',
  'login.hasAccount': 'Already have an account?',
  'login.toRegister': 'CREATE ACCOUNT',
  'login.toLogin': 'SIGN IN',
};

const DICTS: Record<Lang, Record<Key, string>> = { es, en };

/** Idioma activo, accesible fuera de React (formatos de fecha, cabecera de la API) */
let current: Lang = readStoredLang();
export const getLang = (): Lang => current;
export const getLocale = () => (current === 'en' ? 'en-US' : 'es');

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'en' || v === 'es') return v;
  } catch { /* sin almacenamiento */ }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  const setLang = useCallback((l: Lang) => {
    current = l;
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* ignorar */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo<I18nState>(() => ({
    lang,
    setLang,
    t: (key, vars) => {
      let text = DICTS[lang][key];
      if (vars) for (const k of Object.keys(vars)) text = text.replace(`{${k}}`, String(vars[k]));
      return text;
    },
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT debe usarse dentro de I18nProvider');
  return ctx;
}
