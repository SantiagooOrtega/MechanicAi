const { createError } = require('../middleware/error.middleware');

// Interactions API de Gemini (generateContent ya no acepta los modelos actuales con claves nuevas)
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const API_REVISION = '2026-05-20';
// Modelos en orden: si uno está saturado (503/429) se pasa al siguiente
const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const MAX_ATTEMPTS = 2; // intentos por modelo
const RETRYABLE = [429, 500, 503];
const REQUEST_TIMEOUT_MS = 45000; // sin límite, una respuesta lenta dejaba la app colgada

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DIAGNOSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    urgency: { type: 'STRING', enum: ['low', 'medium', 'high', 'critical'] },
    can_drive: { type: 'BOOLEAN' },
    causes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          probability: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['name', 'probability', 'explanation'],
      },
    },
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
    estimated_cost: { type: 'STRING' },
    questions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['summary', 'urgency', 'can_drive', 'causes', 'steps', 'estimated_cost', 'questions'],
};

const LANGUAGE_NAME = { es: 'español', en: 'inglés' };

const describeVehicle = (v) =>
  v
    ? `${v.brand} ${v.model} ${v.year}, ${v.mileage} km, combustible: ${v.fuel}`
    : 'vehículo no especificado';

/** Esquema estilo Gemini (OBJECT, STRING…) → JSON Schema (object, string…) que pide la Interactions API */
function toJsonSchema(node) {
  if (Array.isArray(node)) return node.map(toJsonSchema);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = k === 'type' && typeof v === 'string' ? v.toLowerCase() : toJsonSchema(v);
  return out;
}

/** Mensajes con rol user/model → pasos de la Interactions API */
const toSteps = (contents) =>
  contents.map((c) => ({
    type: c.role === 'model' ? 'model_output' : 'user_input',
    content: c.parts.map((p) => ({ type: 'text', text: p.text })),
  }));

function modelList() {
  const custom = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || '').split(',').map((m) => m.trim()).filter(Boolean);
  return custom.length ? custom : DEFAULT_MODELS;
}

async function callGemini({ system, contents, schema }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw createError('La IA no está configurada en el servidor.', 503, 'AI_NOT_CONFIGURED');

  const body = {
    system_instruction: system,
    input: toSteps(contents),
    store: false, // el historial lo guarda nuestra base de datos
    generation_config: { thinking_level: 'low' }, // algo más rápido (~20 s en vez de ~25 s) sin perder calidad
    ...(schema && { response_format: { type: 'text', mime_type: 'application/json', schema: toJsonSchema(schema) } }),
  };

  let lastStatus = 0;
  for (const model of modelList()) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      let response;
      try {
        response = await fetch(API_URL, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, 'Api-Revision': API_REVISION },
          body: JSON.stringify({ model, ...body }),
        });
      } catch (err) {
        lastStatus = 504;
        if (err.name === 'TimeoutError') break; // probar el siguiente modelo
        if (attempt < MAX_ATTEMPTS) { await sleep(1500); continue; }
        break;
      }

      if (response.ok) {
        const data = await response.json();
        const text = (data.steps || [])
          .filter((s) => s.type === 'model_output')
          .flatMap((s) => s.content || [])
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('');
        if (!text) throw createError('La IA no devolvió una respuesta.', 502, 'AI_EMPTY');
        return schema ? JSON.parse(text) : text.trim();
      }

      lastStatus = response.status;
      if ([400, 401, 403].includes(response.status)) {
        const detail = await response.text().catch(() => '');
        console.error(`[ai] Gemini respondió ${response.status} con ${model}: ${detail.slice(0, 300)}`);
        throw createError('La IA no está bien configurada en el servidor.', 503, 'AI_MISCONFIGURED');
      }
      if (response.status === 404) break; // modelo no disponible: siguiente
      if (RETRYABLE.includes(response.status) && attempt < MAX_ATTEMPTS) { await sleep(attempt * 2000); continue; }
      break;
    }
  }

  if (lastStatus === 504) throw createError('La IA tardó demasiado en responder. Intenta de nuevo en un momento.', 504, 'AI_TIMEOUT');
  const code = lastStatus === 429 ? 'AI_QUOTA' : 'AI_UNAVAILABLE';
  throw createError('El asistente no está disponible ahora. Intenta de nuevo en un momento.', 503, code);
}

const systemPrompt = (lang) => [
  'Eres MechanicIA, un asistente de mecánica automotriz con criterio profesional y prudente.',
  `Responde siempre en ${LANGUAGE_NAME[lang]}, con lenguaje claro para personas que no son mecánicas.`,
  'Basa tu análisis solo en lo que el usuario describe; si falta información, dilo y haz preguntas.',
  'Ordena las causas de más a menos probable (probabilidad entre 1 y 100, sin que sumen más de 100).',
  'Si hay riesgo para la seguridad (frenos, dirección, humo, sobrecalentamiento, fugas de combustible),',
  'marca urgencia high o critical y can_drive en false.',
  'No inventes datos del vehículo ni códigos que el usuario no dio.',
].join(' ');

const AiService = {
  /** Primer diagnóstico estructurado a partir de síntomas y códigos OBD-II */
  async diagnose({ vehicle, symptoms, obdCodes, lang }) {
    const prompt = [
      `Vehículo: ${describeVehicle(vehicle)}`,
      `Síntomas descritos: ${symptoms}`,
      obdCodes.length ? `Códigos OBD-II: ${obdCodes.join(', ')}` : 'Sin códigos OBD-II.',
      '',
      'Devuelve: summary (2 frases), urgency, can_drive, causes (3 a 5), steps (acciones concretas en orden),',
      'estimated_cost (rango aproximado y aclarando que varía por país y taller),',
      'questions (0 a 3 preguntas que ayudarían a afinar el diagnóstico).',
    ].join('\n');

    return callGemini({
      system: systemPrompt(lang),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      schema: DIAGNOSIS_SCHEMA,
    });
  },

  /** Respuesta a una pregunta de seguimiento dentro de un diagnóstico */
  async followUp({ vehicle, diagnosis, history, message, lang }) {
    const context = [
      `Vehículo: ${describeVehicle(vehicle)}`,
      `Síntomas iniciales: ${diagnosis.symptoms}`,
      `Diagnóstico previo: ${diagnosis.summary}`,
      `Causas consideradas: ${diagnosis.causes.map((c) => `${c.name} (${c.probability}%)`).join('; ')}`,
    ].join('\n');

    const contents = [
      { role: 'user', parts: [{ text: `Contexto del caso:\n${context}` }] },
      { role: 'model', parts: [{ text: 'Entendido, te ayudo con este caso.' }] },
      ...history.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    return callGemini({
      system: `${systemPrompt(lang)} Responde de forma breve y directa, sin repetir el diagnóstico completo.`,
      contents,
    });
  },
};

module.exports = AiService;
