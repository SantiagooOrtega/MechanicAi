const { query } = require('../database/db');

const FIELDS = 'id, brand, model, year, plate, mileage, fuel, created_at';

const VehicleModel = {
  async findAllByUser(userId) {
    const result = await query(
      `SELECT ${FIELDS} FROM mechanicia.vehicles WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findOne(id, userId) {
    const result = await query(
      `SELECT ${FIELDS} FROM mechanicia.vehicles WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async create(userId, { brand, model, year, plate, mileage, fuel }) {
    const result = await query(
      `INSERT INTO mechanicia.vehicles (user_id, brand, model, year, plate, mileage, fuel)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0), COALESCE($7, 'gasoline'))
       RETURNING ${FIELDS}`,
      [userId, brand, model, year, plate || null, mileage ?? null, fuel ?? null]
    );
    return result.rows[0];
  },

  async update(id, userId, { brand, model, year, plate, mileage, fuel }) {
    const result = await query(
      `UPDATE mechanicia.vehicles
       SET brand = $3, model = $4, year = $5, plate = $6,
           mileage = COALESCE($7, mileage), fuel = COALESCE($8, fuel)
       WHERE id = $1 AND user_id = $2
       RETURNING ${FIELDS}`,
      [id, userId, brand, model, year, plate || null, mileage ?? null, fuel ?? null]
    );
    return result.rows[0] || null;
  },

  async remove(id, userId) {
    const result = await query('DELETE FROM mechanicia.vehicles WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rowCount > 0;
  },
};

module.exports = VehicleModel;
