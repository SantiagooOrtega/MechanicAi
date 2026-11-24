const { findVehicleImage } = require('../services/vehicle-image.service');
const VehicleModel = require('../models/vehicle.model');

const notFound = (res) => res.status(404).json({ error: 'Vehículo no encontrado.', code: 'NOT_FOUND' });

const VehicleController = {
  /** Foto del vehículo buscada en Wikipedia a partir de la marca y el modelo */
  async image(req, res, next) {
    try {
      const image = await findVehicleImage(req.query.brand, req.query.model);
      res.json({ image });
    } catch (err) {
      next(err);
    }
  },

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
