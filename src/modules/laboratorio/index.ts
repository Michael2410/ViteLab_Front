/**
 * Módulo de Laboratorio - ViteLab
 * Exportaciones principales de páginas, hooks y tipos de laboratorio
 */

// Shared (Layout, Dashboard & Alertas)
export { LaboratorioLayout, DashboardLayout } from './shared/LaboratorioLayout';
export { default as DashboardPage } from './shared/pages/DashboardPage';
export { default as HeaderAlertas } from './shared/components/HeaderAlertas';

// Órdenes
export * from './ordenes/pages/OrdenesPage';
export * from './ordenes/pages/OrdenDetallePage';
export * from './ordenes/pages/OrdenImprimiblePage';
export * from './ordenes/components/NuevaOrdenDrawer';
export * from './ordenes/components/EditarOrdenDrawer';
export * from './ordenes/components/OrdenDetalleDrawer';
export * from './ordenes/hooks';
export * from './ordenes/types';

// Resultados
export * from './resultados/pages/ResultadosPage';
export * from './resultados/pages/ResultadosVistaPreviaPage';
export * from './resultados/pages/ResultadosPDFPage';
export * from './resultados/pages/AprobacionesPage';
export * from './resultados/hooks';
export * from './resultados/types';

// Catálogos de Laboratorio
export * from './areas/pages/AreasPage';
export * from './metodos/pages/MetodosPage';
export * from './tipos-cliente/pages/TiposClientePage';
export * from './convenios/pages/ConveniosPage';
export * from './analisis/pages/AnalisisPage';
export * from './componentes/pages/ComponentesPage';
export * from './tarifarios/pages/TarifariosPage';
export * from './muestras/pages/MuestrasPage';

// WhatsApp & Reportes
export * from './whatsapp';
export * from './reportes';
