import { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  Row,
  Col,
  Card,
  Spin,
  Space,
  Button,
  Tag,
  Badge,
  Progress,
  Tooltip,
} from 'antd';
import {
  BankOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  PlusOutlined,
  RightOutlined,
  EyeOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { obtenerDashboardStats } from '../../modules/sistema/api';
import type { DashboardStats } from '../../modules/sistema/types';
import { useAuthStore } from '../../modules/auth/hooks';

dayjs.locale('es');
const { Title, Text, Paragraph } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await obtenerDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Saludo dinámico según la hora
  const saludo = useMemo(() => {
    const hora = dayjs().hour();
    if (hora >= 5 && hora < 12) return 'Buenos días';
    if (hora >= 12 && hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const fechaHoy = useMemo(() => {
    const f = dayjs().format('dddd, D [de] MMMM [de] YYYY');
    return f.charAt(0).toUpperCase() + f.slice(1);
  }, []);

  return (
    <div style={{ width: '100%', padding: '16px 24px 8px 24px', boxSizing: 'border-box' }}>
      <style>{`
        .kpi-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0 !important;
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04) !important;
          border-color: #cbd5e1 !important;
        }
        .shortcut-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .shortcut-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.06);
          border-color: #3b82f6 !important;
        }
      `}</style>

      {/* 1. HERO BANNER DE BIENVENIDA */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #091e3a 0%, #102e56 45%, #184c7d 100%)',
          border: 'none',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(9, 30, 58, 0.18)',
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <Row align="middle" justify="space-between" gutter={[24, 20]} style={{ position: 'relative', zIndex: 1 }}>
          <Col xs={24} md={15}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Tag
                  color="cyan"
                  style={{
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    backgroundColor: 'rgba(34, 211, 238, 0.15)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    color: '#67e8f9',
                  }}
                >
                  <CalendarOutlined style={{ marginRight: 5 }} /> {fechaHoy}
                </Tag>
                {user?.rol_nombre && (
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#93c5fd',
                    }}
                  >
                    ROL: {user.rol_nombre}
                  </Tag>
                )}
              </div>

              <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {saludo}, {user?.nombres || 'Administrador'}
              </Title>

              <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, margin: 0, maxWidth: 620 }}>
                Bienvenido al panel central de <strong style={{ color: '#ffffff' }}>ViteLab LIMS</strong>. Monitorea el flujo operativo, recepción de muestras y validación de resultados en tiempo real.
              </Paragraph>
            </Space>
          </Col>

          <Col xs={24} md={9} style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
            <Button
              size="large"
              icon={<EyeOutlined />}
              onClick={() => navigate('/ordenes')}
              style={{
                height: 42,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
              }}
            >
              Ver Órdenes
            </Button>
          </Col>
        </Row>

        {/* Orbes decorativos de fondo */}
        <div
          style={{
            position: 'absolute',
            right: -60,
            top: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 140,
            bottom: -90,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none',
          }}
        />
      </Card>

      {/* 2. ESTADÍSTICAS GENERALES (KPIs) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              Métricas Operativas del Día
            </Title>
          </div>
          <Tooltip title="Actualizar datos">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={loading} style={{ color: '#2563eb' }} />}
              onClick={fetchStats}
              style={{ borderRadius: 6, fontWeight: 500, color: '#64748b' }}
            >
              Sincronizar
            </Button>
          </Tooltip>
        </div>

        <Row gutter={[16, 16]}>
          {/* KPI 1: Órdenes Hoy */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="kpi-card"
              hoverable
              onClick={() => navigate('/ordenes')}
              style={{ borderRadius: 14, background: '#ffffff', cursor: 'pointer' }}
              styles={{ body: { padding: '20px 18px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Órdenes Hoy
                  </Text>
                  <Title level={2} style={{ margin: '4px 0 2px 0', fontWeight: 800, color: '#0f172a' }}>
                    {stats?.totales.ordenes_hoy || 0}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                    <RiseOutlined /> Total registradas
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontSize: 22,
                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
                  }}
                >
                  <FileTextOutlined />
                </div>
              </div>
            </Card>
          </Col>

          {/* KPI 2: Pendientes de Resultados */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="kpi-card"
              hoverable
              onClick={() => navigate('/resultados')}
              style={{ borderRadius: 14, background: '#ffffff', cursor: 'pointer' }}
              styles={{ body: { padding: '20px 18px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pendientes
                  </Text>
                  <Title level={2} style={{ margin: '4px 0 2px 0', fontWeight: 800, color: '#d97706' }}>
                    {stats?.totales.pendientes_resultados || 0}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                    <ClockCircleOutlined /> En proceso analítico
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                    fontSize: 22,
                    boxShadow: '0 4px 10px rgba(217, 119, 6, 0.15)',
                  }}
                >
                  <ClockCircleOutlined />
                </div>
              </div>
            </Card>
          </Col>

          {/* KPI 3: Con Resultados */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="kpi-card"
              hoverable
              onClick={() => navigate('/aprobaciones')}
              style={{ borderRadius: 14, background: '#ffffff', cursor: 'pointer' }}
              styles={{ body: { padding: '20px 18px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Por Validar
                  </Text>
                  <Title level={2} style={{ margin: '4px 0 2px 0', fontWeight: 800, color: '#7c3aed' }}>
                    {stats?.totales.con_resultados || 0}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
                    <ExperimentOutlined /> Listas para aprobación
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7c3aed',
                    fontSize: 22,
                    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.15)',
                  }}
                >
                  <ExperimentOutlined />
                </div>
              </div>
            </Card>
          </Col>

          {/* KPI 4: Aprobadas */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="kpi-card"
              hoverable
              onClick={() => navigate('/ordenes')}
              style={{ borderRadius: 14, background: '#ffffff', cursor: 'pointer' }}
              styles={{ body: { padding: '20px 18px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Aprobadas
                  </Text>
                  <Title level={2} style={{ margin: '4px 0 2px 0', fontWeight: 800, color: '#059669' }}>
                    {stats?.totales.aprobadas || 0}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    <CheckCircleOutlined /> Listas para entrega
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    fontSize: 22,
                    boxShadow: '0 4px 10px rgba(5, 150, 105, 0.15)',
                  }}
                >
                  <CheckCircleOutlined />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 3. SECCIÓN PRINCIPAL: COLUMNA IZQUIERDA (Sedes) Y DERECHA (Accesos Rápidos) */}
      <Row gutter={[20, 20]} style={{ alignItems: 'stretch' }}>
        {/* Columna Izquierda: Sedes */}
        <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Card de Sedes Activas */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BankOutlined style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Flujo por Sede (Hoy)</span>
              </div>
            }
            bordered={true}
            style={{
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              height: '100%',
              minHeight: 380,
              display: 'flex',
              flexDirection: 'column',
            }}
            styles={{
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: '24px',
              },
            }}
          >
            {loading && !stats ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 30 }}>
                <Spin size="default" tip="Cargando sedes..." />
              </div>
            ) : stats && stats.sedes.length > 0 ? (
              <Row gutter={[16, 16]} style={{ width: '100%' }}>
                {stats.sedes.map((sede) => {
                  const totalSede = sede.ordenes_hoy || 0;
                  const porcentajeAprobado =
                    totalSede > 0 ? Math.round((sede.ordenes_aprobadas / totalSede) * 100) : 0;

                  return (
                    <Col key={sede.id} xs={24} sm={12}>
                      <div
                        style={{
                          padding: '24px 20px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Badge color={sede.color || '#2563eb'} />
                              <Text strong style={{ fontSize: 16, color: '#1e293b' }}>
                                {sede.nombre}
                              </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Sede Operativa
                            </Text>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: sede.color || '#2563eb' }}>
                              {totalSede}
                            </span>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Órdenes</div>
                          </div>
                        </div>

                        {/* Chips de desglose */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Tag color="orange" style={{ margin: 0, borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
                            Pend: {sede.ordenes_pendientes || 0}
                          </Tag>
                          <Tag color="purple" style={{ margin: 0, borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
                            Result: {sede.ordenes_con_resultados || 0}
                          </Tag>
                          <Tag color="green" style={{ margin: 0, borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
                            Aprob: {sede.ordenes_aprobadas || 0}
                          </Tag>
                        </div>

                        {/* Barra de progreso de avance */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                            <span>Avance de entrega</span>
                            <span style={{ fontWeight: 600, color: '#059669' }}>{porcentajeAprobado}%</span>
                          </div>
                          <Progress
                            percent={porcentajeAprobado}
                            showInfo={false}
                            strokeColor={sede.color || '#10b981'}
                            size="default"
                          />
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8' }}>
                No se encontraron órdenes registradas para las sedes el día de hoy.
              </div>
            )}
          </Card>
        </Col>

        {/* Columna Derecha: Accesos Rápidos */}
        <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Card de Accesos Directos */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThunderboltOutlined style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Acciones Rápidas</span>
              </div>
            }
            bordered={true}
            style={{
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              height: '100%',
              minHeight: 380,
            }}
          >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hasPermission('orders.create') && (
                  <div
                    className="shortcut-card"
                    onClick={() => navigate('/ordenes/nueva')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563eb',
                        }}
                      >
                        <PlusOutlined style={{ fontSize: 16 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Registrar Nueva Orden</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Admisión rápida de paciente</div>
                      </div>
                    </div>
                    <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                  </div>
                )}

                {hasPermission('results.create') && (
                  <div
                    className="shortcut-card"
                    onClick={() => navigate('/resultados')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: '#faf5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#7c3aed',
                        }}
                      >
                        <ExperimentOutlined style={{ fontSize: 16 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Ingresar Resultados</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Ingreso analítico</div>
                      </div>
                    </div>
                    <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                  </div>
                )}

                {hasPermission('results.approve') && (
                  <div
                    className="shortcut-card"
                    onClick={() => navigate('/aprobaciones')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: '#ecfdf5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#059669',
                        }}
                      >
                        <CheckSquareOutlined style={{ fontSize: 16 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Aprobación Resultados</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Validar resultados listos</div>
                      </div>
                    </div>
                    <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                  </div>
                )}

                {hasPermission('reports.read') && (
                  <div
                    className="shortcut-card"
                    onClick={() => navigate('/reportes')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: '#fffbeb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d97706',
                        }}
                      >
                        <BarChartOutlined style={{ fontSize: 16 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Reportes de Gestión</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Ingresos y ranking de análisis</div>
                      </div>
                    </div>
                    <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                  </div>
                )}
              </div>
            </Card>
        </Col>
      </Row>
    </div>
  );
}
