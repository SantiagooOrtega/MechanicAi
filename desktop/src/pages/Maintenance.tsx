import { useState, type FormEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import { Item, Stagger } from '../components/motion';
import { CalendarClock, Plus, Trash2, Wrench } from 'lucide-react';
import { api } from '../api';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatDate, formatMoney, formatNumber } from '../format';
import type { MaintenanceRecord, Vehicle } from '../types';
import { Empty, ErrorAlert, Field, Modal, PageHead, Spinner } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const blank = { vehicle_id: '', type: '', service_date: today(), mileage: '', cost: '', next_due_date: '', next_due_mileage: '', notes: '' };

export default function Maintenance() {
  const { t } = useT();
  const records = useAsync(() => api.get<{ records: MaintenanceRecord[] }>('/maintenance'));
  const vehicles = useAsync(() => api.get<{ vehicles: Vehicle[] }>('/vehicles'));
  const [draft, setDraft] = useState<typeof blank | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft((cur) => cur && { ...cur, [k]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.post('/maintenance', {
        vehicle_id: draft.vehicle_id,
        type: draft.type,
        service_date: draft.service_date,
        mileage: draft.mileage ? Number(draft.mileage) : undefined,
        cost: draft.cost ? Number(draft.cost) : undefined,
        next_due_date: draft.next_due_date || undefined,
        next_due_mileage: draft.next_due_mileage ? Number(draft.next_due_mileage) : undefined,
        notes: draft.notes || undefined,
      });
      setDraft(null);
      records.reload();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t('mnt.confirmDelete'))) return;
    await api.delete(`/maintenance/${id}`);
    records.reload();
  }

  if (records.loading || vehicles.loading) return <Spinner />;
  const list = records.data?.records ?? [];
  const vs = vehicles.data?.vehicles ?? [];
  const total = list.reduce((s, r) => s + Number(r.cost), 0);

  return (
    <div className="page">
      <PageHead title={t('mnt.title')} subtitle={list.length ? t('mnt.subtitleCount', { n: list.length, total: formatMoney(total) }) : t('mnt.subtitleEmpty')}
        action={<button className="btn btn-primary" disabled={vs.length === 0} onClick={() => { setFormError(null); setDraft({ ...blank, vehicle_id: vs[0].id }); }}><Plus size={16} />{t('mnt.register')}</button>} />
      <ErrorAlert message={records.error} />

      <div className="card">
        {vs.length === 0 ? (
          <Empty icon={Wrench} title={t('mnt.emptyNoVehTitle')} text={t('mnt.emptyNoVehText')} />
        ) : list.length === 0 ? (
          <Empty icon={Wrench} title={t('mnt.emptyTitle')} text={t('mnt.emptyText')} />
        ) : (
          <Stagger className="list">
            {list.map((r) => (
              <Item className="list-item" key={r.id}>
                <div className="dot-icon"><Wrench size={18} /></div>
                <div className="list-main">
                  <strong>{r.type}</strong>
                  <span>
                    {r.vehicle_brand} {r.vehicle_model} · {formatDate(r.service_date)}
                    {r.mileage > 0 && ` · ${formatNumber(r.mileage)} km`}
                  </span>
                  {r.notes && <span className="faint">{r.notes}</span>}
                </div>
                {r.next_due_date && <span className="badge badge-neutral"><CalendarClock size={12} />{t('mnt.next', { date: formatDate(r.next_due_date) })}</span>}
                <strong style={{ minWidth: 70, textAlign: 'right' }}>{formatMoney(r.cost)}</strong>
                <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => remove(r.id)} aria-label={t('veh.delete')}><Trash2 size={15} /></button>
              </Item>
            ))}
          </Stagger>
        )}
      </div>

      <AnimatePresence>
      {draft && (
        <Modal title={t('mnt.register')} onClose={() => setDraft(null)}>
          <form onSubmit={save} className="stack">
            <ErrorAlert message={formError} />
            <div className="form-grid">
              <Field label={t('new.vehicle')}>
                <select className="select" value={draft.vehicle_id} onChange={set('vehicle_id')}>
                  {vs.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year}</option>)}
                </select>
              </Field>
              <Field label={t('mnt.service')}><input className="input" value={draft.type} onChange={set('type')} placeholder={t('mnt.servicePlaceholder')} required autoFocus /></Field>
              <Field label={t('mnt.date')}><input className="input" type="date" value={draft.service_date} onChange={set('service_date')} required /></Field>
              <Field label={t('veh.mileage')}><input className="input" type="number" min={0} value={draft.mileage} onChange={set('mileage')} /></Field>
              <Field label={t('mnt.cost')}><input className="input" type="number" min={0} step="0.01" value={draft.cost} onChange={set('cost')} /></Field>
              <Field label={t('mnt.nextDate')}><input className="input" type="date" value={draft.next_due_date} onChange={set('next_due_date')} /></Field>
              <div className="full"><Field label={t('mnt.notes')}><textarea className="textarea" style={{ minHeight: 70 }} value={draft.notes} onChange={set('notes')} /></Field></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setDraft(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</button>
            </div>
          </form>
        </Modal>
      )}
      </AnimatePresence>
    </div>
  );
}
