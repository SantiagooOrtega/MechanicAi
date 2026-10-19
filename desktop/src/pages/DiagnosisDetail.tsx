import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Item, Stagger, spring } from '../components/motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Bot, CheckCircle2, CircleHelp, Gauge, Octagon, RotateCcw, Send, ShieldCheck, Trash2, TriangleAlert, User } from 'lucide-react';
import { api } from '../api';
import { useAsync } from '../useAsync';
import { useT } from '../i18n';
import { formatDate, vehicleName } from '../format';
import type { Diagnosis, Message } from '../types';
import { ErrorAlert, Spinner, UrgencyBadge } from '../components/ui';

const URGENCY_ICON = { low: ShieldCheck, medium: Gauge, high: TriangleAlert, critical: Octagon };

export default function DiagnosisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const { data, error, loading, setData } = useAsync(() => api.get<{ diagnosis: Diagnosis; messages: Message[] }>(`/diagnoses/${id}`), [id]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [data?.messages.length, sending]);

  if (loading) return <Spinner />;
  if (!data) return <div className="page"><ErrorAlert message={error} /></div>;
  const { diagnosis: d, messages } = data;
  const Icon = URGENCY_ICON[d.urgency];

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setChatError(null);
    setDraft('');
    try {
      const r = await api.post<{ messages: Message[] }>(`/diagnoses/${d.id}/messages`, { content: text.trim() });
      setData((cur) => cur && { ...cur, messages: [...cur.messages, ...r.messages] });
    } catch (err) {
      setChatError((err as Error).message);
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    const status = d.status === 'open' ? 'resolved' : 'open';
    const r = await api.patch<{ diagnosis: Diagnosis }>(`/diagnoses/${d.id}`, { status });
    setData((cur) => cur && { ...cur, diagnosis: { ...cur.diagnosis, status: r.diagnosis.status } });
  }

  async function remove() {
    if (!window.confirm(t('diag.confirmDelete'))) return;
    await api.delete(`/diagnoses/${d.id}`);
    navigate('/diagnoses', { replace: true });
  }

  return (
    <div className="page">
      <Link to="/diagnoses" className="btn btn-ghost btn-sm" style={{ marginBottom: 14, marginLeft: -10 }}><ArrowLeft size={15} />{t('diag.back')}</Link>

      <motion.div className="card stack" style={{ marginBottom: 18, gap: 18 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className="diag-hero">
          <motion.div className={`urgency-mark ${d.urgency}`} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}><Icon size={26} /></motion.div>
          <div style={{ flex: 1 }}>
            <div className="row wrap" style={{ marginBottom: 8 }}>
              <UrgencyBadge urgency={d.urgency} />
              {d.status === 'resolved' && <span className="badge badge-ok">{t('hist.badgeResolved')}</span>}
              {d.obd_codes.map((c) => <span key={c} className="chip chip-code mono">{c}</span>)}
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>{d.summary}</h2>
            <p className="muted small">{vehicleName({ brand: d.vehicle_brand, model: d.vehicle_model, year: d.vehicle_year }, t('common.noVehicle'))} · {formatDate(d.created_at)}</p>
          </div>
          <div className="row">
            <button className="btn btn-sm" onClick={toggleStatus}>
              {d.status === 'open' ? <><CheckCircle2 size={14} />{t('diag.markResolved')}</> : <><RotateCcw size={14} />{t('diag.reopen')}</>}
            </button>
            <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={remove} aria-label={t('diag.delete')}><Trash2 size={15} /></button>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 28 }}>
          <div className={`verdict ${d.can_drive ? 'yes' : 'no'}`}>
            {d.can_drive ? <ShieldCheck size={18} /> : <Octagon size={18} />}
            {d.can_drive ? t('diag.canDrive') : t('diag.cannotDrive')}
          </div>
          <div className="row muted"><Banknote size={18} /><span className="small">{d.estimated_cost}</span></div>
        </div>
        <div>
          <small className="faint">{t('diag.described')}</small>
          <p className="muted">{d.symptoms}</p>
        </div>
      </motion.div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Stagger className="stack">
          <Item className="card">
            <div className="card-title"><h3>{t('diag.causes')}</h3></div>
            {d.causes.map((c, i) => (
              <div className="cause" key={c.name}>
                <div className="row between"><strong>{c.name}</strong><span className="chip">{c.probability}%</span></div>
                <div className="bar"><motion.i style={{ width: `${c.probability}%`, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: [0.2, 0.7, 0.2, 1] }} /></div>
                <p className="muted small">{c.explanation}</p>
              </div>
            ))}
          </Item>
          <Item className="card">
            <div className="card-title"><h3>{t('diag.steps')}</h3></div>
            <ol className="steps">{d.steps.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>{s}</motion.li>
            ))}</ol>
          </Item>
        </Stagger>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }}>
          <div className="card-title"><h3>{t('diag.conversation')}</h3></div>
          {d.questions.length > 0 && messages.length === 0 && (
            <div className="stack" style={{ marginBottom: 16, gap: 8 }}>
              <span className="small faint">{t('diag.refine')}</span>
              {d.questions.map((q) => (
                <button key={q} className="question-btn" onClick={() => setDraft(`${q} `)}><CircleHelp size={16} />{q}</button>
              ))}
            </div>
          )}
          <div className="chat">
            {messages.map((m) => (
              <motion.div className={`msg ${m.role}`} key={m.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
                <div className="msg-avatar">{m.role === 'user' ? <User size={15} /> : <Bot size={15} />}</div>
                <div className="msg-bubble">{m.content}</div>
              </motion.div>
            ))}
            <AnimatePresence>
              {sending && (
                <motion.div className="msg assistant" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="msg-avatar"><Bot size={15} /></div>
                  <div className="msg-bubble"><span className="typing"><i /><i /><i /></span></div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
          <ErrorAlert message={chatError} />
          <form className="composer" onSubmit={(e: FormEvent) => { e.preventDefault(); send(draft); }}>
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={t('diag.askPlaceholder')} />
            <button className="btn btn-primary btn-icon" disabled={sending || !draft.trim()} aria-label={t('diag.send')}><Send size={17} /></button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
