export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type Fuel = 'gasoline' | 'diesel' | 'hybrid' | 'electric';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  mileage: number;
  fuel: Fuel;
}

export interface Cause {
  name: string;
  probability: number;
  explanation: string;
}

export interface DiagnosisSummary {
  id: string;
  vehicle_id: string | null;
  symptoms: string;
  obd_codes: string[];
  summary: string;
  urgency: Urgency;
  can_drive: boolean;
  status: 'open' | 'resolved';
  created_at: string;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
}

export interface Diagnosis extends DiagnosisSummary {
  causes: Cause[];
  steps: string[];
  questions: string[];
  estimated_cost: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  service_date: string;
  mileage: number;
  cost: string;
  notes: string | null;
  next_due_date: string | null;
  next_due_mileage: number | null;
  vehicle_brand: string;
  vehicle_model: string;
}

export interface DashboardData {
  totals: { vehicles: number; diagnoses: number; open: number; urgent: number };
  recent: DiagnosisSummary[];
  upcoming: MaintenanceRecord[];
  spending: { month: string; total: number }[];
}
