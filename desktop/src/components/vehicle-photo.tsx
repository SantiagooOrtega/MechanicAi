import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Car } from 'lucide-react';
import { api } from '../api';

/** Foto del vehículo buscada por el servidor en Wikipedia (compartida entre el panel, la lista y el formulario) */
export type VehicleImage = { url: string; title: string; page: string } | null;
const imageCache = new Map<string, Promise<VehicleImage>>();

/** Foto del vehículo buscada por el servidor (Wikipedia), compartida entre tarjetas y formulario */
export function fetchVehicleImage(brand: string, model: string) {
  const key = `${brand}|${model}`.toLowerCase();
  if (!imageCache.has(key)) {
    const qs = new URLSearchParams({ brand, model }).toString();
    const p = api.get<{ image: VehicleImage }>(`/vehicles/image?${qs}`).then((r) => r.image).catch(() => null);
    imageCache.set(key, p);
  }
  return imageCache.get(key)!;
}

export function useVehicleImage(brand: string, model: string, delay = 0) {
  const [state, setState] = useState<{ key: string; image: VehicleImage; loading: boolean }>({ key: '', image: null, loading: false });
  const b = brand.trim();
  const m = model.trim();
  const key = `${b}|${m}`;
  useEffect(() => {
    if (!b || !m) { setState({ key, image: null, loading: false }); return; }
    let alive = true;
    setState((cur) => ({ key, image: cur.key === key ? cur.image : null, loading: true }));
    const timer = window.setTimeout(() => {
      fetchVehicleImage(b, m).then((image) => { if (alive) setState({ key, image, loading: false }); });
    }, delay);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [b, m, key, delay]);
  return state;
}

export function VehiclePhoto({ brand, model }: { brand: string; model: string }) {
  const { image } = useVehicleImage(brand, model);
  const [failed, setFailed] = useState(false);
  if (!image || failed) {
    return <motion.div whileHover={{ x: [0, 6, -6, 0] }} transition={{ duration: 0.6 }}><Car size={38} strokeWidth={1.5} /></motion.div>;
  }
  return <img className="vehicle-photo" src={image.url} alt={`${brand} ${model}`} loading="lazy" onError={() => setFailed(true)} />;
}

