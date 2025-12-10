import { useState } from 'react';
import { Badge, Button, Popover, List, Typography, Space, Empty, Divider, Tooltip } from 'antd';
import { BellOutlined, CheckCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAlertasCounts } from '../../modules/ordenes/hooks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

const { Text, Title } = Typography;

export default function HeaderAlertas() {
  const navigate = useNavigate();
  const { data: alertas, isLoading } = useAlertasCounts();
  const [ordenesApprobadasVisible, setOrdenesApprobadasVisible] = useState(false);

  const ordenesAprobadas = alertas?.ordenesAprobadas || 0;
  const ordenesPendientes = alertas?.ordenesPendientesAprobar || 0;
  const ordenesAprobadasDetalle = alertas?.ordenesAprobadasDetalle || [];

  const handleOrdenClick = (ordenId: number) => {
    setOrdenesApprobadasVisible(false);
    navigate(`/ordenes?id=${ordenId}`);
  };

  const handleVerTodasAprobadas = () => {
    setOrdenesApprobadasVisible(false);
    navigate('/ordenes?estado=APROBADA');
  };

  const handleVerPendientesAprobar = () => {
    navigate('/aprobaciones');
  };

  const ordenesAprobadasContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
        <Title level={5} style={{ margin: 0 }}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Órdenes Aprobadas
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Pendientes de imprimir / entregar resultados
        </Text>
      </div>

      {ordenesAprobadasDetalle.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No hay órdenes aprobadas pendientes"
          style={{ padding: '20px 0' }}
        />
      ) : (
        <>
          <List
            size="small"
            dataSource={ordenesAprobadasDetalle}
            renderItem={(item) => (
              <List.Item
                style={{ 
                  cursor: 'pointer', 
                  padding: '8px 12px',
                  borderRadius: 6,
                  transition: 'background 0.2s',
                }}
                onClick={() => handleOrdenClick(item.id)}
                className="alerta-item-hover"
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong style={{ color: '#1890ff' }}>
                        #{item.numero_atencion}
                      </Text>
                      <Text>{item.paciente_nombre}</Text>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Aprobada {dayjs(item.fecha_aprobacion).fromNow()}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <Button type="link" onClick={handleVerTodasAprobadas}>
              Ver todas las órdenes aprobadas
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Space size="middle">
      {/* Campana de órdenes aprobadas (pendientes de imprimir) */}
      <Popover
        content={ordenesAprobadasContent}
        trigger="click"
        placement="bottomRight"
        open={ordenesApprobadasVisible}
        onOpenChange={setOrdenesApprobadasVisible}
      >
        <Tooltip title="Órdenes aprobadas pendientes de imprimir">
          <Badge 
            count={ordenesAprobadas} 
            offset={[-2, 2]}
            style={{ 
              backgroundColor: ordenesAprobadas > 0 ? '#52c41a' : undefined,
            }}
          >
            <Button 
              type="text" 
              icon={<BellOutlined style={{ fontSize: 20 }} />}
              loading={isLoading}
              style={{ 
                width: 40, 
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Badge>
        </Tooltip>
      </Popover>

      {/* Alerta de órdenes pendientes de aprobar */}
      <Tooltip title="Órdenes pendientes de aprobar">
        <Badge 
          count={ordenesPendientes} 
          offset={[-2, 2]}
          style={{ 
            backgroundColor: ordenesPendientes > 0 ? '#faad14' : undefined,
          }}
        >
          <Button 
            type="text" 
            icon={<IssuesCloseOutlined style={{ fontSize: 20 }} />}
            onClick={handleVerPendientesAprobar}
            loading={isLoading}
            style={{ 
              width: 40, 
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Badge>
      </Tooltip>

      <style>{`
        .alerta-item-hover:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </Space>
  );
}
