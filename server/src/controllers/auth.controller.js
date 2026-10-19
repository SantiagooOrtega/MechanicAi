const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const signToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

const AuthController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      if (await UserModel.emailExists(email)) {
        return res.status(409).json({ error: 'El correo ya está registrado.', code: 'ALREADY_EXISTS' });
      }
      const user = await UserModel.create({ name, email, password });
      res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);
      const valid = user && (await UserModel.verifyPassword(password, user.password_hash));
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales inválidas.', code: 'INVALID_CREDENTIALS' });
      }
      res.json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  },

  me(req, res) {
    res.json({ user: publicUser(req.user) });
  },
};

module.exports = AuthController;
