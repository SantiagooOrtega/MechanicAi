const DiagnosisModel = require('../models/diagnosis.model');
const MaintenanceModel = require('../models/maintenance.model');
const VehicleModel = require('../models/vehicle.model');

const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const DashboardController = {
  async summary(req, res, next) {
    try {
      const userId = req.user.id;
      const [vehicles, diagnoses, upcoming, spending, maintenance] = await Promise.all([
        VehicleModel.findAllByUser(userId),
        DiagnosisModel.findAllByUser(userId),
        MaintenanceModel.upcoming(userId),
        MaintenanceModel.spendingByMonth(userId),
        MaintenanceModel.findAllByUser(userId),
      ]);

      res.json({
        totals: {
          vehicles: vehicles.length,
          diagnoses: diagnoses.length,
          open: diagnoses.filter((d) => d.status === 'open').length,
          urgent: diagnoses.filter((d) => d.status === 'open' && ['high', 'critical'].includes(d.urgency)).length,
          maintenance: maintenance.length, // para la guía de primeros pasos
        },
        vehicles, // para la sección "Tu garaje" del panel
        recent: diagnoses.slice(0, 5),
        // casos abiertos, del más urgente al menos urgente (bloque "Pendientes" del panel)
        pending: diagnoses
          .filter((d) => d.status === 'open')
          .sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9))
          .slice(0, 5),
        upcoming,
        spending,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = DashboardController;
