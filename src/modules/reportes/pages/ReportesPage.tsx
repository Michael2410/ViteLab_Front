import { Card, Row, Col, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  BankOutlined,
  ExperimentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../auth/hooks';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Paragraph } = Typography;

interface ReporteCardProps {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
  ruta: string;
}

const ReporteCard = ({ titulo, descripcion, icono, color, ruta }: ReporteCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(ruta)}
      style={{
        height: '100%',
        borderRadius: 12,
        borderTop: `4px solid ${color}`,
      }}
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: color,
          }}
        >
          {icono}
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
            {titulo}
          </Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
            {descripcion}
          </Paragraph>
        </div>
      </div>
    </Card>
  );
};

const reportes: ReporteCardProps[] = [
  {
    titulo: 'Órdenes por Período',
    descripcion: 'Listado de órdenes registradas por rango de fechas, sede y estado',
    icono: <FileTextOutlined />,
    color: '#1890ff',
    ruta: '/reportes/ordenes-periodo',
  },
  {
    titulo: 'Ingresos por Sede',
    descripcion: 'Cantidad de órdenes y montos totales agrupados por sede',
    icono: <BankOutlined />,
    color: '#52c41a',
    ruta: '/reportes/ingresos-sede',
  },
  {
    titulo: 'Análisis Más Solicitados',
    descripcion: 'Ranking de los análisis más pedidos en el período',
    icono: <ExperimentOutlined />,
    color: '#722ed1',
    ruta: '/reportes/analisis-ranking',
  },
  {
    titulo: 'Productividad por Usuario',
    descripcion: 'Órdenes registradas, resultados ingresados y aprobaciones por usuario',
    icono: <TeamOutlined />,
    color: '#fa8c16',
    ruta: '/reportes/productividad',
  },
];

export default function ReportesPage() {
  const { hasPermission } = useAuthStore();

  return (
    <PageContainer>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
          📊 Reportes del Sistema
        </Title>
        <Paragraph type="secondary">
          Genera reportes detallados del sistema. Selecciona un tipo de reporte para comenzar.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {reportes.map((reporte, index) => (
          hasPermission('orders.read') && (
            <Col xs={24} sm={12} lg={12} xl={6} key={index}>
              <ReporteCard {...reporte} />
            </Col>
          )
        ))}
      </Row>
    </PageContainer>
  );
}
