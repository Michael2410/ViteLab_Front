import { useState } from 'react';
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Button,
  Input,
  Progress,
  Space,
  Divider,
  Alert,
  message,
} from 'antd';
import {
  PrinterOutlined,
  InboxOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { ordenesCompraApi } from '../ordenes-compra.api';
import { imprimirOrdenCompraA4 } from '../utils/printOrdenCompraHelper';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import type { OrdenCompra, OrdenCompraItemDetalle } from '../ordenes-compra.types';


interface OrdenCompraDetalleModalProps {
  open: boolean;
  onClose: () => void;
  orden: OrdenCompra | null;
  onRecepcionar: (orden: OrdenCompra) => void;
  onActualizado: () => void;
}

export default function OrdenCompraDetalleModal({
  open,
  onClose,
  orden,
  onRecepcionar,
  onActualizado,
}: OrdenCompraDetalleModalProps) {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canDelete = isSuperAdmin || hasPermission('almacen.ordenes_compra.delete');
  const canReceive = isSuperAdmin || hasPermission('almacen.ingresos.create');

  const { data: configuracion } = useConfiguracion();
  const [anulando, setAnulando] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  if (!orden) return null;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Tag icon={<ClockCircleOutlined />} color="orange">Pendiente de Entrega</Tag>;
      case 'PARCIAL':
        return <Tag icon={<SyncOutlined spin />} color="processing">Recepción Parcial</Tag>;
      case 'RECEPCIONADA':
        return <Tag icon={<CheckCircleOutlined />} color="success">Recepcionada 100%</Tag>;
      case 'ANULADA':
        return <Tag icon={<StopOutlined />} color="error">Anulada</Tag>;
      default:
        return <Tag>{estado}</Tag>;
    }
  };

  const handleAnular = async () => {
    if (!motivo.trim() || motivo.trim().length < 5) {
      message.warning('Ingrese un motivo de anulación detallado (mínimo 5 caracteres)');
      return;
    }
    try {
      setAnulando(true);
      await ordenesCompraApi.anular(orden.id, motivo);
      message.success('Orden de compra anulada exitosamente');
      setModalAnularOpen(false);
      setMotivo('');
      onActualizado();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al anular orden de compra');
    } finally {
      setAnulando(false);
    }
  };

  // Calcular progreso de recepción
  const totalSolicitado = (orden.items || []).reduce((acc, curr) => acc + Number(curr.cantidad_solicitada || 0), 0);
  const totalRecibido = (orden.items || []).reduce((acc, curr) => acc + Number(curr.cantidad_recibida || 0), 0);
  const porcentaje = totalSolicitado > 0 ? Math.min(100, Math.round((totalRecibido / totalSolicitado) * 100)) : 0;

  const monedaSimbolo = orden.moneda === 'USD' ? '$' : 'S/';

  const columnsItems: ColumnsType<OrdenCompraItemDetalle> = [
    {
      title: '#',
      key: 'idx',
      width: 45,
      align: 'center',
      render: (_, __, idx) => idx + 1,
    },
    {
      title: 'Producto',
      key: 'producto',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.producto_nombre || 'Producto'}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.producto_codigo ? `Código: ${r.producto_codigo}` : 'Sin código'} • U.M.: {r.unidad_medida_codigo || 'UND'}
          </div>
          {r.observaciones && (
            <div style={{ fontSize: 11, color: '#0284c7', fontStyle: 'italic', marginTop: 1 }}>
              Nota: {r.observaciones}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Cant. Pedida',
      dataIndex: 'cantidad_solicitada',
      key: 'solicitada',
      align: 'right',
      render: (c) => <span style={{ fontWeight: 600 }}>{Number(c).toFixed(2)}</span>,
    },
    {
      title: 'Cant. Recibida',
      dataIndex: 'cantidad_recibida',
      key: 'recibida',
      align: 'right',
      render: (r, item) => {
        const cant = Number(r || 0);
        const sol = Number(item.cantidad_solicitada);
        const color = cant === 0 ? '#94a3b8' : cant >= sol ? '#059669' : '#0284c7';
        return <span style={{ fontWeight: 700, color }}>{cant.toFixed(2)}</span>;
      },
    },
    {
      title: 'Saldo Pendiente',
      key: 'saldo',
      align: 'right',
      render: (_, item) => {
        const saldo = Math.max(0, Number(item.cantidad_solicitada) - Number(item.cantidad_recibida || 0));
        return (
          <span style={{ fontWeight: 700, color: saldo > 0 ? '#d97706' : '#059669' }}>
            {saldo.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: 'P. Unitario',
      dataIndex: 'precio_unitario',
      key: 'precio',
      align: 'right',
      render: (p) => `${monedaSimbolo} ${Number(p || 0).toFixed(2)}`,
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      align: 'right',
      render: (s) => (
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          {monedaSimbolo} {Number(s || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={1000}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <InboxOutlined />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  Orden de Compra {orden.numero}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Sede: {orden.sede_nombre || 'Principal'} • Registrada el {dayjs(orden.created_at).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            </div>
            <div>{getEstadoBadge(orden.estado)}</div>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              {orden.estado !== 'ANULADA' && canDelete && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setModalAnularOpen(true)}
                  style={{ borderRadius: 8 }}
                >
                  Anular Orden
                </Button>
              )}
            </div>
            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => imprimirOrdenCompraA4(orden, configuracion)}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Imprimir Orden A4
              </Button>
              {(orden.estado === 'PENDIENTE' || orden.estado === 'PARCIAL') && canReceive && (
                <Button
                  type="primary"
                  icon={<InboxOutlined />}
                  onClick={() => {
                    onClose();
                    onRecepcionar(orden);
                  }}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    fontWeight: 600,
                    borderRadius: 8,
                  }}
                >
                  Recepcionar en Almacén
                </Button>
              )}
              <Button onClick={onClose} style={{ borderRadius: 8 }}>
                Cerrar
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginTop: 12 }}>
          {/* Card de Progreso */}
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Avance de Recepción Física:</span>
              <span style={{ fontWeight: 700, color: porcentaje === 100 ? '#059669' : '#0284c7' }}>
                {totalRecibido.toFixed(2)} de {totalSolicitado.toFixed(2)} unidades ({porcentaje}%)
              </span>
            </div>
            <Progress
              percent={porcentaje}
              status={orden.estado === 'RECEPCIONADA' ? 'success' : 'active'}
              strokeColor={porcentaje === 100 ? '#059669' : '#0284c7'}
            />
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Proveedor" span={2}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{orden.proveedor_razon_social || '-'}</div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                RUC: {orden.proveedor_ruc || 'Sin documento'} {orden.proveedor_contacto ? `• Contacto: ${orden.proveedor_contacto}` : ''}
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Moneda y Pago">
              <div style={{ fontWeight: 600 }}>{orden.moneda === 'USD' ? 'Dólares ($)' : 'Soles (S/)'}</div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>{orden.condicion_pago || 'CONTADO'}</div>
            </Descriptions.Item>

            <Descriptions.Item label="Fecha Emisión">
              {dayjs(orden.fecha_emision).format('DD/MM/YYYY')}
            </Descriptions.Item>

            <Descriptions.Item label="Fecha Entrega Esperada">
              {orden.fecha_entrega_esperada ? dayjs(orden.fecha_entrega_esperada).format('DD/MM/YYYY') : 'No especificada'}
            </Descriptions.Item>

            <Descriptions.Item label="Almacén Sugerido">
              {orden.almacen_destino_nombre || 'Almacén Central'}
            </Descriptions.Item>

            {orden.observaciones && (
              <Descriptions.Item label="Observaciones" span={3}>
                <span style={{ color: '#475569' }}>{orden.observaciones}</span>
              </Descriptions.Item>
            )}

            {orden.estado === 'ANULADA' && (
              <Descriptions.Item label="Motivo Anulación" span={3}>
                <Alert
                  type="error"
                  showIcon
                  message={`Anulado por ${orden.usuario_anulacion_nombre || 'Usuario'} el ${dayjs(orden.fecha_anulacion).format('DD/MM/YYYY HH:mm')}`}
                  description={orden.motivo_anulacion}
                />
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider style={{ margin: '18px 0 12px' }} />

          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Ítems de la Orden ({orden.items?.length || 0})
          </div>

          <GlobalTable<OrdenCompraItemDetalle>
            resourceName="oc-items-detalle"
            columns={columnsItems}
            dataSource={orden.items || []}
            rowKey="id"
            pagination={false}
            size="small"
          />

          {/* Resumen de Importes */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <div
              style={{
                width: 260,
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 2 }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{monedaSimbolo} {Number(orden.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 2 }}>
                <span style={{ color: '#64748b' }}>I.G.V. (18%):</span>
                <span style={{ fontWeight: 600 }}>{monedaSimbolo} {Number(orden.igv || 0).toFixed(2)}</span>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5 }}>
                <span style={{ fontWeight: 800, color: '#0284c7' }}>TOTAL:</span>
                <span style={{ fontWeight: 900, color: '#0284c7' }}>{monedaSimbolo} {Number(orden.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Ingresos Relacionados */}
          {orden.ingresos_relacionados && orden.ingresos_relacionados.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Ingresos a Almacén Generados ({orden.ingresos_relacionados.length})
              </div>
              <Table
                dataSource={orden.ingresos_relacionados}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'N° Ingreso', dataIndex: 'numero', key: 'numero', render: (n) => <span style={{ fontWeight: 600, color: '#0284c7' }}>{n}</span> },
                  { title: 'Fecha Ingreso', dataIndex: 'fecha_ingreso', key: 'fecha', render: (f) => dayjs(f).format('DD/MM/YYYY') },
                  { title: 'Comprobante', key: 'comp', render: (_, r) => `${r.tipo_documento} ${r.numero_documento || ''}` },
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    key: 'estado',
                    render: (e) => <Tag color={e === 'REGISTRADO' ? 'success' : 'error'}>{e}</Tag>,
                  },
                ]}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Confirmar Anulación */}
      <Modal
        open={modalAnularOpen}
        onCancel={() => setModalAnularOpen(false)}
        onOk={handleAnular}
        confirmLoading={anulando}
        title="¿Anular Orden de Compra?"
        okText="Confirmar Anulación"
        cancelText="Regresar"
        okButtonProps={{ danger: true, borderRadius: 8 } as any}
      >
        <p style={{ color: '#475569', fontSize: 13 }}>
          Se cancelará la orden de compra <strong>{orden.numero}</strong>. Esta acción no se puede deshacer.
        </p>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            Motivo de Anulación <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <Input.TextArea
            rows={3}
            placeholder="Ingrese el motivo detallado de la cancelación..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
