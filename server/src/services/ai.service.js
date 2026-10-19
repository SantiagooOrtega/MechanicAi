const { createError } = require('../middleware/error.middleware');

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_ATTEMPTS = 3;
const RETRYABLE = [429, 500, 503];

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

async function callGemini({ system, contents, schema }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw createError('La IA no está configurada en el servidor.', 503, 'AI_NOT_CONFIGURED');
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(`${API_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          ...(schema && { responseMimeType: 'application/json', responseSchema: schema }),
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw createError('La IA no devolvió una respuesta.', 502, 'AI_EMPTY');
      return schema ? JSON.parse(text) : text.trim();
    }

    if (RETRYABLE.includes(response.status) && attempt < MAX_ATTEMPTS) {
      await sleep(attempt * 2500);
      continue;
    }
    const code = response.status === 429 ? 'AI_QUOTA' : 'AI_UNAVAILABLE';
    throw createError('El asistente no está disponible ahora. Intenta de nuevo en un momento.', 503, code);
  }
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
