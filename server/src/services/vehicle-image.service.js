/**
 * Busca una foto del vehículo (marca + modelo) en Wikipedia/Wikimedia Commons.
 * Es gratis, no necesita clave y las fotos tienen licencia libre.
 * Los resultados se guardan en memoria para no repetir la búsqueda.
 */

const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'MechanicIA/1.0 (proyecto educativo)';
const TIMEOUT_MS = 8000;
const cache = new Map(); // "toyota corolla" -> { url, title, page } | null

async function findVehicleImage(brand, model) {
  const key = `${brand} ${model}`.trim().toLowerCase().replace(/\s+/g, ' ');
  if (cache.has(key)) return cache.get(key);

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `${brand} ${model} car`,
    gsrlimit: '3',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '960',
  });

  let result = null;
  try {
    const res = await fetch(`${API}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
      // el primer resultado con foto, priorizando los que mencionan la marca en el título
      const brandLc = brand.toLowerCase();
      const withImage = pages.filter((p) => p.thumbnail?.source);
      const best = withImage.find((p) => p.title.toLowerCase().includes(brandLc)) || withImage[0];
      if (best) {
        result = {
          url: best.thumbnail.source,
          title: best.title,
          page: `https://en.wikipedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, '_'))}`,
        };
      }
    }
  } catch {
    return null; // sin red: no se guarda en caché para reintentar luego
  }

  cache.set(key, result);
  return result;
}

module.exports = { findVehicleImage };
