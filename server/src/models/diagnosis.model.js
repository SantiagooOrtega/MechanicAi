const { query } = require('../database/db');

const LIST_FIELDS = `d.id, d.symptoms, d.obd_codes, d.summary, d.urgency, d.can_drive,
  d.status, d.created_at, d.vehicle_id,
  v.brand AS vehicle_brand, v.model AS vehicle_model, v.year AS vehicle_year`;

const DiagnosisModel = {
  async create(userId, data) {
    const result = await query(
      `INSERT INTO mechanicia.diagnoses
         (user_id, vehicle_id, symptoms, obd_codes, summary, urgency, can_drive,
          causes, steps, questions, estimated_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        userId, data.vehicle_id || null, data.symptoms, data.obd_codes || [],
        data.summary, data.urgency, data.can_drive,
        JSON.stringify(data.causes), JSON.stringify(data.steps),
        JSON.stringify(data.questions), data.estimated_cost,
      ]
    );
    return result.rows[0].id;
  },

  async findAllByUser(userId, { status } = {}) {
    const result = await query(
      `SELECT ${LIST_FIELDS}
       FROM mechanicia.diagnoses d
       LEFT JOIN mechanicia.vehicles v ON v.id = d.vehicle_id
       WHERE d.user_id = $1 AND ($2::text IS NULL OR d.status = $2)
       ORDER BY d.created_at DESC`,
      [userId, status || null]
    );
    return result.rows;
  },

  async findOne(id, userId) {
    const result = await query(
      `SELECT d.*, v.brand AS vehicle_brand, v.model AS vehicle_model,
              v.year AS vehicle_year, v.mileage AS vehicle_mileage, v.fuel AS vehicle_fuel
       FROM mechanicia.diagnoses d
       LEFT JOIN mechanicia.vehicles v ON v.id = d.vehicle_id
       WHERE d.id = $1 AND d.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async messages(diagnosisId) {
    const result = await query(
      `SELECT id, role, content, created_at FROM mechanicia.diagnosis_messages
       WHERE diagnosis_id = $1 ORDER BY created_at ASC`,
      [diagnosisId]
    );
    return result.rows;
  },

  async addMessage(diagnosisId, role, content) {
    const result = await query(
      `INSERT INTO mechanicia.diagnosis_messages (diagnosis_id, role, content)
       VALUES ($1, $2, $3) RETURNING id, role, content, created_at`,
      [diagnosisId, role, content]
    );
    return result.rows[0];
  },

  async setStatus(id, userId, status) {
    const result = await query(
      'UPDATE mechanicia.diagnoses SET status = $3 WHERE id = $1 AND user_id = $2 RETURNING id, status',
      [id, userId, status]
    );
    return result.rows[0] || null;
  },

  async remove(id, userId) {
    const result = await query('DELETE FROM mechanicia.diagnoses WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rowCount > 0;
  },
};

module.exports = DiagnosisModel;
