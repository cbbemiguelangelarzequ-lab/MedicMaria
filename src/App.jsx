import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import MainLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import PuntoVenta from './pages/PuntoVenta';
import DiagnosticoGanancias from './pages/DiagnosticoGanancias';
import Pacientes from './pages/Pacientes';
import HistoriaClinica from './pages/HistoriaClinica';
import './App.css';

function App() {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: '#007BFF', // Clinical modern blue
          colorInfo: '#007BFF',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
          colorBgContainer: '#ffffff',
        },
        components: {
          Layout: {
            bodyBg: '#f0f2f5',
            headerBg: '#ffffff',
          },
          Card: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            borderRadius: 12,
          }
        }
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="pos" element={<PuntoVenta />} />
            <Route path="diagnostico" element={<DiagnosticoGanancias />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<HistoriaClinica />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
