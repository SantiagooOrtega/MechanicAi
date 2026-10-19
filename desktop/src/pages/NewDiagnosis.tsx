import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { PulseLine } from '../components/motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Sparkles, X } from 'lucide-react';
import { api } from '../api';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import type { Diagnosis, Vehicle } from '../types';
import { ErrorAlert, Field, PageHead } from '../components/ui';

const OBD = /^[A-Za-z]\d{4}$/;

export default function NewDiagnosis() {
  const navigate = useNavigate();
  const { t } = useT();
  const [params] = useSearchParams();
  const { data } = useAsync(() => api.get<{ vehicles: Vehicle[] }>('/vehicles'));
  const [vehicleId, setVehicleId] = useState(params.get('vehicle') ?? '');
  const [symptoms, setSymptoms] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function addCode() {
    const c = codeInput.trim().toUpperCase();
    if (!c) return;
    if (!OBD.test(c)) return setError(t('new.invalidCode'));
    setError(null);
    if (!codes.includes(c)) setCodes([...codes, c]);
    setCodeInput('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.post<{ diagnosis: Diagnosis }>('/diagnoses', {
        symptoms, obd_codes: codes, vehicle_id: vehicleId || undefined,
      });
      navigate(`/diagnoses/${r.diagnosis.id}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div className="page">
        <div className="card analyzing">
          <PulseLine width={260} />
          <div>
            <h2>{t('new.analyzingTitle')}</h2>
            <motion.p className="muted" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
              {t('new.analyzingText')}
            </motion.p>
          </div>
        </div>
      </div>
    );
  }

  const vehicles = data?.vehicles ?? [];

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <PageHead title={t('new.title')} subtitle={t('new.subtitle')} />
      <form className="card stack" onSubmit={submit} style={{ gap: 20 }}>
        <ErrorAlert message={error} />
        <Field label={t('new.vehicle')}>
          <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">{t('new.unspecified')}</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year}</option>)}
          </select>
          {vehicles.length === 0 && <span className="small faint">{t('new.noVehiclesA')} <Link to="/vehicles" style={{ color: 'var(--accent)' }}>{t('new.noVehiclesLink')}</Link> {t('new.noVehiclesB')}</span>}
        </Field>

        <Field label={t('new.whatHappens')}>
          <textarea className="textarea" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} minLength={10} maxLength={2000} required
            placeholder={t('new.placeholder')} />
          <span className="small faint" style={{ alignSelf: 'flex-end' }}>{symptoms.length} / 2000</span>
        </Field>

        <Field label={t('new.obd')}>
          <div className="row">
            <input className="input" value={codeInput} placeholder="P0301" maxLength={5}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCode(); } }} />
            <button type="button" className="btn" onClick={addCode}><Plus size={16} />{t('new.addCode')}</button>
          </div>
          {codes.length > 0 && (
            <div className="row wrap" style={{ marginTop: 4 }}>
              {codes.map((c) => (
                <motion.span key={c} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="chip chip-code mono row" style={{ gap: 6 }}>
                  {c}
                  <button type="button" onClick={() => setCodes(codes.filter((x) => x !== c))} aria-label={t('new.removeCode', { code: c })}
                    style={{ background: 'none', border: 'none', display: 'grid', color: 'inherit', padding: 0 }}><X size={13} /></button>
                </motion.span>
              ))}
            </div>
          )}
        </Field>

        <div className="row between">
          <span className="small faint">{t('new.disclaimer')}</span>
          <button className="btn btn-primary btn-lg"><Sparkles size={18} />{t('new.analyze')}</button>
        </div>
      </form>
    </div>
  );
}
