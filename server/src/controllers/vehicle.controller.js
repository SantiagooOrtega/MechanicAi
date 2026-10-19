const VehicleModel = require('../models/vehicle.model');

const notFound = (res) => res.status(404).json({ error: 'Vehículo no encontrado.', code: 'NOT_FOUND' });

const VehicleController = {
  async list(req, res, next) {
    try {
      res.json({ vehicles: await VehicleModel.findAllByUser(req.user.id) });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      res.status(201).json({ vehicle: await VehicleModel.create(req.user.id, req.body) });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const vehicle = await VehicleModel.update(req.params.id, req.user.id, req.body);
      if (!vehicle) return notFound(res);
      res.json({ vehicle });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      if (!(await VehicleModel.remove(req.params.id, req.user.id))) return notFound(res);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = VehicleController;
