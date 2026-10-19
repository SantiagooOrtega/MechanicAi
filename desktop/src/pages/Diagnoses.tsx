import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Item, Stagger } from '../components/motion';
import { CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import { api } from '../api';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatDate, vehicleName } from '../format';
import type { DiagnosisSummary } from '../types';
import { Empty, ErrorAlert, PageHead, Spinner, UrgencyBadge } from '../components/ui';

type Filter = 'all' | 'open' | 'resolved';

export default function Diagnoses() {
  const { t } = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const { data, loading, error } = useAsync(
    () => api.get<{ diagnoses: DiagnosisSummary[] }>(`/diagnoses${filter === 'all' ? '' : `?status=${filter}`}`),
    [filter]
  );

  return (
    <div className="page">
      <PageHead title={t('hist.title')} subtitle={t('hist.subtitle')}
        action={<Link to="/diagnosis/new" className="btn btn-primary"><Plus size={16} />{t('hist.new')}</Link>} />
      <div style={{ marginBottom: 16 }}>
        <div className="segmented">
          {([['all', t('hist.all')], ['open', t('hist.open')], ['resolved', t('hist.resolved')]] as const).map(([k, l]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      <ErrorAlert message={error} />
      <div className="card">
        {loading ? <Spinner /> : !data?.diagnoses.length ? (
          <Empty icon={ClipboardList} title={t('hist.emptyTitle')} text={t('hist.emptyText')} />
        ) : (
          <Stagger className="list" key={filter}>
            {data.diagnoses.map((d) => (
              <Item key={d.id}><Link to={`/diagnoses/${d.id}`} className="list-item">
                <div className="list-main">
                  <strong>{d.symptoms}</strong>
                  <span>
                    {vehicleName({ brand: d.vehicle_brand, model: d.vehicle_model, year: d.vehicle_year }, t('common.noVehicle'))} · {formatDate(d.created_at)}
                    {d.obd_codes.length > 0 && ` · ${d.obd_codes.join(', ')}`}
                  </span>
                </div>
                {d.status === 'resolved' && <span className="badge badge-ok"><CheckCircle2 size={12} />{t('hist.badgeResolved')}</span>}
                <UrgencyBadge urgency={d.urgency} />
              </Link></Item>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
