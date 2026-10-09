import { useState } from 'react';
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Button,
  Input,
  Alert,
  Typography,
  message,
} from 'antd';
import {
  FileTextOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { ingresosApi } from '../ingresos.api';
import type { Ingreso, IngresoItemDetalle } from '../ingresos.types';

const { Text } = Typography;

interface IngresoDetalleModalProps {
  open: boolean;
  onClose: () => void;
  ingreso: Ingreso | null;
  onAnulado: () => void;
}

export default function IngresoDetalleModal({
  open,
  onClose,
  ingreso,
  onAnulado,
}: IngresoDetalleModalProps) {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canDelete = isSuperAdmin || hasPermission('almacen.ingresos.delete');

  const [anulando, setAnulando] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  if (!ingreso) return null;

  const handleAnular = async () => {
    if (!motivo.trim() || motivo.trim().length < 5) {
      message.warning('Ingrese un motivo de anulación válido (mínimo 5 caracteres)');
      return;
    }
    try {
      setAnulando(true);
      await ingresosApi.anular(ingreso.id, motivo);
      message.success('Ingreso anulado y stock revertido exitosamente');
      setModalAnularOpen(false);
      setMotivo('');
      onAnulado();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al anular el ingreso';
      message.error(msg);
    } finally {
      setAnulando(false);
    }
  };

  const columns: ColumnsType<IngresoItemDetalle> = [
    {
      title: 'Producto',
      key: 'prod',
      render: (_, r) => (
        <div>
          <Text strong>{r.producto_nombre || 'Producto'}</Text>
          {r.producto_codigo && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {r.producto_codigo}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Lote / Vencimiento',
      key: 'lote',
      render: (_, r) => (
        <div>
          {r.numero_lote ? <Tag color="blue">{r.numero_lote}</Tag> : <Text type="secondary">Sin lote</Text>}
          {r.marca && <Tag color="purple">{r.marca}</Tag>}
          {r.fecha_vencimiento && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Vence: {r.fecha_vencimiento}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ubicación',
      key: 'ubicacion',
      render: (_, r) => (
        r.ubicacion_codigo ? (
          <Tag color="cyan">
            {r.ubicacion_codigo}{r.ubicacion_nombre ? ` - ${r.ubicacion_nombre}` : ''}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cant',
      align: 'right',
      render: (c, r) => (
        <span style={{ fontWeight: 600 }}>
          {Number(c).toLocaleString()} {r.unidad_medida_codigo || ''}
        </span>
      ),
    },
    {
      title: 'Costo Unit.',
      dataIndex: 'costo_unitario',
      key: 'costo',
      align: 'right',
      render: (v) => `${ingreso.moneda} ${Number(v).toFixed(2)}`,
    },
    {
      title: 'Subtotal',
      key: 'sub',
      align: 'right',
      render: (_, r) => (
        <span style={{ fontWeight: 600 }}>
          {ingreso.moneda} {(Number(r.cantidad) * Number(r.costo_unitario)).toFixed(2)}
        </span>
      ),
    },
  ];

  const totalCalculado = (ingreso.items || []).reduce(
    (acc, it) => acc + Number(it.cantidad) * Number(it.costo_unitario),
    0
  );

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileTextOutlined style={{ color: '#0284c7' }} />
            <span>Ingreso de Almacén: {ingreso.numero}</span>
            <Tag color={ingreso.estado === 'REGISTRADO' ? 'green' : 'red'}>
              {ingreso.estado}
            </Tag>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={780}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {canDelete && ingreso.estado === 'REGISTRADO' && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setModalAnularOpen(true)}
                >
                  Anular Ingreso
                </Button>
              )}
            </div>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ingreso.estado === 'ANULADO' && (
            <Alert
              type="error"
              showIcon
              message="Ingreso Anulado"
              description={
                <div>
                  <div><strong>Motivo:</strong> {ingreso.motivo_anulacion || 'Sin motivo especificado'}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Anulado por: {ingreso.usuario_anulacion_nombre || 'Sistema'} en {ingreso.fecha_anulacion}
                  </div>
                </div>
              }
            />
          )}

          <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Almacén">
              {ingreso.almacen_nombre} ({ingreso.sede_nombre})
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Ingreso">
              {ingreso.fecha_ingreso}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo Doc.">
              <Tag>{ingreso.tipo_documento}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="N° Documento">
              {ingreso.serie_documento ? `${ingreso.serie_documento}-` : ''}
              {ingreso.numero_documento || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Proveedor" span={2}>
              {ingreso.proveedor_razon_social ? (
                <span>
                  {ingreso.proveedor_razon_social}{' '}
                  {ingreso.proveedor_ruc && <Text type="secondary">({ingreso.proveedor_ruc})</Text>}
                </span>
              ) : (
                <Text type="secondary">Sin proveedor (Arrastre / Donación)</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Registrado por">
              {ingreso.usuario_registro_nombre}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Registro" span={2}>
              {ingreso.created_at}
            </Descriptions.Item>
          </Descriptions>

          {ingreso.observaciones && (
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8 }}>
              <Text strong style={{ fontSize: 12 }}>Observaciones:</Text>
              <div style={{ fontSize: 13, color: '#334155' }}>{ingreso.observaciones}</div>
            </div>
          )}

          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>
              Materiales e Insumos Ingresados:
            </div>
            <GlobalTable<IngresoItemDetalle>
              rowKey={(r, i) => `${r.producto_id}-${i}`}
              columns={columns}
              dataSource={ingreso.items || []}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <strong>Total Valorizado:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong style={{ color: '#0369a1' }}>
                      {ingreso.moneda} {totalCalculado.toFixed(2)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL PARA SOLICITAR MOTIVO DE ANULACIÓN */}
      <Modal
        title="Confirmar Anulación de Ingreso"
        open={modalAnularOpen}
        onCancel={() => setModalAnularOpen(false)}
        onOk={handleAnular}
        okText="Confirmar Anulación"
        okButtonProps={{ danger: true, loading: anulando }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Alert
            type="warning"
            message="Esta acción revertirá el stock ingresado"
            description="Si alguno de los lotes ya fue consumido o transferido y no cuenta con suficiente saldo disponible, la anulación será rechazada para evitar saldos negativos."
            showIcon
          />
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
              Motivo de anulación (obligatorio):
            </label>
            <Input.TextArea
              rows={3}
              placeholder="Ej. Factura rechazada por contabilidad / Error en cantidades digitadas..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
