const { query } = require('../database/db');

const FIELDS = `m.id, m.vehicle_id, m.type, m.service_date, m.mileage, m.cost, m.notes,
  m.next_due_date, m.next_due_mileage, m.created_at,
  v.brand AS vehicle_brand, v.model AS vehicle_model`;

const MaintenanceModel = {
  async findAllByUser(userId, vehicleId) {
    const result = await query(
      `SELECT ${FIELDS}
       FROM mechanicia.maintenance m
       JOIN mechanicia.vehicles v ON v.id = m.vehicle_id
       WHERE m.user_id = $1 AND ($2::uuid IS NULL OR m.vehicle_id = $2)
       ORDER BY m.service_date DESC, m.created_at DESC`,
      [userId, vehicleId || null]
    );
    return result.rows;
  },

  async create(userId, data) {
    const result = await query(
      `INSERT INTO mechanicia.maintenance
         (user_id, vehicle_id, type, service_date, mileage, cost, notes, next_due_date, next_due_mileage)
       VALUES ($1, $2, $3, $4, COALESCE($5, 0), COALESCE($6, 0), $7, $8, $9)
       RETURNING id`,
      [
        userId, data.vehicle_id, data.type, data.service_date, data.mileage ?? null,
        data.cost ?? null, data.notes || null, data.next_due_date || null,
        data.next_due_mileage ?? null,
      ]
    );
    return result.rows[0].id;
  },

  async remove(id, userId) {
    const result = await query('DELETE FROM mechanicia.maintenance WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rowCount > 0;
  },

  /** Servicios con próxima fecha de vencimiento, los más cercanos primero */
  async upcoming(userId, limit = 5) {
    const result = await query(
      `SELECT ${FIELDS}
       FROM mechanicia.maintenance m
       JOIN mechanicia.vehicles v ON v.id = m.vehicle_id
       WHERE m.user_id = $1 AND m.next_due_date IS NOT NULL
       ORDER BY m.next_due_date ASC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async spendingByMonth(userId, months = 6) {
    const result = await query(
      `SELECT to_char(date_trunc('month', service_date), 'YYYY-MM') AS month,
              SUM(cost)::float AS total
       FROM mechanicia.maintenance
       WHERE user_id = $1 AND service_date >= date_trunc('month', NOW()) - ($2 || ' months')::interval
       GROUP BY 1 ORDER BY 1`,
      [userId, String(months - 1)]
    );
    return result.rows;
  },
};

module.exports = MaintenanceModel;
