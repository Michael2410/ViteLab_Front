import { useState, useEffect } from 'react';
import { Modal, Descriptions, Tag, Typography, Button, Space, Input, Card, Spin, Alert, message } from 'antd';
import {
  ExclamationCircleOutlined,
  StopOutlined,
  EditOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { custodiaApi } from '../custodia.api';
import type { Devolucion, DevolucionItem } from '../custodia.types';

const { Text } = Typography;
const { TextArea } = Input;

interface DevolucionDetalleModalProps {
  open: boolean;
  devolucionId: number | null;
  onClose: () => void;
  onAnulado?: () => void;
  onCorregir?: (devolucion: Devolucion) => void;
  canAnular?: boolean;
}

export default function DevolucionDetalleModal({
  open,
  devolucionId,
  onClose,
  onAnulado,
  onCorregir,
  canAnular = true,
}: DevolucionDetalleModalProps) {
  const [devolucion, setDevolucion] = useState<Devolucion | null>(null);
  const [loading, setLoading] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (open && devolucionId) {
      setLoading(true);
      setMostrarMotivo(false);
      setMotivo('');
      custodiaApi
        .obtenerDevolucion(devolucionId)
        .then((data) => setDevolucion(data))
        .catch((err) => {
          message.error(err.response?.data?.message || 'Error al obtener el detalle de la devolución');
          onClose();
        })
        .finally(() => setLoading(false));
    } else {
      setDevolucion(null);
    }
  }, [open, devolucionId, onClose]);

  const handleAnular = async () => {
    if (!devolucion) return;
    if (!motivo.trim() || motivo.trim().length < 5) {
      message.warning('Ingrese un motivo de anulación válido (mínimo 5 caracteres)');
      return;
    }
    try {
      setAnulando(true);
      await custodiaApi.anularDevolucion(devolucion.id, motivo.trim());
      message.success('Devolución anulada exitosamente. El stock ha retornado a la custodia del personal.');
      setMostrarMotivo(false);
      setMotivo('');
      if (onAnulado) onAnulado();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al anular la devolución');
    } finally {
      setAnulando(false);
    }
  };

  const handleIniciarCorregir = () => {
    if (!devolucion) return;
    Modal.confirm({
      title: '¿Corregir esta devolución?',
      icon: <ExclamationCircleOutlined style={{ color: '#0284c7' }} />,
      content: (
        <div>
          <p>
            Se anulará la devolución <strong>{devolucion.numero}</strong> por motivo de corrección y
            las cantidades volverán inmediatamente a custodia del colaborador.
          </p>
          <p>
            A continuación se abrirá el formulario precargado para que ajuste las cantidades correctas a devolver al almacén.
          </p>
        </div>
      ),
      okText: 'Sí, corregir devolución',
      cancelText: 'Cancelar',
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderColor: '#0284c7',
        },
      },
      onOk: () => {
        if (onCorregir) {
          onCorregir(devolucion);
        }
      },
    });
  };

  const columns: ColumnsType<DevolucionItem> = [
    {
      title: 'Producto',
      key: 'producto',
      render: (_, r) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {r.producto_nombre}
          </Text>
          {r.producto_codigo && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cód: {r.producto_codigo}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Lote / Marca',
      key: 'lote_marca',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{r.numero_lote || 'S/L'}</Tag>
          {r.marca && <Tag color="purple">{r.marca}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Vencimiento',
      dataIndex: 'fecha_vencimiento',
      key: 'fecha_vencimiento',
      width: 115,
      render: (v) => (v ? <Tag color="cyan">{v}</Tag> : <Text type="secondary">-</Text>),
    },
    {
      title: 'Cantidad Devuelta',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 160,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: '#0284c7', fontSize: 14 }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
    {
      title: 'Observación',
      dataIndex: 'observacion',
      key: 'observacion',
      width: 150,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Detalle de Devolución {devolucion ? devolucion.numero : ''}</span>
          {devolucion && (
            <Tag color={devolucion.estado === 'REGISTRADO' ? 'green' : 'red'}>
              {devolucion.estado}
            </Tag>
          )}
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {devolucion && devolucion.estado === 'REGISTRADO' && canAnular && !mostrarMotivo && (
              <Space>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setMostrarMotivo(true)}
                >
                  Anular Devolución
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleIniciarCorregir}
                  style={{
                    borderColor: '#0284c7',
                    color: '#0284c7',
                  }}
                >
                  Corregir Devolución
                </Button>
              </Space>
            )}
          </div>
          <Button onClick={onClose} icon={<CloseOutlined />}>
            Cerrar
          </Button>
        </div>
      }
    >
      <Spin spinning={loading}>
        {devolucion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              labelStyle={{ width: '130px', fontWeight: 600, background: '#f8fafc', color: '#475569' }}
              contentStyle={{ background: '#ffffff', color: '#1e293b' }}
              style={{ borderRadius: 8, overflow: 'hidden' }}
            >
              <Descriptions.Item label="Fecha">
                {devolucion.fecha ? dayjs(devolucion.fecha).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Personal">
                {devolucion.personal_nombres} {devolucion.personal_apellidos}
              </Descriptions.Item>
              <Descriptions.Item label="Almacén Destino">
                <Tag color="blue">{devolucion.almacen_nombre || 'Almacén Central'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Registrado por">
                {devolucion.usuario_registro_nombre || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Observaciones" span={2}>
                {devolucion.observaciones || '-'}
              </Descriptions.Item>
            </Descriptions>

            {devolucion.estado === 'ANULADO' && (
              <Alert
                type="error"
                showIcon
                message="Esta devolución se encuentra ANULADA"
                description={
                  <div>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Motivo:</strong> {devolucion.motivo_anulacion || 'No especificado'}
                    </p>
                    {devolucion.fecha_anulacion && (
                      <p style={{ margin: '4px 0', fontSize: 12, color: '#64748b' }}>
                        Fecha de anulación: {dayjs(devolucion.fecha_anulacion).format('YYYY-MM-DD HH:mm')}
                      </p>
                    )}
                  </div>
                }
              />
            )}

            <div>
              <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 8 }}>
                Ítems Devueltos ({devolucion.items?.length || 0})
              </Text>
              <GlobalTable<DevolucionItem>
                resourceName="devolucion-detalle"
                dataSource={devolucion.items || []}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            {mostrarMotivo && (
              <Card
                size="small"
                title={<span style={{ color: '#ef4444' }}>Confirmar Anulación de Devolución</span>}
                style={{ borderColor: '#fca5a5', background: '#fef2f2' }}
              >
                <p style={{ fontSize: 13, marginBottom: 8 }}>
                  Indique el motivo por el cual anula esta devolución. El stock ingresado al almacén físico será descontado y reincorporado a la custodia del personal:
                </p>
                <TextArea
                  rows={2}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Error al registrar cantidad devuelta, lote incorrecto, etc. (Mín. 5 letras)"
                  maxLength={250}
                  showCount
                  style={{ marginBottom: 12 }}
                />
                <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" onClick={() => setMostrarMotivo(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    danger
                    type="primary"
                    loading={anulando}
                    onClick={handleAnular}
                  >
                    Confirmar y Revertir Stock
                  </Button>
                </Space>
              </Card>
            )}
          </div>
        )}
      </Spin>
    </Modal>
  );
}
