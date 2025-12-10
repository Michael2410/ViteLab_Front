import { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Spin, Space } from 'antd';
import { 
  BankOutlined,
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExperimentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import PageContainer from '../components/PageContainer';
import { obtenerDashboardStats } from '../../modules/sistema/api';
import type { DashboardStats, SedeStats } from '../../modules/sistema/types';
import { useAuthStore } from '../../modules/auth/hooks';

const { Title, Paragraph, Text } = Typography;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

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
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Componente de tarjeta de sede
  const SedeCard = ({ sede }: { sede: SedeStats }) => (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        borderTop: `4px solid ${sede.color}`,
        textAlign: 'center',
        height: '100%',
      }}
      styles={{ body: { padding: '24px 16px' } }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <BankOutlined style={{ fontSize: 24, color: sede.color }} />
        <Text strong style={{ fontSize: 14, color: '#666' }}>{sede.nombre}</Text>
        <Title level={1} style={{ margin: '8px 0', color: sede.color }}>
          {sede.ordenes_hoy}
        </Title>
        <Text type="secondary">Órdenes Recibidas</Text>
      </Space>
    </Card>
  );

  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Banner de bienvenida */}
        <Card
          style={{
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
            border: 'none',
            overflow: 'hidden',
            position: 'relative',
          }}
          styles={{ body: { padding: '40px 32px', minHeight: 180 } }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Title level={2} style={{ color: 'white', marginBottom: 8, fontWeight: 400 }}>
              Hola, {user?.nombres || 'Usuario'}.
            </Title>
            <Title level={3} style={{ color: 'white', marginTop: 0, marginBottom: 8, fontWeight: 600 }}>
              Bienvenido a ViteLab LIMS.
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 0 }}>
              Tu sistema de gestión integral.
            </Paragraph>
          </div>
          {/* Decoración de fondo */}
          <div
            style={{
              position: 'absolute',
              right: -50,
              top: -50,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 100,
              bottom: -80,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
            }}
          />
        </Card>

        {/* Resumen por Sede */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              Resumen de Órdenes por Sede (Hoy)
            </Title>
            <ReloadOutlined 
              onClick={fetchStats} 
              style={{ fontSize: 18, cursor: 'pointer', color: '#1890ff' }} 
              spin={loading}
            />
          </div>
          
          {loading && !stats ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : stats && stats.sedes.length > 0 ? (
            <Row gutter={[16, 16]}>
              {stats.sedes.map((sede) => (
                <Col key={sede.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <SedeCard sede={sede} />
                </Col>
              ))}
            </Row>
          ) : (
            <Card style={{ textAlign: 'center', padding: 40 }}>
              <Paragraph type="secondary">No hay sedes disponibles</Paragraph>
            </Card>
          )}
        </div>

        {/* Estadísticas Generales */}
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            Estadísticas Generales
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable 
                style={{ borderRadius: 12, borderLeft: '4px solid #1890ff' }}
              >
                <Space>
                  <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div>
                    <Text type="secondary">Órdenes Hoy</Text>
                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                      {stats?.totales.ordenes_hoy || 0}
                    </Title>
                  </div>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable 
                style={{ borderRadius: 12, borderLeft: '4px solid #faad14' }}
              >
                <Space>
                  <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
                  <div>
                    <Text type="secondary">Pend. Resultados</Text>
                    <Title level={3} style={{ margin: 0, color: '#faad14' }}>
                      {stats?.totales.pendientes_resultados || 0}
                    </Title>
                  </div>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable 
                style={{ borderRadius: 12, borderLeft: '4px solid #722ed1' }}
              >
                <Space>
                  <ExperimentOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                  <div>
                    <Text type="secondary">Con Resultados</Text>
                    <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                      {stats?.totales.con_resultados || 0}
                    </Title>
                  </div>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable 
                style={{ borderRadius: 12, borderLeft: '4px solid #52c41a' }}
              >
                <Space>
                  <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                  <div>
                    <Text type="secondary">Aprobadas</Text>
                    <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                      {stats?.totales.aprobadas || 0}
                    </Title>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </Space>
    </PageContainer>
  );
}
