import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';

// Pages
import LoginPage from './modules/auth/pages/LoginPage';
import ProtectedRoute from './modules/auth/components/ProtectedRoute';
import DashboardLayout from './shared/components/DashboardLayout';
import DashboardPage from './shared/pages/DashboardPage';
import NotFoundPage from './shared/pages/NotFoundPage';

// Módulo Órdenes
import { OrdenesPage } from './modules/ordenes/pages/OrdenesPage';
import { NuevaOrdenPage } from './modules/ordenes/pages/NuevaOrdenPage';
import { OrdenDetallePage } from './modules/ordenes/pages/OrdenDetallePage';

// Módulo Resultados
import { ResultadosPage } from './modules/resultados/pages/ResultadosPage';

// Módulo Áreas (Catálogo)
import { AreasPage } from './modules/areas/pages/AreasPage';

// Módulo Métodos (Catálogo)
import { MetodosPage } from './modules/metodos/pages/MetodosPage';

// Módulo Sedes (Catálogo)
import { SedesPage } from './modules/sedes/pages/SedesPage';

// Módulo Tipos de Cliente (Catálogo)
import { TiposClientePage } from './modules/tipos-cliente/pages/TiposClientePage';

// Módulo Convenios (Catálogo)
import { ConveniosPage } from './modules/convenios/pages/ConveniosPage';

// Módulo Análisis (Catálogo)
import { AnalisisPage } from './modules/analisis/pages/AnalisisPage';

// Módulo Componentes (Catálogo)
import { ComponentesPage } from './modules/componentes/pages/ComponentesPage';

// Módulo Tarifarios (Catálogo)
import { TarifariosPage } from './modules/tarifarios/pages/TarifariosPage';

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={esES}>
        <BrowserRouter>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Módulo de Órdenes */}
              <Route path="ordenes" element={<OrdenesPage />} />
              <Route path="ordenes/nueva" element={<NuevaOrdenPage />} />
              <Route path="ordenes/:id" element={<OrdenDetallePage />} />
              
              {/* Módulo de Resultados */}
              <Route path="resultados" element={<ResultadosPage />} />
              
              {/* Módulo de Catálogos */}
              <Route path="catalogos/areas" element={<AreasPage />} />
              <Route path="catalogos/metodos" element={<MetodosPage />} />
              <Route path="catalogos/sedes" element={<SedesPage />} />
              <Route path="catalogos/tipos-cliente" element={<TiposClientePage />} />
              <Route path="catalogos/convenios" element={<ConveniosPage />} />
              <Route path="catalogos/analisis" element={<AnalisisPage />} />
              <Route path="catalogos/componentes" element={<ComponentesPage />} />
              <Route path="catalogos/tarifarios" element={<TarifariosPage />} />
              
              {/* Aquí se agregarán más rutas de módulos */}
              
              {/* Ruta 404 dentro del dashboard */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Ruta 404 para no autenticados */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
