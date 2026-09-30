import { Modal, Descriptions, Tag, Typography, Button, Space, Input, InputNumber, message } from 'antd';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import GlobalTable from '../../../../shared/components/GlobalTable';
import type { Transferencia, ItemTransferenciaDetalle } from '../transferencias.types';
import { transferenciasApi } from '../transferencias.api';

const { Text } = Typography;

interface TransferenciaRecepcionModalProps {
  open: boolean;
  transferencia: Transferencia | null;
  onClose: () => void;
  onSuccess?: () => void;
  canApprove?: boolean;
  canAnular?: boolean;
}

interface ItemRecepcionForm {
  detalle_id: number;
  producto_codigo: string | null;
  producto_nombre: string;
  numero_lote: string | null;
  unidad_medida: string;
  cantidad_enviada: number;
  cantidad_recibida: number;
  motivo_diferencia: string;
}

export default function TransferenciaRecepcionModal({
  open,
  transferencia,
  onClose,
  onSuccess,
  canApprove = false,
  canAnular = false,
}: TransferenciaRecepcionModalProps) {
  const [procesando, setProcesando] = useState(false);
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [modoRecepcion, setModoRecepcion] = useState(false);
  const [itemsRecepcion, setItemsRecepcion] = useState<ItemRecepcionForm[]>([]);

  useEffect(() => {
    if (transferencia && open) {
      setModoRecepcion(false);
      setMostrarAnulacion(false);
      setMotivoAnulacion('');
      setItemsRecepcion(
        (transferencia.items || []).map((i) => ({
          detalle_id: i.id,
          producto_codigo: i.producto_codigo,
          producto_nombre: i.producto_nombre,
          numero_lote: i.numero_lote,
          unidad_medida: i.unidad_medida_codigo,
          cantidad_enviada: i.cantidad_enviada,
          cantidad_recibida: i.cantidad_recibida ?? i.cantidad_enviada,
          motivo_diferencia: i.motivo_diferencia || '',
        }))
      );
    }
  }, [transferencia, open]);

  if (!transferencia) return null;

  const handleConfirmarRecepcion = async () => {
    try {
      for (const item of itemsRecepcion) {
        if (item.cantidad_recibida < 0) {
          message.warning('La cantidad recibida no puede ser negativa');
          return;
        }
        if (item.cantidad_recibida > item.cantidad_enviada) {
          message.error(
            `La cantidad recibida para ${item.producto_nombre} (${item.cantidad_recibida}) no puede superar la enviada (${item.cantidad_enviada})`
          );
          return;
        }
        if (item.cantidad_recibida < item.cantidad_enviada && !item.motivo_diferencia.trim()) {
          message.warning(
            `Existe una diferencia para ${item.producto_nombre}. Debe registrar el motivo de la merma en tránsito.`
          );
          return;
        }
      }

      setProcesando(true);
      await transferenciasApi.recibir(transferencia.id, {
        items: itemsRecepcion.map((i) => ({
          detalle_id: i.detalle_id,
          cantidad_recibida: i.cantidad_recibida,
          motivo_diferencia: i.motivo_diferencia.trim() || undefined,
        })),
      });

      message.success('Transferencia recepcionada e ingresada al inventario de destino');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error recepcionando transferencia');
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
      await transferenciasApi.anular(transferencia.id, motivoAnulacion);
      message.success('Transferencia anulada. Stock retornado a almacén origen.');
      setMostrarAnulacion(false);
      setMotivoAnulacion('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error anulando transferencia');
    } finally {
      setProcesando(false);
    }
  };

  const columnsLectura: ColumnsType<ItemTransferenciaDetalle> = [
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
      title: 'Enviado',
      dataIndex: 'cantidad_enviada',
      key: 'cantidad_enviada',
      width: 110,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: '#0284c7' }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
    {
      title: 'Recibido',
      dataIndex: 'cantidad_recibida',
      key: 'cantidad_recibida',
      width: 110,
      align: 'right',
      render: (v, r) =>
        v !== null ? (
          <Text strong style={{ color: Number(v) < r.cantidad_enviada ? '#d97706' : '#10b981' }}>
            {v} {r.unidad_medida_codigo}
          </Text>
        ) : (
          <Text type="secondary">En tránsito</Text>
        ),
    },
    {
      title: 'Diferencia / Merma',
      dataIndex: 'motivo_diferencia',
      key: 'motivo_diferencia',
      render: (v) => (v ? <Tag color="orange">{v}</Tag> : '-'),
    },
  ];

  const columnsEdicion: ColumnsType<ItemRecepcionForm> = [
    {
      title: 'Producto y Lote',
      key: 'prod',
      render: (_, r) => (
        <div>
          <Text strong>{r.producto_nombre}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
            Lote: {r.numero_lote || 'S/L'} | Enviado: {r.cantidad_enviada} {r.unidad_medida}
          </Text>
        </div>
      ),
    },
    {
      title: 'Cantidad Recibida',
      dataIndex: 'cantidad_recibida',
      key: 'cantidad_recibida',
      width: 160,
      render: (val, record) => (
        <InputNumber
          min={0}
          max={record.cantidad_enviada}
          step={1}
          value={val}
          onChange={(v) => {
            const num = v ?? 0;
            setItemsRecepcion((prev) =>
              prev.map((i) => (i.detalle_id === record.detalle_id ? { ...i, cantidad_recibida: num } : i))
            );
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Motivo de Diferencia (si faltan uds)',
      dataIndex: 'motivo_diferencia',
      key: 'motivo_diferencia',
      width: 240,
      render: (val, record) => (
        <Input
          placeholder="Rotura, merma, derrame..."
          disabled={record.cantidad_recibida >= record.cantidad_enviada}
          value={val}
          onChange={(e) => {
            const txt = e.target.value;
            setItemsRecepcion((prev) =>
              prev.map((i) => (i.detalle_id === record.detalle_id ? { ...i, motivo_diferencia: txt } : i))
            );
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>Transferencia {transferencia.numero}</span>
          <Tag color={transferencia.estado === 'EN_TRANSITO' ? 'gold' : transferencia.estado === 'RECIBIDA' ? 'green' : 'red'}>
            {transferencia.estado}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={840}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {canApprove && transferencia.estado === 'EN_TRANSITO' && (
              <>
                {!modoRecepcion ? (
                  <Button type="primary" onClick={() => setModoRecepcion(true)}>
                    Recepcionar Transferencia
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setModoRecepcion(false)}>Volver a Vista</Button>
                    <Button type="primary" loading={procesando} onClick={handleConfirmarRecepcion}>
                      Confirmar Ingreso en Destino
                    </Button>
                  </>
                )}
              </>
            )}
            {canAnular && transferencia.estado === 'EN_TRANSITO' && !mostrarAnulacion && !modoRecepcion && (
              <Button danger onClick={() => setMostrarAnulacion(true)}>
                Anular Envío
              </Button>
            )}
          </Space>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Almacén de Origen">
          {transferencia.almacen_origen_nombre}
        </Descriptions.Item>
        <Descriptions.Item label="Almacén de Destino">
          {transferencia.almacen_destino_nombre}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha de Envío">
          {transferencia.fecha_envio?.slice(0, 10)}
        </Descriptions.Item>
        <Descriptions.Item label="Enviado por">
          {transferencia.usuario_envio_nombre || '-'}
        </Descriptions.Item>
        {transferencia.fecha_recepcion && (
          <>
            <Descriptions.Item label="Fecha de Recepción">
              {transferencia.fecha_recepcion?.slice(0, 10)}
            </Descriptions.Item>
            <Descriptions.Item label="Recepcionado por">
              {transferencia.usuario_recepcion_nombre || '-'}
            </Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="Observaciones" span={2}>
          {transferencia.observaciones || 'Sin observaciones'}
        </Descriptions.Item>
        {transferencia.motivo_anulacion && (
          <Descriptions.Item label="Motivo de Anulación" span={2}>
            <Text type="danger">{transferencia.motivo_anulacion}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {mostrarAnulacion && (
        <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
          <Text strong style={{ color: '#dc2626' }}>
            Indique el motivo de la anulación (retornará el stock al almacén de origen):
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
          {modoRecepcion ? 'Conteo de Recepción de Mercadería' : 'Ítems Transferidos'}
        </Text>
        {modoRecepcion ? (
          <GlobalTable<ItemRecepcionForm>
            dataSource={itemsRecepcion}
            columns={columnsEdicion}
            rowKey="detalle_id"
            pagination={false}
            size="small"
          />
        ) : (
          <GlobalTable<ItemTransferenciaDetalle>
            dataSource={transferencia.items || []}
            columns={columnsLectura}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </div>
    </Modal>
  );
}
