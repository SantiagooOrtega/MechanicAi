import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Stagger, itemVariants } from '../components/motion';
import { Car, Pencil, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatNumber } from '../format';
import type { Fuel, Vehicle } from '../types';
import { Empty, ErrorAlert, Field, Modal, PageHead, Spinner } from '../components/ui';

type Draft = { brand: string; model: string; year: string; plate: string; mileage: string; fuel: Fuel };
const blank: Draft = { brand: '', model: '', year: String(new Date().getFullYear()), plate: '', mileage: '0', fuel: 'gasoline' };

export default function Vehicles() {
  const { t } = useT();
  const { data, loading, error, reload } = useAsync(() => api.get<{ vehicles: Vehicle[] }>('/vehicles'));
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (v?: Vehicle) => {
    setFormError(null);
    setEditing({
      id: v?.id,
      draft: v ? { brand: v.brand, model: v.model, year: String(v.year), plate: v.plate ?? '', mileage: String(v.mileage), fuel: v.fuel } : blank,
    });
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const { draft, id } = editing;
    const body = { ...draft, year: Number(draft.year), mileage: Number(draft.mileage) };
    setBusy(true);
    setFormError(null);
    try {
      if (id) await api.put(`/vehicles/${id}`, body);
      else await api.post('/vehicles', body);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(v: Vehicle) {
    if (!window.confirm(t('veh.confirmDelete', { name: `${v.brand} ${v.model}` }))) return;
    await api.delete(`/vehicles/${v.id}`);
    reload();
  }

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditing((cur) => cur && { ...cur, draft: { ...cur.draft, [k]: e.target.value } });

  if (loading) return <Spinner />;
  const vehicles = data?.vehicles ?? [];

  return (
    <div className="page">
      <PageHead title={t('veh.title')} subtitle={t('veh.subtitle')}
        action={<button className="btn btn-primary" onClick={() => open()}><Plus size={16} />{t('veh.add')}</button>} />
      <ErrorAlert message={error} />

      {vehicles.length === 0 ? (
        <div className="card"><Empty icon={Car} title={t('veh.emptyTitle')} text={t('veh.emptyText')}
          action={<button className="btn btn-primary" onClick={() => open()}><Plus size={16} />{t('veh.add')}</button>} /></div>
      ) : (
        <Stagger className="grid grid-3">
          {vehicles.map((v) => (
            <motion.div className="card vehicle-card" key={v.id} variants={itemVariants} whileHover={{ y: -4 }}>
              <div className="vehicle-art"><motion.div whileHover={{ x: [0, 6, -6, 0] }} transition={{ duration: 0.6 }}><Car size={38} strokeWidth={1.5} /></motion.div></div>
              <div>
                <h3>{v.brand} {v.model}</h3>
                <span className="muted small">{v.year}{v.plate ? ` · ${v.plate}` : ''}</span>
              </div>
              <div className="vehicle-meta">
                <div><small>{t('veh.mileage')}</small><span>{formatNumber(v.mileage)} km</span></div>
                <div><small>{t('veh.fuel')}</small><span>{t(`fuel.${v.fuel}`)}</span></div>
              </div>
              <div className="row">
                <Link to={`/diagnosis/new?vehicle=${v.id}`} className="btn btn-sm" style={{ flex: 1 }}><Stethoscope size={14} />{t('veh.diagnose')}</Link>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => open(v)} aria-label={t('veh.edit')}><Pencil size={15} /></button>
                <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => remove(v)} aria-label={t('veh.delete')}><Trash2 size={15} /></button>
              </div>
            </motion.div>
          ))}
        </Stagger>
      )}

      <AnimatePresence>
      {editing && (
        <Modal title={editing.id ? t('veh.modalEdit') : t('veh.modalNew')} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="stack">
            <ErrorAlert message={formError} />
            <div className="form-grid">
              <Field label={t('veh.brand')}><input className="input" value={editing.draft.brand} onChange={set('brand')} placeholder="Toyota" required autoFocus /></Field>
              <Field label={t('veh.model')}><input className="input" value={editing.draft.model} onChange={set('model')} placeholder="Corolla" required /></Field>
              <Field label={t('veh.year')}><input className="input" type="number" value={editing.draft.year} onChange={set('year')} required /></Field>
              <Field label={t('veh.plate')}><input className="input" value={editing.draft.plate} onChange={set('plate')} /></Field>
              <Field label={t('veh.mileage')}><input className="input" type="number" min={0} value={editing.draft.mileage} onChange={set('mileage')} /></Field>
              <Field label={t('veh.fuel')}>
                <select className="select" value={editing.draft.fuel} onChange={set('fuel')}>
                  {(['gasoline', 'diesel', 'hybrid', 'electric'] as const).map((k) => <option key={k} value={k}>{t(`fuel.${k}`)}</option>)}
                </select>
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</button>
            </div>
          </form>
        </Modal>
      )}
      </AnimatePresence>
    </div>
  );
}
