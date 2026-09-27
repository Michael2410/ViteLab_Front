import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import esES from 'antd/locale/es_ES';
import MessageConfig from './shared/components/MessageConfig';

// Pages
import LoginPage from './modules/auth/pages/LoginPage';
import ProtectedRoute from './modules/auth/components/ProtectedRoute';
import { usePermissions } from './shared/components/PermissionGuard';
import { LaboratorioLayout as DashboardLayout, DashboardPage } from './modules/laboratorio';
import NotFoundPage from './shared/pages/NotFoundPage';

// Portal & Suites
import { PortalPage } from './modules/portal';
import { AlmacenComingSoonPage } from './modules/almacen';
import {
  PersonalPage,
  PersonalCatalogosPage,
  ContratosPage,
  VacacionesPage,
  AsistenciaPage,
  DocumentosPage,
  PersonalLayout,
} from './modules/personal';

// Módulo Órdenes (Laboratorio)
import { OrdenesPage } from './modules/laboratorio/ordenes/pages/OrdenesPage';
import { OrdenDetallePage } from './modules/laboratorio/ordenes/pages/OrdenDetallePage';
import { OrdenImprimiblePage } from './modules/laboratorio/ordenes/pages/OrdenImprimiblePage';

// Módulo Resultados (Laboratorio)
import { ResultadosPage } from './modules/laboratorio/resultados/pages/ResultadosPage';
import { ResultadosVistaPreviaPage } from './modules/laboratorio/resultados/pages/ResultadosVistaPreviaPage';
import { ResultadosPDFPage } from './modules/laboratorio/resultados/pages/ResultadosPDFPage';
import { AprobacionesPage } from './modules/laboratorio/resultados/pages/AprobacionesPage';

// Módulo Áreas (Laboratorio - Catálogo)
import { AreasPage } from './modules/laboratorio/areas/pages/AreasPage';

// Módulo Métodos (Laboratorio - Catálogo)
import { MetodosPage } from './modules/laboratorio/metodos/pages/MetodosPage';

// Módulo Tipos de Cliente (Laboratorio - Catálogo)
import { TiposClientePage } from './modules/laboratorio/tipos-cliente/pages/TiposClientePage';

// Módulo Convenios (Laboratorio - Catálogo)
import { ConveniosPage } from './modules/laboratorio/convenios/pages/ConveniosPage';

// Módulo Análisis (Laboratorio - Catálogo)
import { AnalisisPage } from './modules/laboratorio/analisis/pages/AnalisisPage';

// Módulo Componentes (Laboratorio - Catálogo)
import { ComponentesPage } from './modules/laboratorio/componentes/pages/ComponentesPage';

// Módulo Tarifarios (Laboratorio - Catálogo)
import { TarifariosPage } from './modules/laboratorio/tarifarios/pages/TarifariosPage';

// Módulo Muestras (Laboratorio - Catálogo)
import { MuestrasPage } from './modules/laboratorio/muestras/pages/MuestrasPage';

// Módulo Configuración & Seguridad (Suite independiente)
import {
  ConfiguracionLayout,
  UsuariosPage,
  SistemaPage,
  RolesPage,
  SedesPage,
} from './modules/configuracion';

// Módulo Reportes (Laboratorio)
import {
  ReportesPage,
  ReporteOrdenesPeriodoPage,
  ReporteIngresosSedeP,
  ReporteAnalisisRankingPage,
  ReporteProductividadPage
} from './modules/laboratorio/reportes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ConfiguracionIndexRedirect() {
  const { hasPermission, isSuperAdmin } = usePermissions();
  if (isSuperAdmin || hasPermission('auth.users.read')) return <Navigate to="/configuracion/usuarios" replace />;
  if (hasPermission('auth.roles.read')) return <Navigate to="/configuracion/roles" replace />;
  if (hasPermission('catalogs.sedes.read')) return <Navigate to="/configuracion/sedes" replace />;
  if (hasPermission('settings.read')) return <Navigate to="/configuracion/sistema" replace />;
  return <Navigate to="/portal" replace />;
}

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
              controlHeightLG: 38,
              controlHeightSM: 28,
              borderRadius: 8,
              borderRadiusLG: 8,
              borderRadiusSM: 6,
              fontWeight: 600,
              paddingInline: 18,
              contentFontSize: 14,
              colorPrimary: '#0958d9', 
              colorPrimaryHover: '#003eb3',
              defaultShadow: '0 1px 2px rgba(0,0,0,0.04)',
              primaryShadow: '0 4px 12px rgba(22, 119, 255, 0.22)',
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
          <MessageConfig>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Ruta especial para generación de PDF (usada por el backend) */}
              <Route path="/resultados/pdf/:id" element={<ResultadosPDFPage />} />

              {/* Portal Selector de Módulos */}
              <Route
                path="/portal"
                element={
                  <ProtectedRoute>
                    <PortalPage />
                  </ProtectedRoute>
                }
              />

              {/* Módulo Almacén (Próximamente) */}
              <Route
                path="/almacen"
                element={
                  <ProtectedRoute>
                    <AlmacenComingSoonPage />
                  </ProtectedRoute>
                }
              />

              {/* Módulo Personal & RRHH (Layout propio) */}
              <Route
                path="/personal"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      'personal.directorio.read',
                      'personal.contratos.read',
                      'personal.catalogos.read',
                      'personal.vacaciones.read',
                      'personal.asistencia.read',
                      'personal.documentos.read',
                    ]}
                  >
                    <PersonalLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <ProtectedRoute requiredPermission="personal.directorio.read">
                      <PersonalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="contratos"
                  element={
                    <ProtectedRoute requiredPermission="personal.contratos.read">
                      <ContratosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="catalogos"
                  element={
                    <ProtectedRoute requiredPermission="personal.catalogos.read">
                      <PersonalCatalogosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="vacaciones"
                  element={
                    <ProtectedRoute requiredPermission="personal.vacaciones.read">
                      <VacacionesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="asistencia"
                  element={
                    <ProtectedRoute requiredPermission="personal.asistencia.read">
                      <AsistenciaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="documentos"
                  element={
                    <ProtectedRoute requiredPermission="personal.documentos.read">
                      <DocumentosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="roles"
                  element={<Navigate to="/configuracion/roles" replace />}
                />
              </Route>

              {/* Módulo Configuración & Seguridad (Layout propio) */}
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      'auth.users.read',
                      'auth.roles.read',
                      'catalogs.sedes.read',
                      'settings.read',
                    ]}
                  >
                    <ConfiguracionLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ConfiguracionIndexRedirect />} />
                <Route
                  path="usuarios"
                  element={
                    <ProtectedRoute requiredPermission="auth.users.read">
                      <UsuariosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="roles"
                  element={
                    <ProtectedRoute requiredPermission="auth.roles.read">
                      <RolesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="sedes"
                  element={
                    <ProtectedRoute requiredPermission="catalogs.sedes.read">
                      <SedesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="sistema"
                  element={
                    <ProtectedRoute requiredPermission="settings.read">
                      <SistemaPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Rutas del Sistema de Laboratorio Clínico */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/portal" replace />} />
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
                <Route path="catalogos/sedes" element={<Navigate to="/configuracion/sedes" replace />} />
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

                {/* Redirecciones de compatibilidad hacia Suite Configuración */}
                <Route path="usuarios" element={<Navigate to="/configuracion/usuarios" replace />} />
                <Route path="settings/roles" element={<Navigate to="/configuracion/roles" replace />} />
                <Route path="settings/sistema" element={<Navigate to="/configuracion/sistema" replace />} />

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
          </MessageConfig>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
