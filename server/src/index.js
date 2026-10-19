require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const diagnosisRoutes = require('./routes/diagnosis.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { language } = require('./middleware/language.middleware');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(helmet());
// La app de escritorio no tiene un origen web fijo (file:// en producción)
app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'] }));
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Demasiadas solicitudes. Intenta más tarde.', code: 'RATE_LIMIT' },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(language);

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'MechanicIA API', timestamp: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada`, code: 'NOT_FOUND' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MechanicIA API en http://localhost:${PORT}`);
});

module.exports = app;
