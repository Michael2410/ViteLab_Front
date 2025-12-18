import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import esES from 'antd/locale/es_ES';
import MessageConfig from './shared/components/MessageConfig';

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
import { OrdenImprimiblePage } from './modules/ordenes/pages/OrdenImprimiblePage';

// Módulo Resultados
import { ResultadosPage } from './modules/resultados/pages/ResultadosPage';
import { ResultadosVistaPreviaPage } from './modules/resultados/pages/ResultadosVistaPreviaPage';
import { ResultadosPDFPage } from './modules/resultados/pages/ResultadosPDFPage';
import { AprobacionesPage } from './modules/resultados/pages/AprobacionesPage';

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

// Módulo Muestras (Catálogo)
import { MuestrasPage } from './modules/muestras/pages/MuestrasPage';

// Módulo Usuarios
import { UsuariosPage } from './modules/usuarios/pages/UsuariosPage';

// Módulo Sistema (Configuración)
import { SistemaPage } from './modules/sistema/pages/SistemaPage';

// Módulo Roles
import { RolesPage } from './modules/roles/pages/RolesPage';

// Módulo Reportes
import {
  ReportesPage,
  ReporteOrdenesPeriodoPage,
  ReporteIngresosSedeP,
  ReporteAnalisisRankingPage,
  ReporteProductividadPage
} from './modules/reportes';

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
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            fontFamily: "'Inter', 'SF Pro Display', 'Roboto', 'Segoe UI Variable', 'Segoe UI', sans-serif",
            colorSplit: 'rgba(0, 80, 180, 0.06)',
          },
          components: {
            /* ╔══════════════════════════════╗
               ║         TABLAS (Table)        ║
               ╚══════════════════════════════╝ */
            Table: {
              borderColor: '#d0d7e0',                     // Líneas suaves azul-gris
              headerBg: 'rgb(0, 33, 64)',                 // Azul navy elegante
              headerColor: 'rgba(255, 255, 255, 0.92)',
              rowHoverBg: 'rgba(0, 120, 212, 0.06)',      // Hover azul muy tenue
              rowSelectedBg: '#fafafa',                   // Usamos "selected" para alternancia
              colorBgContainer: '#ffffff',
              cellPaddingBlock: 12,
              cellPaddingInline: 14,
            },
            /* ╔══════════════════════════════╗
               ║           BOTONES            ║
               ╚══════════════════════════════╝ */
            Button: {
              controlHeight: 34,
              fontWeight: 600,
              paddingInline: 20,
              contentFontSize: 14,
              colorPrimary: '#0958d9', 
              colorPrimaryHover: '#003eb3',
              defaultShadow: '0 1px 2px rgba(0,0,0,0.04)',
              primaryShadow: '0 4px 12px rgba(22, 119, 255, 0.22)', // Más suavizado
              algorithm: true,
            },
            /* ╔══════════════════════════════╗
               ║            CARDS             ║
               ╚══════════════════════════════╝ */
            Card: {
              borderRadiusLG: 14,                         // Más moderno
              boxShadowTertiary:
                '0 2px 4px rgba(0,0,0,0.04), 0 6px 12px rgba(0,0,0,0.03)',
              paddingLG: 18,
            },
            /* ╔══════════════════════════════╗
               ║      SWITCH PERSONALIZADO    ║
               ╚══════════════════════════════╝ */
            Switch: {
              colorPrimary: '#0958d9', 
              colorPrimaryHover: '#003eb3',
              colorTextQuaternary: '#00000026',  // Fondo gris claro (off)
              colorTextTertiary: '#00000040',    // Hover gris (off)
              handleSize: 18,        // Tamaño del círculo
              trackHeight: 22,       // Altura de la barra (más alta que el círculo)
              trackPadding: 2,       // Espacio entre el círculo y el borde (el margen)
              handleShadow: '0 2px 4px rgba(0,0,0,0.15)', 
            },
          },
        }}
      >

        <AntApp>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Ruta especial para generación de PDF (usada por el backend) */}
              <Route path="/resultados/pdf/:id" element={<ResultadosPDFPage />} />

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
                <Route path="dashboard" element={
                  <ProtectedRoute requiredPermission="dashboard.read">
                    <DashboardPage />
                  </ProtectedRoute>
                } />

                {/* Módulo de Órdenes */}
                <Route path="ordenes" element={
                  <ProtectedRoute requiredPermission="orders.read">
                    <OrdenesPage />
                  </ProtectedRoute>
                } />
                <Route path="ordenes/nueva" element={
                  <ProtectedRoute requiredPermission="orders.create">
                    <NuevaOrdenPage />
                  </ProtectedRoute>
                } />
                <Route path="ordenes/:id" element={
                  <ProtectedRoute requiredPermission="orders.read">
                    <OrdenDetallePage />
                  </ProtectedRoute>
                } />
                <Route path="/ordenes/:id/imprimir" element={
                  <ProtectedRoute requiredPermission="orders.print">
                    <OrdenImprimiblePage />
                  </ProtectedRoute>
                } />
                
                {/* Módulo de Resultados */}
                <Route path="resultados" element={
                  <ProtectedRoute requiredPermissions={['results.read', 'results.create', 'results.update']}>
                    <ResultadosPage />
                  </ProtectedRoute>
                } />
                <Route path="resultados/orden/:id" element={
                  <ProtectedRoute requiredPermission="results.read">
                    <ResultadosVistaPreviaPage />
                  </ProtectedRoute>
                } />

                {/* Módulo de Aprobaciones */}
                <Route path="aprobaciones" element={
                  <ProtectedRoute requiredPermission="results.approve">
                    <AprobacionesPage />
                  </ProtectedRoute>
                } />

                {/* Módulo de Catálogos */}
                <Route path="catalogos/areas" element={
                  <ProtectedRoute requiredPermission="catalogs.areas.read">
                    <AreasPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/metodos" element={
                  <ProtectedRoute requiredPermission="catalogs.methods.read">
                    <MetodosPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/sedes" element={
                  <ProtectedRoute requiredPermission="catalogs.sedes.read">
                    <SedesPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/tipos-cliente" element={
                  <ProtectedRoute requiredPermission="catalogs.tipos-cliente.read">
                    <TiposClientePage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/convenios" element={
                  <ProtectedRoute requiredPermission="catalogs.convenios.read">
                    <ConveniosPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/analisis" element={
                  <ProtectedRoute requiredPermission="catalogs.analysis.read">
                    <AnalisisPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/componentes" element={
                  <ProtectedRoute requiredPermission="catalogs.components.read">
                    <ComponentesPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/tarifarios" element={
                  <ProtectedRoute requiredPermission="tariffs.read">
                    <TarifariosPage />
                  </ProtectedRoute>
                } />
                <Route path="catalogos/muestras" element={
                  <ProtectedRoute requiredPermission="catalogs.muestras.read">
                    <MuestrasPage />
                  </ProtectedRoute>
                } />

                {/* Módulo de Usuarios */}
                <Route path="usuarios" element={
                  <ProtectedRoute requiredPermission="auth.users.read">
                    <UsuariosPage />
                  </ProtectedRoute>
                } />

                {/* Módulo de Configuración */}
                <Route path="settings/roles" element={
                  <ProtectedRoute requiredPermission="auth.roles.read">
                    <RolesPage />
                  </ProtectedRoute>
                } />
                <Route path="settings/sistema" element={
                  <ProtectedRoute requiredPermission="settings.read">
                    <SistemaPage />
                  </ProtectedRoute>
                } />

                {/* Módulo de Reportes */}
                <Route path="reportes" element={
                  <ProtectedRoute requiredPermission="reports.read">
                    <ReportesPage />
                  </ProtectedRoute>
                } />
                <Route path="reportes/ordenes-periodo" element={
                  <ProtectedRoute requiredPermission="reports.read">
                    <ReporteOrdenesPeriodoPage />
                  </ProtectedRoute>
                } />
                <Route path="reportes/ingresos-sede" element={
                  <ProtectedRoute requiredPermission="reports.read">
                    <ReporteIngresosSedeP />
                  </ProtectedRoute>
                } />
                <Route path="reportes/analisis-ranking" element={
                  <ProtectedRoute requiredPermission="reports.read">
                    <ReporteAnalisisRankingPage />
                  </ProtectedRoute>
                } />
                <Route path="reportes/productividad" element={
                  <ProtectedRoute requiredPermission="reports.read">
                    <ReporteProductividadPage />
                  </ProtectedRoute>
                } />

                {/* Ruta 404 dentro del dashboard */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Ruta 404 para no autenticados */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
