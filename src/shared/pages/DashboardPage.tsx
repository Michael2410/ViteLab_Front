import { Typography, Row, Col, Card, Statistic, Space, Alert } from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExperimentOutlined 
} from '@ant-design/icons';
import PageContainer from '../components/PageContainer';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>📊 Dashboard</Title>
          <Paragraph type="secondary">
            Resumen general del sistema de laboratorio
          </Paragraph>
        </div>

      <Alert
        message="Bienvenido al Sistema ViteLab"
        description="Todos los sistemas están operativos. Estadísticas actualizadas en tiempo real."
        type="success"
        showIcon
        closable
      />
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title="Órdenes Registradas"
              value={45}
              prefix={<FileTextOutlined style={{ fontSize: 28 }} />}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold', fontSize: 32 }}
              suffix={<span style={{ fontSize: 14, fontWeight: 'normal' }}>total</span>}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title="Pendientes de Resultados"
              value={12}
              prefix={<ClockCircleOutlined style={{ fontSize: 28 }} />}
              valueStyle={{ color: '#faad14', fontWeight: 'bold', fontSize: 32 }}
              suffix={<span style={{ fontSize: 14, fontWeight: 'normal' }}>órdenes</span>}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title="Con Resultados"
              value={18}
              prefix={<ExperimentOutlined style={{ fontSize: 28 }} />}
              valueStyle={{ color: '#722ed1', fontWeight: 'bold', fontSize: 32 }}
              suffix={<span style={{ fontSize: 14, fontWeight: 'normal' }}>órdenes</span>}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title="Aprobadas"
              value={15}
              prefix={<CheckCircleOutlined style={{ fontSize: 28 }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: 32 }}
              suffix={<span style={{ fontSize: 14, fontWeight: 'normal' }}>órdenes</span>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title="📈 Actividad Reciente" 
            bordered={false}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Las últimas órdenes procesadas aparecerán aquí...
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="⚠️ Alertas del Sistema" 
            bordered={false}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              No hay alertas pendientes en este momento.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
    </PageContainer>
  );
}
