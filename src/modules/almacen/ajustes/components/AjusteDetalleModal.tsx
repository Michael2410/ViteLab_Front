import { Modal, Descriptions, Table, Tag, Typography, Button, Space, Input, message } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { Ajuste, ItemAjusteDetalle } from '../ajustes.types';
import { ajustesApi } from '../ajustes.api';

const { Text } = Typography;

interface AjusteDetalleModalProps {
  open: boolean;
  ajuste: Ajuste | null;
  onClose: () => void;
  onSuccess?: () => void;
  canApprove?: boolean;
}

export default function AjusteDetalleModal({
  open,
  ajuste,
  onClose,
  onSuccess,
  canApprove = false,
}: AjusteDetalleModalProps) {
  const [procesando, setProcesando] = useState(false);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  if (!ajuste) return null;

  const handleAprobar = async () => {
    try {
      setProcesando(true);
      await ajustesApi.aprobar(ajuste.id);
      message.success('Ajuste aprobado. Movimientos aplicados al kardex e inventario.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error aprobando ajuste');
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
      await ajustesApi.rechazar(ajuste.id, motivoRechazo);
      message.success('Ajuste rechazado');
      setMostrarRechazo(false);
      setMotivoRechazo('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error rechazando ajuste');
    } finally {
      setProcesando(false);
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'PENDIENTE': return 'gold';
      case 'APROBADO': return 'green';
      case 'RECHAZADO': return 'red';
      default: return 'default';
    }
  };

  const columns: ColumnsType<ItemAjusteDetalle> = [
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
      title: 'Lote',
      dataIndex: 'numero_lote',
      key: 'numero_lote',
      width: 120,
      render: (v) => <Tag color="blue">{v || 'S/L'}</Tag>,
    },
    {
      title: 'Sentido',
      dataIndex: 'sentido',
      key: 'sentido',
      width: 110,
      render: (v) => (
        <Tag color={v === 'ENTRADA' ? 'green' : 'volcano'}>
          {v === 'ENTRADA' ? '+ ENTRADA' : '- SALIDA'}
        </Tag>
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 120,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: r.sentido === 'ENTRADA' ? '#10b981' : '#ef4444' }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
    {
      title: 'Observación',
      dataIndex: 'observacion',
      key: 'observacion',
      render: (v) => v || '-',
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>Ajuste {ajuste.numero}</span>
          <Tag color={getStatusColor(ajuste.estado)}>{ajuste.estado}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={780}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {canApprove && ajuste.estado === 'PENDIENTE' && !mostrarRechazo && (
              <>
                <Button type="primary" onClick={handleAprobar} loading={procesando}>
                  Aprobar Ajuste (Aplicar a Stock)
                </Button>
                <Button danger onClick={() => setMostrarRechazo(true)}>
                  Rechazar
                </Button>
              </>
            )}
          </Space>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Almacén">{ajuste.almacen_nombre}</Descriptions.Item>
        <Descriptions.Item label="Tipo">{ajuste.tipo}</Descriptions.Item>
        <Descriptions.Item label="Causa / Motivo">{ajuste.motivo || 'No especificado'}</Descriptions.Item>
        <Descriptions.Item label="Registrado por">{ajuste.usuario_registro_nombre || '-'}</Descriptions.Item>
        <Descriptions.Item label="Fecha Registro">{ajuste.created_at?.slice(0, 10)}</Descriptions.Item>
        {ajuste.fecha_aprobacion && (
          <>
            <Descriptions.Item label="Fecha Aprobación">{ajuste.fecha_aprobacion.slice(0, 10)}</Descriptions.Item>
            <Descriptions.Item label="Aprobado por">{ajuste.usuario_aprobacion_nombre || '-'}</Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="Observaciones" span={2}>
          {ajuste.observaciones || 'Sin observaciones'}
        </Descriptions.Item>
        {ajuste.motivo_rechazo && (
          <Descriptions.Item label="Motivo de Rechazo" span={2}>
            <Text type="danger">{ajuste.motivo_rechazo}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {mostrarRechazo && (
        <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
          <Text strong style={{ color: '#dc2626' }}>
            Indique el motivo del rechazo del ajuste:
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

      <div style={{ marginTop: 16 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          Ítems del Ajuste
        </Text>
        <Table
          dataSource={ajuste.items || []}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  );
}
