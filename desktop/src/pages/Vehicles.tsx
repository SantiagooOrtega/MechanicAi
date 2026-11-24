import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Stagger, itemVariants } from '../components/motion';
import { ArrowRight, Car, CheckCircle2, Pencil, Plus, Stethoscope, Trash2, X } from 'lucide-react';
import { api } from '../api';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatNumber } from '../format';
import type { Fuel, Vehicle } from '../types';
import { Empty, ErrorAlert, Field, Modal, PageHead, Spinner } from '../components/ui';
import { OTHER_BRAND, VEHICLE_BRANDS, VEHICLE_CATALOG, formatPlate } from '../vehicle-catalog';
import { VehiclePhoto, useVehicleImage } from '../components/vehicle-photo';


type Draft = { brand: string; model: string; year: string; plate: string; mileage: string; fuel: Fuel };
const blank: Draft = { brand: '', model: '', year: String(new Date().getFullYear()), plate: '', mileage: '0', fuel: 'gasoline' };

export default function Vehicles() {
  const { t } = useT();
  const { data, loading, error, reload } = useAsync(() => api.get<{ vehicles: Vehicle[] }>('/vehicles'));
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [customBrand, setCustomBrand] = useState(false); // marca escrita a mano (no está en la lista)
  const [justAdded, setJustAdded] = useState<Vehicle | null>(null);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const nextStep = params.get('next'); // "diagnose": al guardar se va directo a diagnosticar

  // ?add=1 (desde la guía o el diagnóstico) abre el formulario de una vez
  useEffect(() => {
    if (params.get('add') === '1') {
      open();
      const rest = new URLSearchParams(params);
      rest.delete('add');
      setParams(rest, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (v?: Vehicle) => {
    setFormError(null);
    setCustomBrand(Boolean(v && !VEHICLE_CATALOG[v.brand]));
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
      else {
        const { vehicle } = await api.post<{ vehicle: Vehicle }>('/vehicles', body);
        if (nextStep === 'diagnose') { navigate(`/diagnosis/new?vehicle=${vehicle.id}`); return; }
        setJustAdded(vehicle);
      }
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

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = k === 'plate' ? formatPlate(e.target.value) : e.target.value;
    setEditing((cur) => cur && { ...cur, draft: { ...cur.draft, [k]: value } });
  };
  const setDraft = (patch: Partial<Draft>) => setEditing((cur) => cur && { ...cur, draft: { ...cur.draft, ...patch } });

  if (loading) return <Spinner />;
  const vehicles = data?.vehicles ?? [];

  return (
    <div className="page">
      <PageHead title={t('veh.title')} subtitle={t('veh.subtitle')}
        action={<button className="btn btn-primary" onClick={() => open()}><Plus size={16} />{t('veh.add')}</button>} />
      <ErrorAlert message={error} />

      <AnimatePresence>
        {justAdded && (
          <motion.div className="card saved-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <CheckCircle2 size={22} className="saved-icon" />
            <div className="saved-text">
              <strong>{t('veh.savedTitle', { name: `${justAdded.brand} ${justAdded.model}` })}</strong>
              <span>{t('veh.savedText')}</span>
            </div>
            <Link to={`/diagnosis/new?vehicle=${justAdded.id}`} className="btn btn-primary"><Stethoscope size={16} />{t('veh.diagnoseNow')} <ArrowRight size={15} /></Link>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setJustAdded(null)} aria-label={t('common.cancel')}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {vehicles.length === 0 ? (
        <div className="card"><Empty icon={Car} title={t('veh.emptyTitle')} text={t('veh.emptyText')}
          action={<button className="btn btn-primary" onClick={() => open()}><Plus size={16} />{t('veh.add')}</button>} /></div>
      ) : (
        <Stagger className="grid grid-3">
          {vehicles.map((v) => (
            <motion.div className="card vehicle-card" key={v.id} variants={itemVariants} whileHover={{ y: -4 }}>
              <div className="vehicle-art"><VehiclePhoto brand={v.brand} model={v.model} /></div>
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
              <Field label={t('veh.brand')}>
                {customBrand ? (
                  <div className="input-with-action">
                    <input className="input" value={editing.draft.brand} onChange={set('brand')} placeholder={t('veh.writeBrand')} required autoFocus />
                    <button type="button" className="link-btn" onClick={() => { setCustomBrand(false); setDraft({ brand: '', model: '' }); }}>{t('veh.backToList')}</button>
                  </div>
                ) : (
                  <select className="select" value={editing.draft.brand} required autoFocus
                    onChange={(e) => {
                      if (e.target.value === OTHER_BRAND) { setCustomBrand(true); setDraft({ brand: '', model: '' }); }
                      else setDraft({ brand: e.target.value, model: '' });
                    }}>
                    <option value="" disabled>{t('veh.pickBrand')}</option>
                    {VEHICLE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    <option value={OTHER_BRAND}>{t('veh.otherBrand')}</option>
                  </select>
                )}
              </Field>
              <Field label={t('veh.model')}>
                <input className="input" list="veh-models" value={editing.draft.model} onChange={set('model')}
                  placeholder={t('veh.pickModel')} required disabled={!editing.draft.brand} />
                <datalist id="veh-models">
                  {(VEHICLE_CATALOG[editing.draft.brand] ?? []).map((m) => <option key={m} value={m} />)}
                </datalist>
              </Field>
              <Field label={t('veh.year')}><input className="input" type="number" value={editing.draft.year} onChange={set('year')} required /></Field>
              <Field label={t('veh.plate')}><input className="input input-plate" value={editing.draft.plate} onChange={set('plate')} placeholder="ABC-56H" maxLength={9} autoCapitalize="characters" spellCheck={false} /></Field>
              <Field label={t('veh.mileage')}><input className="input" type="number" min={0} value={editing.draft.mileage} onChange={set('mileage')} /></Field>
              <Field label={t('veh.fuel')}>
                <select className="select" value={editing.draft.fuel} onChange={set('fuel')}>
                  {(['gasoline', 'diesel', 'hybrid', 'electric'] as const).map((k) => <option key={k} value={k}>{t(`fuel.${k}`)}</option>)}
                </select>
              </Field>
            </div>
            <PhotoPreview brand={editing.draft.brand} model={editing.draft.model} />
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

/** Vista previa en el formulario: busca la foto mientras escribes (con una pequeña espera) */
function PhotoPreview({ brand, model }: { brand: string; model: string }) {
  const { t } = useT();
  const { image, loading } = useVehicleImage(brand, model, 600);
  if (!brand.trim() || !model.trim()) return null;
  return (
    <div className="vehicle-preview" aria-live="polite">
      {image ? (
        <>
          <img src={image.url} alt={`${brand} ${model}`} />
          <a className="vehicle-preview-credit" href={image.page} target="_blank" rel="noreferrer">{t('veh.photoSource')} · {image.title}</a>
        </>
      ) : (
        <div className="vehicle-preview-empty"><Car size={28} strokeWidth={1.5} /><span>{loading ? t('veh.photoSearching') : t('veh.photoNone')}</span></div>
      )}
    </div>
  );
}
