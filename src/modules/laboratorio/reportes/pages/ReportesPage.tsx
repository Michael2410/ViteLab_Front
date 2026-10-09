import React, { useMemo } from 'react';
import { Row, Col, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  BankOutlined,
  ExperimentOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import ModulePageLayout from '../../../../shared/components/ModulePageLayout';
import { usePermissions } from '../../../../shared/components/PermissionGuard';

const { Title, Paragraph, Text } = Typography;

interface ReporteCardProps {
  titulo: string;
  descripcion: string;
  categoria: string;
  categoriaColor: string;
  icono: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconColor: string;
  ruta: string;
  permiso: string;
}

const ReporteCard: React.FC<ReporteCardProps> = ({
  titulo,
  descripcion,
  categoria,
  categoriaColor,
  icono,
  gradient,
  iconBg,
  iconColor,
  ruta,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(ruta)}
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Decorative top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: gradient,
        }}
      />

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            {icono}
          </div>
          <Tag color={categoriaColor} style={{ borderRadius: 12, fontWeight: 600, fontSize: 11 }}>
            {categoria}
          </Tag>
        </div>

        <Title level={5} style={{ margin: 0, marginBottom: 8, color: '#0f172a', fontWeight: 700 }}>
          {titulo}
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
          {descripcion}
        </Paragraph>
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#0284c7',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <span>Generar Reporte</span>
        <ArrowRightOutlined style={{ fontSize: 13 }} />
      </div>
    </div>
  );
};

const reportes: ReporteCardProps[] = [
  {
    titulo: 'Órdenes por Período',
    descripcion: 'Auditoría integral de órdenes registradas, filtros por fechas, sedes y estados operativos.',
    categoria: 'Operativo',
    categoriaColor: 'blue',
    icono: <FileTextOutlined />,
    gradient: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
    iconBg: 'rgba(2, 132, 199, 0.1)',
    iconColor: '#0284c7',
    ruta: '/reportes/ordenes-periodo',
    permiso: 'reports.ordenes.read',
  },
  {
    titulo: 'Análisis Más Solicitados',
    descripcion: 'Ranking de pruebas de laboratorio con mayor demanda y porcentaje de participación.',
    categoria: 'Demanda',
    categoriaColor: 'purple',
    icono: <ExperimentOutlined />,
    gradient: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
    iconBg: 'rgba(124, 58, 237, 0.1)',
    iconColor: '#7c3aed',
    ruta: '/reportes/analisis-ranking',
    permiso: 'reports.analisis.read',
  },
  {
    titulo: 'Ingresos por Sede',
    descripcion: 'Consolidado de órdenes generadas y montos económicos recaudados por cada sede.',
    categoria: 'Financiero',
    categoriaColor: 'green',
    icono: <BankOutlined />,
    gradient: 'linear-gradient(90deg, #059669 0%, #34d399 100%)',
    iconBg: 'rgba(5, 150, 105, 0.1)',
    iconColor: '#059669',
    ruta: '/reportes/ingresos-sede',
    permiso: 'reports.ingresos.read',
  },
  {
    titulo: 'Productividad de Personal',
    descripcion: 'Métricas de rendimiento por usuario: órdenes registradas, resultados ingresados y aprobaciones.',
    categoria: 'Rendimiento',
    categoriaColor: 'orange',
    icono: <TeamOutlined />,
    gradient: 'linear-gradient(90deg, #ea580c 0%, #fb923c 100%)',
    iconBg: 'rgba(234, 88, 12, 0.1)',
    iconColor: '#ea580c',
    ruta: '/reportes/productividad',
    permiso: 'reports.productividad.read',
  },
  {
    titulo: 'Cuadre de Caja Diaria',
    descripcion: 'Arqueo de ingresos, liquidación por turno o cajero y control de efectivo físico vs pagos digitales.',
    categoria: 'Caja & Turno',
    categoriaColor: 'cyan',
    icono: <DollarOutlined />,
    gradient: 'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
    iconBg: 'rgba(13, 148, 136, 0.1)',
    iconColor: '#0d9488',
    ruta: '/reportes/cuadre-caja',
    permiso: 'reports.cuadre_caja.read',
  },
];

export default function ReportesPage() {
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  const reportesDisponibles = useMemo(() => {
    if (isSuperAdmin || isAdmin) return reportes;
    const filtrados = reportes.filter((reporte) => hasPermission(reporte.permiso));
    // Fallback de retrocompatibilidad: si solo tiene el permiso general reports.read y no submódulos asignados aún
    if (filtrados.length === 0 && hasPermission('reports.read')) {
      return reportes;
    }
    return filtrados;
  }, [hasPermission, isSuperAdmin, isAdmin]);

  const canAccess =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('reports.read') ||
    reportesDisponibles.length > 0;

  return (
    <ModulePageLayout
      title="Centro de Reportes & Analítica"
      subtitle="Genera, visualiza y exporta informes ejecutivos de gestión del laboratorio clínico"
    >
      {canAccess && reportesDisponibles.length > 0 ? (
        <Row gutter={[20, 20]}>
          {reportesDisponibles.map((reporte, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <ReporteCard {...reporte} />
            </Col>
          ))}
        </Row>
      ) : (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        >
          <Text type="secondary">
            No cuentas con permisos para consultar los reportes del laboratorio.
          </Text>
        </div>
      )}
    </ModulePageLayout>
  );
}
