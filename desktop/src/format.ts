import { getLocale } from './i18n';

export const formatDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatNumber = (n: number) => n.toLocaleString(getLocale());

export const formatMoney = (n: number | string) =>
  Number(n).toLocaleString(getLocale(), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Nombre legible del vehículo; `fallback` se usa cuando el diagnóstico no tiene uno asociado */
export const vehicleName = (v: { brand?: string | null; model?: string | null; year?: number | null }, fallback = '') =>
  v.brand ? `${v.brand} ${v.model} ${v.year ?? ''}`.trim() : fallback;

export const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString(getLocale(), { month: 'short' }).replace('.', '');
