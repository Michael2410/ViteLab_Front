import { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { ordenesCompraApi } from '../ordenes-compra.api';
import { almacenApi } from '../../shared/almacen.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import type { Producto } from '../../productos/productos.types';
import type { Proveedor } from '../../proveedores/proveedores.types';
import type { Almacen } from '../../maestros/maestros.types';

interface LineaOrdenForm {
  key: string;
  producto_id?: number;
  producto?: Producto;
  cantidad_solicitada: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string;
}

interface OrdenCompraModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrdenCompraModal({ open, onClose, onSuccess }: OrdenCompraModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [lineas, setLineas] = useState<LineaOrdenForm[]>([]);

  useEffect(() => {
    if (!open) return;
    const cargarCatalogos = async () => {
      try {
        const [provs, prods, alms] = await Promise.all([
          almacenApi.get<{ items: Proveedor[] }>('/proveedores', { limit: 200, activo: true }),
          almacenApi.get<{ items: Producto[] }>('/productos', { limit: 500, activo: true }),
          almacenApi.get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true }),
        ]);

        setProveedores(provs.items || []);
        setProductos(prods.items || []);
        setAlmacenes(alms || []);

        form.setFieldsValue({
          fecha_emision: dayjs(),
          moneda: 'PEN',
          condicion_pago: 'CONTADO',
          almacen_destino_id: alms?.[0]?.id,
        });

        // Fila inicial por defecto
        setLineas([
          {
            key: `linea-${Date.now()}`,
            cantidad_solicitada: 1,
            precio_unitario: 0,
            subtotal: 0,
          },
        ]);
      } catch (err) {
        console.error('Error cargando catálogos para Orden de Compra:', err);
      }
    };
    cargarCatalogos();
  }, [open, sedeId, form]);

  const handleAgregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        key: `linea-${Date.now()}-${Math.random()}`,
        cantidad_solicitada: 1,
        precio_unitario: 0,
        subtotal: 0,
      },
    ]);
  };

  const handleEliminarLinea = (key: string) => {
    if (lineas.length <= 1) {
      message.warning('La orden de compra debe contener al menos un producto');
      return;
    }
    setLineas((prev) => prev.filter((l) => l.key !== key));
  };

  const handleActualizarLinea = (key: string, campo: keyof LineaOrdenForm, valor: any) => {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;

        const actualizada = { ...l, [campo]: valor };

        if (campo === 'producto_id') {
          const prod = productos.find((p) => p.id === valor);
          actualizada.producto = prod;
        }

        if (campo === 'cantidad_solicitada' || campo === 'precio_unitario') {
          const cant = campo === 'cantidad_solicitada' ? Number(valor || 0) : l.cantidad_solicitada;
          const precio = campo === 'precio_unitario' ? Number(valor || 0) : l.precio_unitario;
          actualizada.subtotal = Number((cant * precio).toFixed(4));
        }

        return actualizada;
      })
    );
  };

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [lineas]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validar líneas
      const lineasValidas = lineas.filter((l) => l.producto_id && l.cantidad_solicitada > 0);
      if (lineasValidas.length === 0) {
        message.error('Debe seleccionar al menos un producto válido con cantidad mayor a 0');
        return;
      }

      const almDestino = almacenes.find((a) => a.id === values.almacen_destino_id);
      const targetSedeId = sedeId || almDestino?.sede_id || undefined;

      setSaving(true);
      await ordenesCompraApi.crear({
        sede_id: targetSedeId,
        proveedor_id: values.proveedor_id,
        almacen_destino_id: values.almacen_destino_id || null,
        fecha_emision: values.fecha_emision.format('YYYY-MM-DD'),
        fecha_entrega_esperada: values.fecha_entrega_esperada
          ? values.fecha_entrega_esperada.format('YYYY-MM-DD')
          : null,
        moneda: values.moneda || 'PEN',
        condicion_pago: values.condicion_pago || 'CONTADO',
        observaciones: values.observaciones || null,
        items: lineasValidas.map((l) => ({
          producto_id: l.producto_id!,
          cantidad_solicitada: l.cantidad_solicitada,
          precio_unitario: l.precio_unitario || 0,
          observaciones: l.observaciones || null,
        })),
      });

      message.success('Orden de compra generada exitosamente');
      onSuccess();
      handleClose();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Error al generar orden de compra');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setLineas([]);
    onClose();
  };

  const columns: ColumnsType<LineaOrdenForm> = [
    {
      title: 'Producto / Insumo',
      key: 'producto',
      width: 320,
      render: (_, record) => (
        <div>
          <Select
            showSearch
            placeholder="Buscar por código o nombre..."
            style={{ width: '100%' }}
            value={record.producto_id}
            onChange={(val) => handleActualizarLinea(record.key, 'producto_id', val)}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={productos.map((p) => ({
              value: p.id,
              label: `${p.codigo ? `[${p.codigo}] ` : ''}${p.nombre} (${p.unidad_medida_codigo || 'UND'})`,
            }))}
          />
          {record.producto && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              U.M.: {record.producto.unidad_medida_codigo || 'UND'} | Categoría: {record.producto.categoria_nombre || '-'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Cant. Solicitada',
      key: 'cantidad',
      width: 140,
      render: (_, record) => (
        <InputNumber
          min={0.001}
          max={9999999}
          step={1}
          style={{ width: '100%' }}
          value={record.cantidad_solicitada}
          onChange={(val) => handleActualizarLinea(record.key, 'cantidad_solicitada', val || 0)}
        />
      ),
    },
    {
      title: 'P. Unitario',
      key: 'precio',
      width: 130,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          step={0.5}
          style={{ width: '100%' }}
          value={record.precio_unitario}
          onChange={(val) => handleActualizarLinea(record.key, 'precio_unitario', val || 0)}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          {(record.subtotal || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Observación',
      key: 'obs',
      render: (_, record) => (
        <Input
          placeholder="Nota para el proveedor (opcional)..."
          value={record.observaciones}
          onChange={(e) => handleActualizarLinea(record.key, 'observaciones', e.target.value)}
        />
      ),
    },
    {
      title: '',
      key: 'acciones',
      width: 50,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleEliminarLinea(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <ShoppingCartOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Nueva Orden de Compra
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Emisión de orden de compra formal a proveedor con cálculo de montos e impresión
            </div>
          </div>
        </div>
      }
      width={1000}
      okText="Emitir Orden de Compra"
      cancelText="Cancelar"
      okButtonProps={{
        style: {
          backgroundColor: '#0284c7',
          borderColor: '#0284c7',
          fontWeight: 600,
          borderRadius: 8,
        },
      }}
      cancelButtonProps={{ style: { borderRadius: 8 } }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="proveedor_id"
              label={<span style={{ fontWeight: 600 }}>Proveedor</span>}
              rules={[{ required: true, message: 'Seleccione un proveedor' }]}
            >
              <Select
                showSearch
                placeholder="Seleccione proveedor..."
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={proveedores.map((p) => ({
                  value: p.id,
                  label: `${p.ruc ? `[${p.ruc}] ` : ''}${p.razon_social}`,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              name="fecha_emision"
              label={<span style={{ fontWeight: 600 }}>Fecha de Emisión</span>}
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              name="fecha_entrega_esperada"
              label={<span style={{ fontWeight: 600 }}>Fecha Entrega Esperada</span>}
            >
              <DatePicker format="DD/MM/YYYY" placeholder="Opcional..." style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item
              name="moneda"
              label={<span style={{ fontWeight: 600 }}>Moneda</span>}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'PEN', label: 'Soles (S/)' },
                  { value: 'USD', label: 'Dólares ($)' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="condicion_pago"
              label={<span style={{ fontWeight: 600 }}>Condición de Pago</span>}
            >
              <Select
                options={[
                  { value: 'CONTADO', label: 'Contado' },
                  { value: 'CREDITO 15 DIAS', label: 'Crédito 15 días' },
                  { value: 'CREDITO 30 DIAS', label: 'Crédito 30 días' },
                  { value: 'CREDITO 60 DIAS', label: 'Crédito 60 días' },
                  { value: 'CONTRA ENTREGA', label: 'Contra Entrega' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={10}>
            <Form.Item
              name="almacen_destino_id"
              label={<span style={{ fontWeight: 600 }}>Almacén Sugerido de Destino</span>}
            >
              <Select
                placeholder="Seleccione almacén de destino..."
                allowClear
                options={almacenes.map((a) => ({
                  value: a.id,
                  label: `${a.nombre} ${a.es_principal ? '(Principal)' : ''}`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="observaciones"
          label={<span style={{ fontWeight: 600 }}>Observaciones / Términos de Entrega</span>}
        >
          <Input.TextArea
            rows={2}
            placeholder="Instrucciones especiales para el proveedor, lugar de descarga, etc."
          />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0 16px' }} />

      {/* DETALLES DE PRODUCTOS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
          Productos de la Orden de Compra ({lineas.length})
        </span>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAgregarLinea}
          style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
        >
          Agregar Producto
        </Button>
      </div>

      <GlobalTable<LineaOrdenForm>
        resourceName="almacen-oc-items"
        columns={columns}
        dataSource={lineas}
        rowKey="key"
        pagination={false}
        size="small"
      />

      {/* TOTALES */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div
          style={{
            width: 280,
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#64748b' }}>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>{totales.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#64748b' }}>I.G.V. (18%):</span>
            <span style={{ fontWeight: 600 }}>{totales.igv.toFixed(2)}</span>
          </div>
          <Divider style={{ margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
            <span style={{ fontWeight: 800, color: '#0284c7' }}>TOTAL:</span>
            <span style={{ fontWeight: 900, color: '#0284c7' }}>{totales.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
