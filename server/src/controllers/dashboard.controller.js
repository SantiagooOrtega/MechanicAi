const DiagnosisModel = require('../models/diagnosis.model');
const MaintenanceModel = require('../models/maintenance.model');
const VehicleModel = require('../models/vehicle.model');

const DashboardController = {
  async summary(req, res, next) {
    try {
      const userId = req.user.id;
      const [vehicles, diagnoses, upcoming, spending] = await Promise.all([
        VehicleModel.findAllByUser(userId),
        DiagnosisModel.findAllByUser(userId),
        MaintenanceModel.upcoming(userId),
        MaintenanceModel.spendingByMonth(userId),
      ]);

      res.json({
        totals: {
          vehicles: vehicles.length,
          diagnoses: diagnoses.length,
          open: diagnoses.filter((d) => d.status === 'open').length,
          urgent: diagnoses.filter((d) => d.status === 'open' && ['high', 'critical'].includes(d.urgency)).length,
        },
        recent: diagnoses.slice(0, 5),
        upcoming,
        spending,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = DashboardController;
