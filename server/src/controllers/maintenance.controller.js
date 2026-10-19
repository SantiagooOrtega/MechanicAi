const MaintenanceModel = require('../models/maintenance.model');
const VehicleModel = require('../models/vehicle.model');

const MaintenanceController = {
  async list(req, res, next) {
    try {
      const records = await MaintenanceModel.findAllByUser(req.user.id, req.query.vehicle_id);
      res.json({ records });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const vehicle = await VehicleModel.findOne(req.body.vehicle_id, req.user.id);
      if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado.', code: 'NOT_FOUND' });
      const id = await MaintenanceModel.create(req.user.id, req.body);
      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      if (!(await MaintenanceModel.remove(req.params.id, req.user.id))) {
        return res.status(404).json({ error: 'Registro no encontrado.', code: 'NOT_FOUND' });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = MaintenanceController;
