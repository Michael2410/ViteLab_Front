import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Select,
  Button,
  Space,
  Row,
  Col,
  Input,
  InputNumber,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { pedidosApi } from '../pedidos.api';
import { productosApi } from '../../productos/productos.api';
import { personalApi } from '../../../personal/api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { almacenApi } from '../../shared/almacen.api';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import type { Almacen } from '../../maestros/maestros.types';
import type { Producto } from '../../productos/productos.types';
import type { Personal } from '../../../personal/types';

const { Text } = Typography;

interface LineaPedido {
  key: string;
  producto_id?: number;
  producto_nombre?: string;
  unidad_medida?: string;
  cantidad_solicitada: number;
  observacion?: string;
}

interface PedidoDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PedidoDrawer({ open, onClose, onSuccess }: PedidoDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canApprove = isSuperAdmin || hasPermission('almacen.pedidos.approve');

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [personalList, setPersonalList] = useState<Personal[]>([]);
  const [lineas, setLineas] = useState<LineaPedido[]>([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setLineas([]);
      almacenApi
        .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
        .then((data) => {
          setAlmacenes(data || []);
          if (data && data.length > 0) {
            form.setFieldsValue({ almacen_id: data[0].id });
          }
        })
        .catch(console.error);

      productosApi
        .listar({ activo: true, limit: 300 })
        .then((res) => setProductos(res.items || []))
        .catch(console.error);

      if (canApprove) {
        personalApi
          .getAll({ activo: true })
          .then((data) => setPersonalList(data || []))
          .catch(console.error);
      }
    }
  }, [open, sedeId, canApprove, form]);

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        key: `linea_${Date.now()}`,
        cantidad_solicitada: 1,
      },
    ]);
  };

  const eliminarLinea = (key: string) => {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  };

  const handleSelectProducto = (key: string, prodId: number) => {
    const prod = productos.find((p) => p.id === prodId);
    if (!prod) return;

    setLineas((prev) =>
      prev.map((l) => {
        if (l.key === key) {
          return {
            ...l,
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            unidad_medida: prod.unidad_medida_codigo || '',
            cantidad_solicitada: 1,
          };
        }
        return l;
      })
    );
  };

  const handleCantidadChange = (key: string, valor: number | null) => {
    const c = valor || 0;
    setLineas((prev) =>
      prev.map((l) => {
        if (l.key === key) {
          return { ...l, cantidad_solicitada: c };
        }
        return l;
      })
    );
  };

  const handleObservacionChange = (key: string, obs: string) => {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.key === key) {
          return { ...l, observacion: obs };
        }
        return l;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (lineas.length === 0) {
        message.warning('Debe agregar al menos un ítem al pedido');
        return;
      }

      for (const l of lineas) {
        if (!l.producto_id) {
          message.warning('Todos los ítems deben tener un producto seleccionado');
          return;
        }
        if (l.cantidad_solicitada <= 0) {
          message.warning(`La cantidad para ${l.producto_nombre} debe ser mayor a 0`);
          return;
        }
      }

      setSaving(true);
      await pedidosApi.crear({
        almacen_id: values.almacen_id,
        solicitante_personal_id: values.solicitante_personal_id,
        observaciones: values.observaciones?.trim() || undefined,
        items: lineas.map((l) => ({
          producto_id: l.producto_id!,
          cantidad_solicitada: l.cantidad_solicitada,
          observacion: l.observacion?.trim() || undefined,
        })),
      });

      message.success('Pedido registrado exitosamente');
      form.resetFields();
      setLineas([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error registrando pedido');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaPedido> = [
    {
      title: 'Producto / Reactivo',
      key: 'producto_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar producto..."
          value={record.producto_id}
          onChange={(val) => handleSelectProducto(record.key, val)}
          showSearch
          optionFilterProp="label"
          options={productos.map((p) => ({
            value: p.id,
            label: `${p.codigo ? `[${p.codigo}] ` : ''}${p.nombre} (${p.unidad_medida_codigo || ''})`,
          }))}
        />
      ),
    },
    {
      title: 'Cantidad Solicitada',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 150,
      render: (v, record) => (
        <InputNumber
          min={0.01}
          step={1}
          value={v}
          onChange={(val) => handleCantidadChange(record.key, val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Motivo / Detalle',
      key: 'observacion',
      width: 180,
      render: (_, record) => (
        <Input
          placeholder="Para área de..."
          value={record.observacion}
          onChange={(e) => handleObservacionChange(record.key, e.target.value)}
        />
      ),
    },
    {
      title: '',
      key: 'acciones',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => eliminarLinea(record.key)}
        />
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space align="center">
          <span>Nuevo Pedido Interno de Almacén</span>
          <Tag color="gold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Pedidos
          </Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={780}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            Enviar Pedido
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={canApprove ? 12 : 24}>
            <Form.Item
              name="almacen_id"
              label="Almacén de Solicitud"
              rules={[{ required: true, message: 'Seleccione almacén' }]}
            >
              <Select
                placeholder="Seleccione almacén..."
                options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
              />
            </Form.Item>
          </Col>
          {canApprove && (
            <Col xs={24} sm={12}>
              <Form.Item
                name="solicitante_personal_id"
                label="Solicitante (Opcional, si solicita en nombre de otro)"
              >
                <Select
                  placeholder="Por defecto: usted mismo"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={personalList.map((p) => ({
                    value: p.id,
                    label: `${p.nombres} ${p.apellidos}`,
                  }))}
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item name="observaciones" label="Observaciones o Justificación">
          <Input.TextArea rows={2} placeholder="Especifique el requerimiento u orden de trabajo..." />
        </Form.Item>

        <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            Ítems del Pedido
          </Text>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarLinea}>
            Agregar Ítem
          </Button>
        </div>

        <GlobalTable<LineaPedido>
          rowKey="key"
          dataSource={lineas}
          columns={columns}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No hay ítems en el pedido. Haga clic en "Agregar Ítem".' }}
        />
      </Form>
    </Drawer>
  );
}
