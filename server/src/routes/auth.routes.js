const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
      .matches(/\d/).withMessage('La contraseña debe incluir un número'),
  ],
  validate,
  AuthController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  AuthController.login
);

router.get('/me', authenticate, AuthController.me);

module.exports = router;
