const bcrypt = require('bcryptjs');
const { query } = require('../database/db');

const PUBLIC_FIELDS = 'id, name, email, created_at';

const UserModel = {
  async create({ name, email, password }) {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO mechanicia.users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING ${PUBLIC_FIELDS}`,
      [name, email, hash]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query('SELECT * FROM mechanicia.users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async emailExists(email) {
    const result = await query('SELECT 1 FROM mechanicia.users WHERE email = $1', [email]);
    return result.rows.length > 0;
  },

  verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UserModel;
