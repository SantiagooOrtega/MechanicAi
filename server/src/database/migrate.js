require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('./db');

const SCHEMA = `
  CREATE SCHEMA IF NOT EXISTS mechanicia;

  CREATE TABLE IF NOT EXISTS mechanicia.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS mechanicia.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES mechanicia.users(id) ON DELETE CASCADE,
    brand VARCHAR(60) NOT NULL,
    model VARCHAR(60) NOT NULL,
    year INT NOT NULL CHECK (year BETWEEN 1950 AND 2100),
    plate VARCHAR(20),
    mileage INT NOT NULL DEFAULT 0 CHECK (mileage >= 0),
    fuel VARCHAR(20) NOT NULL DEFAULT 'gasoline'
      CHECK (fuel IN ('gasoline', 'diesel', 'hybrid', 'electric')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS mechanicia.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES mechanicia.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES mechanicia.vehicles(id) ON DELETE SET NULL,
    symptoms TEXT NOT NULL,
    obd_codes TEXT[] NOT NULL DEFAULT '{}',
    summary TEXT,
    urgency VARCHAR(10) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    can_drive BOOLEAN,
    causes JSONB NOT NULL DEFAULT '[]',
    steps JSONB NOT NULL DEFAULT '[]',
    questions JSONB NOT NULL DEFAULT '[]',
    estimated_cost TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS mechanicia.diagnosis_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES mechanicia.diagnoses(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS mechanicia.maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES mechanicia.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES mechanicia.vehicles(id) ON DELETE CASCADE,
    type VARCHAR(80) NOT NULL,
    service_date DATE NOT NULL,
    mileage INT NOT NULL DEFAULT 0 CHECK (mileage >= 0),
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    notes TEXT,
    next_due_date DATE,
    next_due_mileage INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_vehicles_user ON mechanicia.vehicles(user_id);
  CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON mechanicia.diagnoses(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_diagnosis ON mechanicia.diagnosis_messages(diagnosis_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON mechanicia.maintenance(vehicle_id, service_date DESC);
`;

pool
  .query(SCHEMA)
  .then(() => console.log('Migración completada: esquema mechanicia listo'))
  .catch((error) => {
    console.error('Error en la migración:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
