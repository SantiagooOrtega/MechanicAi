const DiagnosisModel = require('../models/diagnosis.model');
const VehicleModel = require('../models/vehicle.model');
const AiService = require('../services/ai.service');

const notFound = (res) => res.status(404).json({ error: 'Diagnóstico no encontrado.', code: 'NOT_FOUND' });

const vehicleOf = (d) =>
  d.vehicle_brand
    ? { brand: d.vehicle_brand, model: d.vehicle_model, year: d.vehicle_year, mileage: d.vehicle_mileage, fuel: d.vehicle_fuel }
    : null;

const DiagnosisController = {
  async create(req, res, next) {
    try {
      const { vehicle_id, symptoms, obd_codes = [] } = req.body;

      let vehicle = null;
      if (vehicle_id) {
        vehicle = await VehicleModel.findOne(vehicle_id, req.user.id);
        if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado.', code: 'NOT_FOUND' });
      }

      const codes = obd_codes.map((c) => c.trim().toUpperCase()).filter(Boolean);
      const result = await AiService.diagnose({ vehicle, symptoms, obdCodes: codes, lang: req.lang });
      const id = await DiagnosisModel.create(req.user.id, {
        vehicle_id,
        symptoms,
        obd_codes: codes,
        ...result,
      });

      const diagnosis = await DiagnosisModel.findOne(id, req.user.id);
      res.status(201).json({ diagnosis, messages: [] });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const diagnoses = await DiagnosisModel.findAllByUser(req.user.id, { status: req.query.status });
      res.json({ diagnoses });
    } catch (error) {
      next(error);
    }
  },

  async get(req, res, next) {
    try {
      const diagnosis = await DiagnosisModel.findOne(req.params.id, req.user.id);
      if (!diagnosis) return notFound(res);
      res.json({ diagnosis, messages: await DiagnosisModel.messages(diagnosis.id) });
    } catch (error) {
      next(error);
    }
  },

  async addMessage(req, res, next) {
    try {
      const diagnosis = await DiagnosisModel.findOne(req.params.id, req.user.id);
      if (!diagnosis) return notFound(res);

      const history = await DiagnosisModel.messages(diagnosis.id);
      const userMessage = await DiagnosisModel.addMessage(diagnosis.id, 'user', req.body.content);

      const answer = await AiService.followUp({
        vehicle: vehicleOf(diagnosis),
        diagnosis,
        history,
        message: req.body.content,
        lang: req.lang,
      });
      const assistantMessage = await DiagnosisModel.addMessage(diagnosis.id, 'assistant', answer);

      res.status(201).json({ messages: [userMessage, assistantMessage] });
    } catch (error) {
      next(error);
    }
  },

  async setStatus(req, res, next) {
    try {
      const updated = await DiagnosisModel.setStatus(req.params.id, req.user.id, req.body.status);
      if (!updated) return notFound(res);
      res.json({ diagnosis: updated });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      if (!(await DiagnosisModel.remove(req.params.id, req.user.id))) return notFound(res);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = DiagnosisController;
