const jwt = require('jsonwebtoken');
const { query } = require('../database/db');

/** Verifica el JWT y que el usuario siga existiendo */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado.', code: 'NO_TOKEN' });
    }

    let decoded;
    try {
      decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) {
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      return res.status(401).json({ error: 'Sesión inválida o expirada.', code });
    }

    const result = await query('SELECT id, name, email FROM mechanicia.users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.', code: 'USER_NOT_FOUND' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
