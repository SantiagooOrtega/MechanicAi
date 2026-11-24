import { Bike, Car, CarFront, Cog, Flag, Flame, Fuel, Gauge, Rocket, Trophy, Truck, Wrench, Zap, type LucideIcon } from 'lucide-react';
import type { User } from '../types';

/** Avatares para elegir en Configuración (estilo Netflix): un color de fondo y un ícono del mundo motor */
export const AVATARS: { id: string; icon: LucideIcon; from: string; to: string }[] = [
  { id: 'racer', icon: Flag, from: '#ef4444', to: '#7f1d1d' },
  { id: 'mechanic', icon: Wrench, from: '#f97316', to: '#9a3412' },
  { id: 'turbo', icon: Gauge, from: '#eab308', to: '#854d0e' },
  { id: 'electric', icon: Zap, from: '#22c55e', to: '#14532d' },
  { id: 'classic', icon: Car, from: '#06b6d4', to: '#155e75' },
  { id: 'sport', icon: CarFront, from: '#3b82f6', to: '#1e3a8a' },
  { id: 'rider', icon: Bike, from: '#8b5cf6', to: '#4c1d95' },
  { id: 'trucker', icon: Truck, from: '#ec4899', to: '#831843' },
  { id: 'engine', icon: Cog, from: '#64748b', to: '#1e293b' },
  { id: 'fire', icon: Flame, from: '#f43f5e', to: '#881337' },
  { id: 'fuel', icon: Fuel, from: '#14b8a6', to: '#134e4a' },
  { id: 'champion', icon: Trophy, from: '#f59e0b', to: '#78350f' },
  { id: 'rocket', icon: Rocket, from: '#a855f7', to: '#3b0764' },
];

export const findAvatar = (id?: string | null) => AVATARS.find((a) => a.id === id);

/** Cómo llamamos al usuario: su apodo o, si no tiene, su primer nombre */
export const displayName = (user: Pick<User, 'name' | 'nickname'> | null | undefined) =>
  user?.nickname?.trim() || user?.name.split(' ')[0] || '';

/** Avatar del usuario: el elegido en Configuración o, si no eligió, su inicial */
export function UserAvatar({ user, avatarId, size = 34 }: { user: Pick<User, 'name' | 'nickname' | 'avatar'>; avatarId?: string | null; size?: number }) {
  const avatar = findAvatar(avatarId !== undefined ? avatarId : user.avatar);
  const style = { width: size, height: size };
  if (!avatar) {
    return <span className="avatar" style={{ ...style, fontSize: size * 0.42 }}>{displayName(user).charAt(0).toUpperCase()}</span>;
  }
  const Icon = avatar.icon;
  return (
    <span className="avatar avatar-art" style={{ ...style, background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})` }}>
      <Icon size={Math.round(size * 0.52)} strokeWidth={2} />
    </span>
  );
}
