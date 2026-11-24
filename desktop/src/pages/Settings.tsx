import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Save } from 'lucide-react';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { AVATARS, UserAvatar, displayName } from '../components/avatar';
import { ErrorAlert, Field, PageHead } from '../components/ui';

/** Configuración del perfil: cómo quiere que lo llamemos y su avatar (estilo Netflix) */
export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const preview = { ...user, nickname, avatar };
  const dirty = (nickname.trim() || null) !== (user.nickname ?? null) || avatar !== (user.avatar ?? null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ nickname: nickname.trim() || null, avatar });
      // al guardar se vuelve a la pantalla anterior (o al panel si se entró directo)
      if (window.history.state?.idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <PageHead title={t('cfg.title')} subtitle={t('cfg.subtitle')} />
      <form className="stack" style={{ gap: 18 }} onSubmit={save}>
        <ErrorAlert message={error} />

        <div className="card profile-preview">
          <motion.div key={avatar ?? 'initial'} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <UserAvatar user={preview} size={84} />
          </motion.div>
          <div>
            <small className="muted">{t('cfg.preview')}</small>
            <h2>{t('dash.hello', { name: displayName(preview) })}</h2>
            <span className="muted small">{user.email}</span>
          </div>
        </div>

        <div className="card stack" style={{ gap: 14 }}>
          <h3>{t('cfg.nameTitle')}</h3>
          <Field label={t('cfg.nameLabel')}>
            <input className="input" value={nickname} maxLength={40} placeholder={user.name.split(' ')[0]}
              onChange={(e) => setNickname(e.target.value)} />
            <span className="small faint">{t('cfg.nameHint')}</span>
          </Field>
        </div>

        <div className="card stack" style={{ gap: 14 }}>
          <div>
            <h3>{t('cfg.avatarTitle')}</h3>
            <p className="muted small">{t('cfg.avatarHint')}</p>
          </div>
          <div className="avatar-grid" role="radiogroup" aria-label={t('cfg.avatarTitle')}>
            <button type="button" role="radio" aria-checked={avatar === null} className={`avatar-pick${avatar === null ? ' on' : ''}`}
              onClick={() => setAvatar(null)}>
              <UserAvatar user={preview} avatarId={null} size={88} />
              <span>{t('cfg.initial')}</span>
              {avatar === null && <i className="avatar-check"><Check size={14} /></i>}
            </button>
            {AVATARS.map((a) => (
              <button key={a.id} type="button" role="radio" aria-checked={avatar === a.id} className={`avatar-pick${avatar === a.id ? ' on' : ''}`}
                onClick={() => setAvatar(a.id)}>
                <UserAvatar user={preview} avatarId={a.id} size={88} />
                <span>{t(`avatar.${a.id}` as Parameters<typeof t>[0])}</span>
                {avatar === a.id && <i className="avatar-check"><Check size={14} /></i>}
              </button>
            ))}
          </div>
        </div>

        <div className="row between">
          <button type="button" className="btn btn-lg" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}>{t('common.cancel')}</button>
          <button className="btn btn-primary btn-lg" disabled={busy || !dirty}><Save size={18} />{busy ? t('common.saving') : t('common.save')}</button>
        </div>
      </form>
    </div>
  );
}
