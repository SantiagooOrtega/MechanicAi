/** Idioma de las respuestas de la IA según Accept-Language (es | en) */
const language = (req, res, next) => {
  const header = (req.headers['accept-language'] || '').toLowerCase();
  req.lang = header.startsWith('en') ? 'en' : 'es';
  next();
};

module.exports = { language };
