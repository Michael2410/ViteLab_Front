import { Modal, Descriptions, Table, Tag, Typography, Button, Space, Input, message } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { Pedido, ItemPedidoDetalle } from '../pedidos.types';
import { pedidosApi } from '../pedidos.api';

const { Text } = Typography;

interface PedidoDetalleModalProps {
  open: boolean;
  pedido: Pedido | null;
  onClose: () => void;
  onSuccess?: () => void;
  canApprove?: boolean;
  canAnular?: boolean;
}

export default function PedidoDetalleModal({
  open,
  pedido,
  onClose,
  onSuccess,
  canApprove = false,
  canAnular = false,
}: PedidoDetalleModalProps) {
  const [procesando, setProcesando] = useState(false);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  if (!pedido) return null;

  const handleAprobar = async () => {
    try {
      setProcesando(true);
      await pedidosApi.aprobar(pedido.id);
      message.success('Pedido aprobado exitosamente');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error aprobando pedido');
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim() || motivoRechazo.length < 5) {
      message.warning('Ingrese un motivo de rechazo de al menos 5 caracteres');
      return;
    }
    try {
      setProcesando(true);
      await pedidosApi.rechazar(pedido.id, motivoRechazo);
      message.success('Pedido rechazado exitosamente');
      setMostrarRechazo(false);
      setMotivoRechazo('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error rechazando pedido');
    } finally {
      setProcesando(false);
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.length < 5) {
      message.warning('Ingrese un motivo de anulación de al menos 5 caracteres');
      return;
    }
    try {
      setProcesando(true);
      await pedidosApi.anular(pedido.id, motivoAnulacion);
      message.success('Pedido anulado exitosamente');
      setMostrarAnulacion(false);
      setMotivoAnulacion('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error anulando pedido');
    } finally {
      setProcesando(false);
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'PENDIENTE': return 'gold';
      case 'APROBADO': return 'blue';
      case 'ATENDIDO_PARCIAL': return 'purple';
      case 'ATENDIDO_TOTAL': return 'green';
      case 'RECHAZADO': return 'volcano';
      case 'ANULADO': return 'default';
      default: return 'default';
    }
  };

  const columns: ColumnsType<ItemPedidoDetalle> = [
    {
      title: 'Código',
      dataIndex: 'producto_codigo',
      key: 'producto_codigo',
      width: 100,
      render: (v) => <Text code>{v || '-'}</Text>,
    },
    {
      title: 'Producto / Reactivo',
      dataIndex: 'producto_nombre',
      key: 'producto_nombre',
    },
    {
      title: 'Stock Almacén',
      dataIndex: 'stock_disponible_almacen',
      key: 'stock_disponible_almacen',
      width: 110,
      align: 'right',
      render: (v, r) => (
        <Text type={Number(v) > 0 ? undefined : 'danger'}>
          {v ?? 0} {r.unidad_medida_codigo}
        </Text>
      ),
    },
    {
      title: 'Solicitado',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 110,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: '#0284c7' }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
    {
      title: 'Aprobado',
      dataIndex: 'cantidad_aprobada',
      key: 'cantidad_aprobada',
      width: 100,
      align: 'right',
      render: (v, r) => (v !== null ? `${v} ${r.unidad_medida_codigo}` : '-'),
    },
    {
      title: 'Atendido',
      dataIndex: 'cantidad_atendida',
      key: 'cantidad_atendida',
      width: 100,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: Number(v) > 0 ? '#10b981' : undefined }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>Pedido {pedido.numero}</span>
          <Tag color={getStatusColor(pedido.estado)}>{pedido.estado}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={780}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {canApprove && pedido.estado === 'PENDIENTE' && !mostrarRechazo && (
              <>
                <Button type="primary" onClick={handleAprobar} loading={procesando}>
                  Aprobar Pedido
                </Button>
                <Button danger onClick={() => setMostrarRechazo(true)}>
                  Rechazar
                </Button>
              </>
            )}
            {canAnular && ['PENDIENTE', 'APROBADO'].includes(pedido.estado) && !mostrarAnulacion && (
              <Button danger onClick={() => setMostrarAnulacion(true)}>
                Anular
              </Button>
            )}
          </Space>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Almacén">
          {pedido.almacen_nombre}
        </Descriptions.Item>
        <Descriptions.Item label="Solicitante">
          {pedido.solicitante_nombres} {pedido.solicitante_apellidos} (
          {pedido.solicitante_documento || 'Sin doc'})
        </Descriptions.Item>
        <Descriptions.Item label="Fecha de Registro">
          {pedido.created_at?.slice(0, 10)}
        </Descriptions.Item>
        <Descriptions.Item label="Registrado por">
          {pedido.usuario_registro_nombre || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Observaciones" span={2}>
          {pedido.observaciones || 'Sin observaciones'}
        </Descriptions.Item>
        {pedido.motivo_rechazo && (
          <Descriptions.Item label="Motivo de Rechazo" span={2}>
            <Text type="danger">{pedido.motivo_rechazo}</Text>
          </Descriptions.Item>
        )}
        {pedido.motivo_anulacion && (
          <Descriptions.Item label="Motivo de Anulación" span={2}>
            <Text type="danger">{pedido.motivo_anulacion}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {mostrarRechazo && (
        <div style={{ marginTop: 16, padding: 12, background: '#fff7ed', borderRadius: 8 }}>
          <Text strong style={{ color: '#c2410c' }}>
            Indique el motivo del rechazo del pedido:
          </Text>
          <Input.TextArea
            rows={2}
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Motivo de rechazo..."
            style={{ marginTop: 8 }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setMostrarRechazo(false)}>
              Cancelar
            </Button>
            <Button
              size="small"
              type="primary"
              danger
              loading={procesando}
              onClick={handleRechazar}
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      )}

      {mostrarAnulacion && (
        <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
          <Text strong style={{ color: '#dc2626' }}>
            Indique el motivo de la anulación del pedido:
          </Text>
          <Input.TextArea
            rows={2}
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            placeholder="Motivo de anulación..."
            style={{ marginTop: 8 }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setMostrarAnulacion(false)}>
              Cancelar
            </Button>
            <Button
              size="small"
              type="primary"
              danger
              loading={procesando}
              onClick={handleAnular}
            >
              Confirmar Anulación
            </Button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          Ítems del Pedido
        </Text>
        <Table
          dataSource={pedido.items || []}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  );
}
