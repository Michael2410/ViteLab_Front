import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { productosApi } from '../productos.api';
import { almacenApi } from '../../shared/almacen.api';
import type { Producto, ProductoFormValues } from '../productos.types';

interface OptionItem {
  id: number;
  nombre: string;
  codigo?: string;
}

interface ProductoDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto?: Producto | null;
}

export default function ProductoDrawer({
  open,
  onClose,
  onSuccess,
  producto,
}: ProductoDrawerProps) {
  const [form] = Form.useForm<ProductoFormValues>();
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<OptionItem[]>([]);
  const [unidades, setUnidades] = useState<OptionItem[]>([]);
  const [requiereFrio, setRequiereFrio] = useState(false);

  // Cargar catálogos auxiliares
  useEffect(() => {
    if (!open) return;
    const cargarCatalogos = async () => {
      try {
        const [cats, unis] = await Promise.all([
          almacenApi.get<OptionItem[]>('/maestros/categorias'),
          almacenApi.get<OptionItem[]>('/maestros/unidades-medida'),
        ]);
        setCategorias(cats || []);
        setUnidades(unis || []);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    cargarCatalogos();
  }, [open]);

  // Poblar formulario en edición o resetear en creación
  useEffect(() => {
    if (!open) return;
    if (producto) {
      setRequiereFrio(producto.requiere_cadena_frio);
      form.setFieldsValue({
        codigo: producto.codigo || undefined,
        nombre: producto.nombre,
        descripcion: producto.descripcion || undefined,
        categoria_id: producto.categoria_id || undefined,
        unidad_medida_id: producto.unidad_medida_id,
        stock_minimo: producto.stock_minimo,
        controla_lote: producto.controla_lote,
        controla_vencimiento: producto.controla_vencimiento,
        requiere_cadena_frio: producto.requiere_cadena_frio,
        temp_min: producto.temp_min ?? undefined,
        temp_max: producto.temp_max ?? undefined,
        dias_alerta_vencimiento: producto.dias_alerta_vencimiento,
        activo: producto.activo,
      });
    } else {
      setRequiereFrio(false);
      form.resetFields();
      form.setFieldsValue({
        stock_minimo: 0,
        controla_lote: false,
        controla_vencimiento: false,
        requiere_cadena_frio: false,
        dias_alerta_vencimiento: 30,
        activo: true,
      });
    }
  }, [open, producto, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (producto) {
        await productosApi.actualizar(producto.id, values);
        message.success('Producto actualizado exitosamente');
      } else {
        await productosApi.crear(values);
        message.success('Producto registrado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar el producto';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      placement="right"
      width={580}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        header: {
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        },
        body: {
          padding: '20px 24px',
          background: '#f8fafc',
          overflowY: 'auto',
        },
        footer: {
          padding: '12px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            <AppstoreOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {producto ? `Editar Producto: ${producto.nombre}` : 'Nuevo Producto'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {producto ? `Código: ${producto.codigo || 'S/C'}` : 'Ficha de catálogo de reactivos e insumos'}
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Cancelar
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            style={{
              backgroundColor: '#d97706',
              borderColor: '#d97706',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
              color: '#ffffff',
            }}
          >
            {producto ? 'Guardar Cambios' : 'Registrar Producto'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="nombre"
              label="Nombre del Producto"
              rules={[{ required: true, message: 'Ingrese el nombre' }]}
            >
              <Input placeholder="Ej. Tubo EDTA K2 4ml" maxLength={200} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="codigo" label="Código">
              <Input placeholder="Ej. TUB-EDTA-4" maxLength={50} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="unidad_medida_id"
              label="Unidad de Medida"
              rules={[{ required: true, message: 'Seleccione la unidad de medida' }]}
            >
              <Select
                placeholder="Seleccione..."
                options={unidades.map((u) => ({
                  value: u.id,
                  label: `${u.nombre} (${u.codigo})`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="categoria_id" label="Categoría">
              <Select
                placeholder="Seleccione categoría..."
                allowClear
                options={categorias.map((c) => ({
                  value: c.id,
                  label: c.nombre,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="descripcion" label="Descripción / Especificaciones">
          <Input.TextArea rows={2} placeholder="Descripción opcional..." maxLength={500} />
        </Form.Item>

        <Divider style={{ margin: '12px 0 16px' }}>Control de Inventario y Almacenamiento</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="stock_minimo" label="Stock Mínimo de Alerta">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dias_alerta_vencimiento" label="Días Previos Alerta Vencimiento">
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="controla_lote" label="¿Controla Número de Lote?" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="controla_vencimiento"
              label="¿Controla Fecha de Vencimiento?"
              valuePropName="checked"
            >
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="requiere_cadena_frio"
              label="¿Requiere Cadena de Frío?"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Sí"
                unCheckedChildren="No"
                onChange={(checked) => setRequiereFrio(checked)}
              />
            </Form.Item>
          </Col>
        </Row>

        {requiereFrio && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temp_min" label="Temperatura Mínima (°C)">
                <InputNumber style={{ width: '100%' }} placeholder="Ej. 2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="temp_max" label="Temperatura Máxima (°C)">
                <InputNumber style={{ width: '100%' }} placeholder="Ej. 8" />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Drawer>
  );
}
