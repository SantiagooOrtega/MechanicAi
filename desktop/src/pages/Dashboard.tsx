import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Counter, Item, Stagger } from '../components/motion';
import { AlertOctagon, CalendarClock, Car, ClipboardList, FolderOpen, Plus, Stethoscope } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatDate, formatMoney, formatNumber, monthLabel, vehicleName } from '../format';
import type { DashboardData } from '../types';
import { Empty, ErrorAlert, PageHead, Spinner, UrgencyBadge } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useT();
  const { data, error, loading } = useAsync(() => api.get<DashboardData>('/dashboard'));

  if (loading) return <Spinner />;
  if (!data) return <div className="page"><ErrorAlert message={error} /></div>;

  const { totals, recent, upcoming, spending } = data;
  const max = Math.max(...spending.map((s) => s.total), 1);
  const stats = [
    { label: t('dash.stat.vehicles'), value: totals.vehicles, icon: Car, tone: '' },
    { label: t('dash.stat.diagnoses'), value: totals.diagnoses, icon: ClipboardList, tone: 'info' },
    { label: t('dash.stat.open'), value: totals.open, icon: FolderOpen, tone: 'ok' },
    { label: t('dash.stat.urgent'), value: totals.urgent, icon: AlertOctagon, tone: 'danger' },
  ];

  return (
    <div className="page">
      <PageHead
        title={t('dash.hello', { name: user?.name.split(' ')[0] ?? '' })}
        subtitle={t('dash.subtitle')}
        action={<Link to="/diagnosis/new" className="btn btn-primary btn-lg"><Stethoscope size={18} />{t('dash.newDiagnosis')}</Link>}
      />

      <Stagger className="grid grid-4" style={{ marginBottom: 18 }}>
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Item className="card stat" key={label}>
            <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
            <div className="stat-value"><Counter value={value} format={formatNumber} /></div>
            <div className="stat-label">{label}</div>
          </Item>
        ))}
      </Stagger>

      <Stagger className="grid grid-2">
        <Item className="card">
          <div className="card-title"><h3>{t('dash.recent')}</h3><Link to="/diagnoses">{t('dash.viewAll')}</Link></div>
          {recent.length === 0 ? (
            <Empty icon={Stethoscope} title={t('dash.emptyTitle')} text={t('dash.emptyText')}
              action={<Link to="/diagnosis/new" className="btn btn-primary"><Plus size={16} />{t('dash.createFirst')}</Link>} />
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
        </Item>

        <Item className="stack">
          <div className="card">
            <div className="card-title"><h3>{t('dash.upcoming')}</h3><Link to="/maintenance">{t('dash.viewEverything')}</Link></div>
            {upcoming.length === 0 ? (
              <p className="muted small">{t('dash.upcomingEmpty')}</p>
            ) : (
              <div className="list">
                {upcoming.map((m) => (
                  <div className="list-item" key={m.id}>
                    <div className="dot-icon"><CalendarClock size={18} /></div>
                    <div className="list-main">
                      <strong>{m.type}</strong>
                      <span>{m.vehicle_brand} {m.vehicle_model} · {formatDate(m.next_due_date!)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title"><h3>{t('dash.spending')}</h3></div>
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
