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
  const { data: alertas, refetch } = useAlertasCounts();
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

  const handleOpenPopoverChange = (open: boolean) => {
    setOrdenesApprobadasVisible(open);
    if (open) {
      refetch();
    }
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

  const hasAprobadas = ordenesAprobadas > 0;
  const hasPendientes = ordenesPendientes > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Campana de órdenes aprobadas (pendientes de imprimir) */}
      <Popover
        content={ordenesAprobadasContent}
        trigger="click"
        placement="bottomRight"
        open={ordenesApprobadasVisible}
        onOpenChange={handleOpenPopoverChange}
      >
        <Tooltip title={hasAprobadas ? `${ordenesAprobadas} órdenes aprobadas` : 'Órdenes aprobadas'}>
          <Badge 
            dot={hasAprobadas} 
            color="#52c41a"
            offset={[-4, 5]}
          >
            <Button 
              type="text" 
              className={hasAprobadas ? 'btn-header-alerta-aprobada' : 'btn-header-alerta-neutral'}
              icon={<BellOutlined style={{ fontSize: 19, color: hasAprobadas ? '#52c41a' : '#64748b' }} />}
              style={{ 
                width: 38, 
                height: 38,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hasAprobadas ? '#52c41a' : '#64748b',
                background: hasAprobadas ? 'rgba(82, 196, 26, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            />
          </Badge>
        </Tooltip>
      </Popover>

      {/* Alerta de órdenes pendientes de aprobar */}
      <Tooltip title={hasPendientes ? `${ordenesPendientes} órdenes pendientes de aprobar` : 'Pendientes de aprobar'}>
        <Badge 
          dot={hasPendientes} 
          color="#faad14"
          offset={[-4, 5]}
        >
          <Button 
            type="text" 
            className={hasPendientes ? 'btn-header-alerta-pendiente' : 'btn-header-alerta-neutral'}
            icon={<IssuesCloseOutlined style={{ fontSize: 19, color: hasPendientes ? '#faad14' : '#64748b' }} />}
            onClick={handleVerPendientesAprobar}
            style={{ 
              width: 38, 
              height: 38,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hasPendientes ? '#faad14' : '#64748b',
              background: hasPendientes ? 'rgba(250, 173, 20, 0.08)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          />
        </Badge>
      </Tooltip>

      <style>{`
        .alerta-item-hover:hover {
          background-color: #f5f5f5 !important;
        }
        .btn-header-alerta-aprobada {
          color: #52c41a !important;
          background: rgba(82, 196, 26, 0.08) !important;
        }
        .btn-header-alerta-aprobada:hover {
          color: #52c41a !important;
          background: rgba(82, 196, 26, 0.16) !important;
        }
        .btn-header-alerta-pendiente {
          color: #faad14 !important;
          background: rgba(250, 173, 20, 0.08) !important;
        }
        .btn-header-alerta-pendiente:hover {
          color: #faad14 !important;
          background: rgba(250, 173, 20, 0.16) !important;
        }
        .btn-header-alerta-neutral {
          color: #64748b !important;
        }
        .btn-header-alerta-neutral:hover {
          color: #1e293b !important;
          background: rgba(0, 0, 0, 0.04) !important;
        }
      `}</style>
    </div>
  );
}
