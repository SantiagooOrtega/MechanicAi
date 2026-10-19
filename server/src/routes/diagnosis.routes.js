const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const DiagnosisController = require('../controllers/diagnosis.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

// La IA tiene cuota gratuita limitada: se protege por usuario
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: (req) => req.user.id,
  message: { error: 'Alcanzaste el límite de consultas a la IA por hora.', code: 'AI_RATE_LIMIT' },
});

const idRule = param('id').isUUID().withMessage('ID inválido');

router.get('/', DiagnosisController.list);
router.get('/:id', [idRule], validate, DiagnosisController.get);

router.post(
  '/',
  aiLimiter,
  [
    body('symptoms').trim().isLength({ min: 10, max: 2000 }).withMessage('Describe el problema (mínimo 10 caracteres)'),
    body('vehicle_id').optional({ values: 'falsy' }).isUUID().withMessage('Vehículo inválido'),
    body('obd_codes').optional().isArray({ max: 10 }).withMessage('Códigos inválidos'),
    body('obd_codes.*').matches(/^[A-Za-z]\d{4}$/).withMessage('Código OBD-II inválido (ej. P0301)'),
  ],
  validate,
  DiagnosisController.create
);

router.post(
  '/:id/messages',
  aiLimiter,
  [idRule, body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Escribe un mensaje')],
  validate,
  DiagnosisController.addMessage
);

router.patch(
  '/:id',
  [idRule, body('status').isIn(['open', 'resolved']).withMessage('Estado inválido')],
  validate,
  DiagnosisController.setStatus
);

router.delete('/:id', [idRule], validate, DiagnosisController.remove);

module.exports = router;
