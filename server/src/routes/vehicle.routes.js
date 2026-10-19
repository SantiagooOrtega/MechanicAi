const { Router } = require('express');
const { body, param } = require('express-validator');
const VehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

const vehicleRules = [
  body('brand').trim().isLength({ min: 1, max: 60 }).withMessage('La marca es requerida'),
  body('model').trim().isLength({ min: 1, max: 60 }).withMessage('El modelo es requerido'),
  body('year').isInt({ min: 1950, max: new Date().getFullYear() + 1 }).withMessage('Año inválido'),
  body('plate').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Placa demasiado larga'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Kilometraje inválido'),
  body('fuel').optional().isIn(['gasoline', 'diesel', 'hybrid', 'electric']).withMessage('Combustible inválido'),
];
const idRule = param('id').isUUID().withMessage('ID inválido');

router.get('/', VehicleController.list);
router.post('/', vehicleRules, validate, VehicleController.create);
router.put('/:id', [idRule, ...vehicleRules], validate, VehicleController.update);
router.delete('/:id', [idRule], validate, VehicleController.remove);

module.exports = router;
