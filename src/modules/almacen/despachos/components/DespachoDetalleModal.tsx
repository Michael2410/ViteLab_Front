import { Modal, Descriptions, Table, Tag, Typography, Button, Space, Input, message } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { Despacho, DespachoItem } from '../despachos.types';
import { despachosApi } from '../despachos.api';

const { Text } = Typography;

interface DespachoDetalleModalProps {
  open: boolean;
  despacho: Despacho | null;
  onClose: () => void;
  onAnulado?: () => void;
  canAnular?: boolean;
}

export default function DespachoDetalleModal({
  open,
  despacho,
  onClose,
  onAnulado,
  canAnular = false,
}: DespachoDetalleModalProps) {
  const [anulando, setAnulando] = useState(false);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [motivo, setMotivo] = useState('');

  if (!despacho) return null;

  const handleAnular = async () => {
    if (!motivo.trim() || motivo.length < 5) {
      message.warning('Ingrese un motivo de anulación de al menos 5 caracteres');
      return;
    }
    try {
      setAnulando(true);
      await despachosApi.anular(despacho.id, motivo);
      message.success('Despacho anulado exitosamente');
      setMostrarMotivo(false);
      setMotivo('');
      if (onAnulado) onAnulado();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al anular despacho');
    } finally {
      setAnulando(false);
    }
  };

  const columns: ColumnsType<DespachoItem> = [
    {
      title: 'Código',
      dataIndex: 'producto_codigo',
      key: 'producto_codigo',
      width: 100,
      render: (v) => <Text code>{v || '-'}</Text>,
    },
    {
      title: 'Producto',
      dataIndex: 'producto_nombre',
      key: 'producto_nombre',
    },
    {
      title: 'Lote',
      dataIndex: 'numero_lote',
      key: 'numero_lote',
      width: 120,
      render: (v) => <Tag color="blue">{v || 'S/L'}</Tag>,
    },
    {
      title: 'Vencimiento',
      dataIndex: 'fecha_vencimiento',
      key: 'fecha_vencimiento',
      width: 120,
      render: (v) => (v ? <Tag color="cyan">{v}</Tag> : '-'),
    },
    {
      title: 'Cantidad Asignada',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 140,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: '#0284c7' }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>Despacho {despacho.numero}</span>
          <Tag color={despacho.estado === 'REGISTRADO' ? 'green' : 'red'}>
            {despacho.estado}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={780}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {canAnular && despacho.estado === 'REGISTRADO' && !mostrarMotivo && (
              <Button danger onClick={() => setMostrarMotivo(true)}>
                Anular Despacho
              </Button>
            )}
          </div>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Almacén de Origen">
          {despacho.almacen_nombre}
        </Descriptions.Item>
        <Descriptions.Item label="Trabajador Receptor">
          {despacho.receptor_nombres} {despacho.receptor_apellidos} (
          {despacho.receptor_documento || 'Sin doc'})
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {despacho.fecha?.slice(0, 10)}
        </Descriptions.Item>
        <Descriptions.Item label="Registrado por">
          {despacho.usuario_registro_nombre || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Observaciones" span={2}>
          {despacho.observaciones || 'Sin observaciones'}
        </Descriptions.Item>
        {despacho.estado === 'ANULADO' && (
          <Descriptions.Item label="Motivo de Anulación" span={2}>
            <Text type="danger">{despacho.motivo_anulacion || '-'}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {mostrarMotivo && (
        <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
          <Text strong style={{ color: '#dc2626' }}>
            Indique el motivo de la anulación (devolverá el stock a almacén):
          </Text>
          <Input.TextArea
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de anulación..."
            style={{ marginTop: 8 }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setMostrarMotivo(false)}>
              Cancelar
            </Button>
            <Button
              size="small"
              type="primary"
              danger
              loading={anulando}
              onClick={handleAnular}
            >
              Confirmar Anulación
            </Button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          Ítems Despachados
        </Text>
        <Table
          dataSource={despacho.items || []}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  );
}
