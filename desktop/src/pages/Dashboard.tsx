import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Counter, Item, Stagger } from '../components/motion';
import { AlertOctagon, ArrowRight, CalendarClock, Car, Check, ClipboardList, FolderOpen, ListTodo, Lock, PartyPopper, Plus, Stethoscope, Wrench } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatDate, formatMoney, formatNumber, monthLabel, vehicleName } from '../format';
import type { DashboardData } from '../types';
import { Empty, ErrorAlert, Spinner, UrgencyBadge } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useT();
  const { data, error, loading } = useAsync(() => api.get<DashboardData>('/dashboard'));

  if (loading) return <Spinner />;
  if (!data) return <div className="page"><ErrorAlert message={error} /></div>;

  const { totals, recent, upcoming, spending, pending } = data;
  const pendingCount = pending.length + upcoming.length;
  const max = Math.max(...spending.map((s) => s.total), 1);
  const stats = [
    { label: t('dash.stat.vehicles'), value: totals.vehicles, icon: Car, tone: '', to: '/vehicles' },
    { label: t('dash.stat.diagnoses'), value: totals.diagnoses, icon: ClipboardList, tone: 'info', to: '/diagnoses' },
    { label: t('dash.stat.open'), value: totals.open, icon: FolderOpen, tone: 'ok', to: '/diagnoses?status=open' },
    { label: t('dash.stat.urgent'), value: totals.urgent, icon: AlertOctagon, tone: 'danger', to: '/diagnoses?status=open' },
  ];

  return (
    <div className="page">
      <section className="dash-hero">
        <div className="dash-hero-text">
          <h1>{t('dash.hello', { name: user?.name.split(' ')[0] ?? '' })}</h1>
          <p>{totals.vehicles === 0 ? t('hero.empty')
            : totals.urgent > 0 ? t('hero.urgent', { n: String(totals.urgent) })
            : totals.open > 0 ? t('hero.open', { n: String(totals.open) })
            : t('hero.ok')}</p>
        </div>
        <Stagger className="quick-actions">
          {[
            { to: totals.vehicles === 0 ? '/vehicles?add=1&next=diagnose' : '/diagnosis/new', icon: Stethoscope, title: t('qa.diagnose'), text: t('qa.diagnoseText'), primary: totals.vehicles > 0 },
            { to: '/vehicles?add=1', icon: Car, title: t('qa.vehicle'), text: t('qa.vehicleText'), primary: totals.vehicles === 0 },
            { to: '/maintenance', icon: Wrench, title: t('qa.maintenance'), text: t('qa.maintenanceText'), primary: false },
          ].map(({ to, icon: Icon, title, text, primary }) => (
            <Item key={title}>
              <Link to={to} className={`qa-tile${primary ? ' primary' : ''}`}>
                <span className="qa-icon"><Icon size={22} /></span>
                <span className="qa-text"><strong>{title}</strong><small>{text}</small></span>
                <ArrowRight size={18} className="qa-arrow" />
              </Link>
            </Item>
          ))}
        </Stagger>
      </section>

      <GettingStarted vehicles={totals.vehicles} diagnoses={totals.diagnoses} maintenance={totals.maintenance} />

      <Stagger className="grid grid-4" style={{ marginBottom: 18 }}>
        {stats.map(({ label, value, icon: Icon, tone, to }) => (
          <Item key={label}><Link to={to} className="card stat stat-link">
            <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
            <div className="stat-body">
              <div className="stat-value"><Counter value={value} format={formatNumber} /></div>
              <div className="stat-label">{label}</div>
            </div>
            <ArrowRight size={16} className="stat-arrow" />
          </Link></Item>
        ))}
      </Stagger>

      <Stagger className="grid grid-2">
        <Item className="card pending">
          <div className="card-title"><h3><ListTodo size={18} /> {t('pend.title')}</h3>
            {pendingCount > 0 && <span className="pending-count">{pendingCount}</span>}</div>
          {pendingCount === 0 ? (
            <div className="pending-empty"><PartyPopper size={26} /><strong>{t('pend.emptyTitle')}</strong><span>{t('pend.emptyText')}</span></div>
          ) : (
            <div className="list">
              {pending.map((d) => (
                <Link key={d.id} to={`/diagnoses/${d.id}`} className="list-item pending-item">
                  <div className={`dot-icon urg-${d.urgency ?? 'low'}`}><Stethoscope size={17} /></div>
                  <div className="list-main">
                    <strong>{d.symptoms}</strong>
                    <span>{vehicleName({ brand: d.vehicle_brand, model: d.vehicle_model, year: d.vehicle_year }, t('common.noVehicle'))} · {t('pend.openCase')}</span>
                  </div>
                  <UrgencyBadge urgency={d.urgency} />
                </Link>
              ))}
              {upcoming.map((m) => (
                <Link key={m.id} to="/maintenance" className="list-item pending-item">
                  <div className="dot-icon"><CalendarClock size={17} /></div>
                  <div className="list-main">
                    <strong>{m.type}</strong>
                    <span>{m.vehicle_brand} {m.vehicle_model} · {t('pend.serviceOn', { date: formatDate(m.next_due_date!) })}</span>
                  </div>
                  <span className="badge">{t('pend.service')}</span>
                </Link>
              ))}
            </div>
          )}
        </Item>

        <Item className="stack">
          <div className="card">
            <div className="card-title"><h3>{t('dash.recent')}</h3><Link to="/diagnoses">{t('dash.viewAll')}</Link></div>
            {recent.length === 0 ? (
              <Empty icon={Stethoscope} title={t('dash.emptyTitle')} text={t('dash.emptyText')}
                action={totals.vehicles === 0
                  ? <Link to="/vehicles?add=1" className="btn btn-primary"><Car size={16} />{t('dash.registerVehicle')}</Link>
                  : <Link to="/diagnosis/new" className="btn btn-primary"><Plus size={16} />{t('dash.createFirst')}</Link>} />
            ) : (
              <Stagger className="list">
                {recent.map((d) => (
                  <Item key={d.id}><Link to={`/diagnoses/${d.id}`} className="list-item">
                    <div className="list-main">
                      <strong>{d.symptoms}</strong>
                      <span>{vehicleName({ brand: d.vehicle_brand, model: d.vehicle_model, year: d.vehicle_year }, t('common.noVehicle'))} · {formatDate(d.created_at)}</span>
                    </div>
                    <UrgencyBadge urgency={d.urgency} />
                  </Link></Item>
                ))}
              </Stagger>
            )}
          </div>

          <div className="card">
            <div className="card-title"><h3>{t('dash.spending')}</h3><Link to="/maintenance">{t('dash.viewEverything')}</Link></div>
            {spending.length === 0 ? (
              <p className="muted small">{t('dash.spendingEmpty')}</p>
            ) : (
              <div className="bars">
                {spending.map((s) => (
                  <div className="bar-col" key={s.month}>
                    <span>{formatMoney(s.total)}</span>
                    <motion.div className="col" style={{ height: `${Math.max((s.total / max) * 100, 4)}%`, transformOrigin: 'bottom' }}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.3 }} />
                    <small>{monthLabel(s.month)}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Item>
      </Stagger>
    </div>
  );
}

/** Guía de primeros pasos: se muestra hasta completar los 3 pasos, en orden */
function GettingStarted({ vehicles, diagnoses, maintenance }: { vehicles: number; diagnoses: number; maintenance: number }) {
  const { t } = useT();
  const steps = [
    { done: vehicles > 0, icon: Car, key: 's1' as const, to: '/vehicles?add=1' },
    { done: diagnoses > 0, icon: Stethoscope, key: 's2' as const, to: '/diagnosis/new' },
    { done: maintenance > 0, icon: Wrench, key: 's3' as const, to: '/maintenance' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const current = steps.findIndex((s) => !s.done);

  return (
    <motion.section className="card guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="guide-head">
        <h3>{t('guide.title')}</h3>
        <span className="guide-progress">{t('guide.progress', { done: String(doneCount) })}</span>
      </div>
      <div className="guide-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${(doneCount / steps.length) * 100}%` }} transition={{ duration: 0.6 }} /></div>
      <ol className="guide-steps">
        {steps.map((s, i) => {
          const state = s.done ? 'done' : i === current ? 'current' : 'locked';
          const Icon = s.icon;
          return (
            <li key={s.key} className={`guide-step ${state}`}>
              <div className="guide-num">{s.done ? <Check size={16} /> : state === 'locked' ? <Lock size={14} /> : i + 1}</div>
              <div className="guide-body">
                <strong><Icon size={15} /> {t(`guide.${s.key}.title`)}</strong>
                <p>{t(`guide.${s.key}.text`)}</p>
                {state === 'current' && (
                  <Link to={s.to} className="btn btn-primary btn-sm">{t(`guide.${s.key}.cta`)} <ArrowRight size={14} /></Link>
                )}
                {state === 'locked' && <span className="guide-locked">{t('guide.locked')}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </motion.section>
  );
}
