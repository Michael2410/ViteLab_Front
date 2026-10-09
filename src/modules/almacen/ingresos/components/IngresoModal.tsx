import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Divider,
  message,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { ingresosApi } from '../ingresos.api';
import { almacenApi } from '../../shared/almacen.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import type { Producto } from '../../productos/productos.types';
import type { Proveedor } from '../../proveedores/proveedores.types';
import type { Almacen, Ubicacion } from '../../maestros/maestros.types';
import type { OrdenCompra } from '../../ordenes-compra/ordenes-compra.types';

interface LineaForm {
  key: string;
  producto_id?: number;
  orden_compra_detalle_id?: number | null;
  producto?: Producto;
  numero_lote?: string;
  marca?: string;
  fecha_vencimiento?: string;
  fecha_fabricacion?: string;
  ubicacion_id?: number;
  cantidad: number;
  costo_unitario: number;
}

interface IngresoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ordenCompra?: OrdenCompra | null;
}

export default function IngresoModal({ open, onClose, onSuccess, ordenCompra }: IngresoModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<number | undefined>(undefined);

  // Cargar catálogos
  useEffect(() => {
    if (!open) return;
    const cargar = async () => {
      try {
        const [alms, provs, prods] = await Promise.all([
          almacenApi.get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true }),
          almacenApi.get<{ items: Proveedor[] }>('/proveedores', { limit: 100, activo: true }),
          almacenApi.get<{ items: Producto[] }>('/productos', { limit: 200, activo: true }),
        ]);

        const listaAlms = alms || [];
        setAlmacenes(listaAlms);
        setProveedores(provs.items || []);
        setProductos(prods.items || []);

        if (ordenCompra) {
          const targetAlmId = ordenCompra.almacen_destino_id || (listaAlms.find((a) => a.es_principal) || listaAlms[0])?.id;
          if (targetAlmId) {
            setAlmacenSeleccionado(targetAlmId);
          }
          form.setFieldsValue({
            almacen_id: targetAlmId,
            proveedor_id: ordenCompra.proveedor_id,
            fecha_ingreso: dayjs(),
            tipo_documento: 'FACTURA',
            moneda: ordenCompra.moneda || 'PEN',
            observaciones: ordenCompra.numero ? `Ingreso correspondiente a Orden de Compra ${ordenCompra.numero}` : undefined,
          });

          // Precargar productos con saldo pendiente
          const lineasPrecargadas: LineaForm[] = (ordenCompra.items || [])
            .map((it, idx) => {
              const saldo = Math.max(0, Number(it.cantidad_solicitada) - Number(it.cantidad_recibida || 0));
              const prod = prods.items?.find((p) => p.id === it.producto_id);
              return {
                key: `linea-oc-${it.id || idx}`,
                producto_id: it.producto_id,
                orden_compra_detalle_id: it.id,
                producto: prod,
                cantidad: saldo > 0 ? saldo : Number(it.cantidad_solicitada),
                costo_unitario: Number(it.precio_unitario || 0),
              };
            })
            .filter((l) => l.cantidad > 0);

          setLineas(lineasPrecargadas.length > 0 ? lineasPrecargadas : [
            { key: '1', cantidad: 1, costo_unitario: 0 }
          ]);
        } else {
          if (listaAlms.length > 0) {
            const defaultAlm = listaAlms.find((a) => a.es_principal) || listaAlms[0];
            setAlmacenSeleccionado(defaultAlm.id);
            form.setFieldsValue({
              almacen_id: defaultAlm.id,
              fecha_ingreso: dayjs(),
              tipo_documento: 'FACTURA',
              moneda: 'PEN',
            });
          }
          setLineas([{ key: '1', cantidad: 1, costo_unitario: 0 }]);
        }
      } catch (err) {
        console.error('Error cargando catálogos de ingreso:', err);
      }
    };
    cargar();
  }, [open, sedeId, ordenCompra, form]);

  // Cargar ubicaciones cuando cambia el almacén seleccionado
  useEffect(() => {
    if (!almacenSeleccionado) {
      setUbicaciones([]);
      return;
    }
    almacenApi
      .get<Ubicacion[]>('/maestros/ubicaciones', { almacen_id: almacenSeleccionado, activo: true })
      .then((data) => setUbicaciones(data || []))
      .catch((err) => console.error(err));
  }, [almacenSeleccionado]);

  const agregarFila = () => {
    setLineas([
      ...lineas,
      {
        key: `linea-${Date.now()}-${Math.random()}`,
        cantidad: 1,
        costo_unitario: 0,
      },
    ]);
  };

  const eliminarFila = (key: string) => {
    setLineas(lineas.filter((l) => l.key !== key));
  };

  const actualizarFila = (key: string, patch: Partial<LineaForm>) => {
    setLineas(
      lineas.map((l) => {
        if (l.key !== key) return l;
        const updated = { ...l, ...patch };
        if (patch.producto_id) {
          const prod = productos.find((p) => p.id === patch.producto_id);
          updated.producto = prod;
        }
        return updated;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (lineas.length === 0) {
        message.warning('Debe agregar al menos un producto a la lista de ingreso');
        return;
      }

      // Validar cada línea
      for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i];
        if (!l.producto_id) {
          message.warning(`La fila ${i + 1} no tiene un producto seleccionado`);
          return;
        }
        if (!l.cantidad || l.cantidad <= 0) {
          message.warning(`La fila ${i + 1} debe tener una cantidad mayor a 0`);
          return;
        }
        if (l.producto?.controla_lote && !l.numero_lote?.trim()) {
          message.warning(`El producto "${l.producto.nombre}" en fila ${i + 1} exige número de lote`);
          return;
        }
        if (l.producto?.controla_vencimiento && !l.fecha_vencimiento) {
          message.warning(`El producto "${l.producto.nombre}" en fila ${i + 1} exige fecha de vencimiento`);
          return;
        }
      }

      setSaving(true);

      const payload: any = {
        almacen_id: values.almacen_id,
        proveedor_id: values.proveedor_id || null,
        orden_compra_id: ordenCompra?.id || null,
        tipo_documento: values.tipo_documento,
        serie_documento: values.serie_documento || null,
        numero_documento: values.numero_documento || null,
        fecha_documento: values.fecha_documento ? values.fecha_documento.format('YYYY-MM-DD') : null,
        fecha_ingreso: values.fecha_ingreso.format('YYYY-MM-DD'),
        moneda: values.moneda || 'PEN',
        observaciones: values.observaciones || null,
        items: lineas.map((l) => ({
          producto_id: l.producto_id!,
          orden_compra_detalle_id: l.orden_compra_detalle_id || null,
          numero_lote: l.numero_lote || null,
          marca: l.marca || null,
          fecha_vencimiento: l.fecha_vencimiento || null,
          fecha_fabricacion: l.fecha_fabricacion || null,
          ubicacion_id: l.ubicacion_id || null,
          cantidad: Number(l.cantidad),
          costo_unitario: Number(l.costo_unitario || 0),
        })),
      };

      await ingresosApi.crear(payload);
      message.success('Ingreso registrado y stock actualizado exitosamente');
      form.resetFields();
      setLineas([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al registrar el ingreso';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaForm> = [
    {
      title: 'Producto *',
      key: 'producto',
      width: 260,
      render: (_, r) => (
        <Select
          placeholder="Seleccionar producto..."
          showSearch
          style={{ width: '100%' }}
          optionFilterProp="label"
          value={r.producto_id}
          onChange={(val) => actualizarFila(r.key, { producto_id: val })}
          options={productos.map((p) => ({
            value: p.id,
            label: `${p.nombre} ${p.codigo ? `(${p.codigo})` : ''}`,
          }))}
        />
      ),
    },
    {
      title: 'Lote / Serie',
      key: 'lote',
      width: 150,
      render: (_, r) => (
        <Input
          placeholder={r.producto?.controla_lote ? 'Obligatorio' : 'Opcional'}
          value={r.numero_lote}
          style={{ textTransform: 'uppercase' }}
          onChange={(e) => actualizarFila(r.key, { numero_lote: e.target.value.toUpperCase() })}
          status={r.producto?.controla_lote && !r.numero_lote ? 'warning' : ''}
        />
      ),
    },
    {
      title: 'Marca',
      key: 'marca',
      width: 140,
      render: (_, r) => (
        <Input
          placeholder="Ej. Roche, BD..."
          value={r.marca}
          style={{ textTransform: 'uppercase' }}
          onChange={(e) => actualizarFila(r.key, { marca: e.target.value.toUpperCase() })}
        />
      ),
    },
    {
      title: 'Vencimiento',
      key: 'venc',
      width: 140,
      render: (_, r) => (
        <DatePicker
          placeholder="YYYY-MM-DD"
          style={{ width: '100%' }}
          value={r.fecha_vencimiento ? dayjs(r.fecha_vencimiento) : null}
          onChange={(date) =>
            actualizarFila(r.key, { fecha_vencimiento: date ? date.format('YYYY-MM-DD') : undefined })
          }
          status={r.producto?.controla_vencimiento && !r.fecha_vencimiento ? 'warning' : ''}
        />
      ),
    },
    {
      title: 'Ubicación',
      key: 'ubic',
      width: 150,
      render: (_, r) => (
        <Select
          placeholder="Estante/Nivel..."
          allowClear
          style={{ width: '100%' }}
          value={r.ubicacion_id}
          onChange={(val) => actualizarFila(r.key, { ubicacion_id: val })}
          options={ubicaciones.map((u) => ({ value: u.id, label: `${u.codigo} - ${u.nombre}` }))}
        />
      ),
    },
    {
      title: 'Cant. *',
      key: 'cant',
      width: 100,
      render: (_, r) => (
        <InputNumber
          min={0.001}
          style={{ width: '100%' }}
          value={r.cantidad}
          onChange={(val) => actualizarFila(r.key, { cantidad: val || 0 })}
        />
      ),
    },
    {
      title: 'Costo Unit.',
      key: 'costo',
      width: 110,
      render: (_, r) => (
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={r.costo_unitario}
          onChange={(val) => actualizarFila(r.key, { costo_unitario: val || 0 })}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'sub',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <span style={{ fontWeight: 600 }}>
          {(Number(r.cantidad || 0) * Number(r.costo_unitario || 0)).toFixed(2)}
        </span>
      ),
    },
    {
      title: '',
      key: 'del',
      width: 48,
      align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => eliminarFila(r.key)}
        />
      ),
    },
  ];

  const totalCalculado = lineas.reduce(
    (acc, l) => acc + Number(l.cantidad || 0) * Number(l.costo_unitario || 0),
    0
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
          <span>Registrar Ingreso a Almacén</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1150}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, color: '#64748b' }}>Total del Ingreso: </span>
            <strong style={{ fontSize: 16, color: '#0369a1' }}>
              {form.getFieldValue('moneda') || 'PEN'} {totalCalculado.toFixed(2)}
            </strong>
          </div>
          <Space>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving}>
              Guardar e Ingresar Stock
            </Button>
          </Space>
        </div>
      }
    >
      {ordenCompra && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={
            <span>
              Recepcionando mercadería de la <strong>Orden de Compra {ordenCompra.numero}</strong>. Los productos y saldos pendientes han sido precargados. Puede ajustar las cantidades si la entrega es parcial y completar almacén destino, serie/número, lote, marca, vencimiento y ubicación.
            </span>
          }
        />
      )}

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="almacen_id"
              label="Almacén Destino"
              rules={[{ required: true, message: 'Seleccione almacén' }]}
            >
              <Select
                placeholder="Seleccione almacén..."
                onChange={(val) => setAlmacenSeleccionado(val)}
                options={almacenes.map((a) => ({
                  value: a.id,
                  label: `${a.nombre} (${a.sede_nombre || 'Sede'})`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="proveedor_id" label="Proveedor">
              <Select
                placeholder="Seleccione proveedor (opcional para inventario inicial)"
                showSearch
                allowClear
                disabled={Boolean(ordenCompra)}
                optionFilterProp="label"
                options={proveedores.map((p) => ({
                  value: p.id,
                  label: `${p.razon_social} ${p.ruc ? `(${p.ruc})` : ''}`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="fecha_ingreso"
              label="Fecha de Ingreso"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="tipo_documento"
              label="Tipo Documento"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'FACTURA', label: 'Factura' },
                  { value: 'BOLETA', label: 'Boleta' },
                  { value: 'GUIA_REMISION', label: 'Guía de Remisión' },
                  { value: 'DONACION', label: 'Donación' },
                  { value: 'INVENTARIO_INICIAL', label: 'Inventario Inicial' },
                  { value: 'OTRO', label: 'Otro' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="serie_documento" label="Serie">
              <Input placeholder="Ej. F001" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="numero_documento" label="Número">
              <Input placeholder="Ej. 00012345" maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="fecha_documento" label="Fecha Emisión Doc.">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="moneda" label="Moneda">
              <Select
                options={[
                  { value: 'PEN', label: 'PEN (S/)' },
                  { value: 'USD', label: 'USD ($)' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="observaciones" label="Observaciones">
          <Input placeholder="Comentarios sobre el estado del paquete, entrega, etc." maxLength={500} />
        </Form.Item>

        <Divider style={{ margin: '12px 0 16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
            Detalle de Insumos y Reactivos
          </span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarFila}>
            Agregar Producto
          </Button>
        </div>

        <GlobalTable<LineaForm>
          rowKey="key"
          columns={columns}
          dataSource={lineas}
          pagination={false}
          size="small"
          locale={{ emptyText: 'Haga clic en "Agregar Producto" para añadir materiales al ingreso' }}
        />
      </Form>
    </Modal>
  );
}
