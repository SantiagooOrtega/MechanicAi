import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Diagnoses from './pages/Diagnoses';
import DiagnosisDetail from './pages/DiagnosisDetail';
import Maintenance from './pages/Maintenance';
import NewDiagnosis from './pages/NewDiagnosis';
import Vehicles from './pages/Vehicles';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Auth />;

  // HashRouter: en producción la app se carga desde file://
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="diagnosis/new" element={<NewDiagnosis />} />
          <Route path="diagnoses" element={<Diagnoses />} />
          <Route path="diagnoses/:id" element={<DiagnosisDetail />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
