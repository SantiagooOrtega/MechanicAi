const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige SSL
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
