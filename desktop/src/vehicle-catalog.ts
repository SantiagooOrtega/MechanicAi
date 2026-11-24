/** Marcas y modelos más comunes en Colombia y Latinoamérica (sugerencias; también se puede escribir otro) */
export const VEHICLE_CATALOG: Record<string, string[]> = {
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  BMW: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'i3', 'iX'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Seal', 'Song Plus', 'Yuan Plus', 'Tang', 'Han', 'Shark'],
  Chery: ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5'],
  Chevrolet: ['Spark', 'Spark GT', 'Sail', 'Aveo', 'Onix', 'Beat', 'Joy', 'Cruze', 'Tracker', 'Captiva', 'Equinox', 'Trailblazer', 'Tahoe', 'D-Max', 'Colorado', 'Silverado', 'N300'],
  Citroën: ['C3', 'C4', 'C4 Cactus', 'C5 Aircross', 'Berlingo'],
  Dodge: ['Journey', 'Durango', 'Charger', 'Challenger', 'Ram 700'],
  Fiat: ['Uno', 'Palio', 'Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Strada', 'Toro', 'Fiorino'],
  Ford: ['Fiesta', 'Focus', 'Fusion', 'EcoSport', 'Escape', 'Edge', 'Explorer', 'Bronco', 'Ranger', 'F-150', 'Mustang', 'Territory'],
  Honda: ['Fit', 'City', 'Civic', 'Accord', 'HR-V', 'CR-V', 'WR-V', 'Pilot'],
  Hyundai: ['Atos', 'i10', 'Grand i10', 'i20', 'i25', 'Accent', 'Elantra', 'Creta', 'Venue', 'Tucson', 'Santa Fe', 'Kona', 'H-1'],
  Jeep: ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator'],
  JAC: ['J4', 'S2', 'S3', 'JS4', 'T6', 'T8'],
  Kia: ['Picanto', 'Rio', 'Soluto', 'Cerato', 'K3', 'Stonic', 'Seltos', 'Sportage', 'Sorento', 'Niro', 'Carnival', 'Soul'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'],
  Mazda: ['Mazda 2', 'Mazda 3', 'Mazda 6', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'BT-50', 'MX-5'],
  'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'Sprinter'],
  MG: ['MG3', 'MG5', 'ZS', 'ZS EV', 'HS', 'RX5'],
  Mitsubishi: ['Mirage', 'Lancer', 'ASX', 'Eclipse Cross', 'Outlander', 'Montero', 'Montero Sport', 'L200'],
  Nissan: ['March', 'Versa', 'Sentra', 'Note', 'Kicks', 'Qashqai', 'X-Trail', 'Murano', 'Pathfinder', 'Frontier', 'NP300', 'Leaf'],
  Peugeot: ['208', '2008', '301', '308', '3008', '5008', 'Partner'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Renault: ['Twingo', 'Clio', 'Kwid', 'Logan', 'Sandero', 'Stepway', 'Symbol', 'Duster', 'Captur', 'Koleos', 'Oroch', 'Alaskan', 'Kangoo'],
  Subaru: ['Impreza', 'XV', 'Crosstrek', 'Forester', 'Outback', 'WRX'],
  Suzuki: ['Alto', 'Celerio', 'Swift', 'Baleno', 'Dzire', 'Ciaz', 'Ignis', 'Vitara', 'Grand Vitara', 'Jimny', 'S-Cross', 'Ertiga'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Toyota: ['Yaris', 'Corolla', 'Corolla Cross', 'Camry', 'Prius', 'C-HR', 'RAV4', 'Fortuner', 'Prado', 'Land Cruiser', '4Runner', 'Hilux', 'Tacoma', 'FJ Cruiser'],
  Volkswagen: ['Gol', 'Polo', 'Voyage', 'Virtus', 'Jetta', 'Golf', 'Vento', 'Nivus', 'T-Cross', 'Taos', 'Tiguan', 'Touareg', 'Amarok', 'Saveiro'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S60', 'EX30'],
};

export const VEHICLE_BRANDS = Object.keys(VEHICLE_CATALOG).sort((a, b) => a.localeCompare(b, 'es'));

/** Valor especial del selector de marca para escribir una que no está en la lista */
export const OTHER_BRAND = '__other__';

/** Pasa la placa a mayúsculas y le pone guion tras las 3 letras: "abc56h" → "ABC-56H" */
export function formatPlate(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}
