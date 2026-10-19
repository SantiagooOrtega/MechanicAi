const { Router } = require('express');
const { body, param, query } = require('express-validator');
const MaintenanceController = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

router.get(
  '/',
  [query('vehicle_id').optional().isUUID().withMessage('Vehículo inválido')],
  validate,
  MaintenanceController.list
);

router.post(
  '/',
  [
    body('vehicle_id').isUUID().withMessage('Vehículo inválido'),
    body('type').trim().isLength({ min: 2, max: 80 }).withMessage('El tipo de servicio es requerido'),
    body('service_date').isISO8601().withMessage('Fecha inválida'),
    body('mileage').optional().isInt({ min: 0 }).withMessage('Kilometraje inválido'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Costo inválido'),
    body('next_due_date').optional({ values: 'falsy' }).isISO8601().withMessage('Fecha inválida'),
    body('next_due_mileage').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Kilometraje inválido'),
  ],
  validate,
  MaintenanceController.create
);

router.delete('/:id', [param('id').isUUID().withMessage('ID inválido')], validate, MaintenanceController.remove);

module.exports = router;
