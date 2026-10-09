import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Select,
  DatePicker,
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
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { despachosApi } from '../despachos.api';
import { stockApi } from '../../stock/stock.api';
import { personalApi } from '../../../personal/api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { almacenApi } from '../../shared/almacen.api';
import type { Almacen } from '../../maestros/maestros.types';
import type { StockItem } from '../../stock/stock.types';
import type { Personal } from '../../../personal/types';

const { Text } = Typography;

interface LineaDespacho {
  key: string;
  producto_id?: number;
  lote_id?: number;
  producto_nombre?: string;
  numero_lote?: string;
  marca?: string | null;
  stock_disponible: number;
  unidad_medida?: string;
  fecha_vencimiento?: string | null;
  cantidad: number;
}

interface DespachoDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DespachoDrawer({ open, onClose, onSuccess }: DespachoDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [personalList, setPersonalList] = useState<Personal[]>([]);
  const [stockLotes, setStockLotes] = useState<StockItem[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lineas, setLineas] = useState<LineaDespacho[]>([]);

  // Cargar almacenes y personal
  useEffect(() => {
    if (open) {
      almacenApi
        .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
        .then((data) => {
          setAlmacenes(data || []);
          if (data && data.length > 0) {
            form.setFieldsValue({ almacen_id: data[0].id });
            cargarStockDeAlmacen(data[0].id);
          }
        })
        .catch(console.error);

      personalApi
        .getAll({ activo: true })
        .then((data) => setPersonalList(data || []))
        .catch(console.error);

      form.setFieldsValue({ fecha: dayjs() });
      setLineas([]);
    }
  }, [open, sedeId, form]);

  const cargarStockDeAlmacen = async (almId: number) => {
    try {
      setLoadingLotes(true);
      const res = await stockApi.listarStock({
        almacen_id: almId,
        desglosar_lote: true,
        con_saldo: true,
        limit: 200,
      });
      // Filtrar solo los que tienen stock > 0
      const disponibles = (res.items || []).filter((s) => s.cantidad > 0);
      setStockLotes(disponibles);
    } catch (err) {
      console.error(err);
      message.error('Error cargando stock del almacén');
    } finally {
      setLoadingLotes(false);
    }
  };

  const handleAlmacenChange = (almId: number) => {
    cargarStockDeAlmacen(almId);
    setLineas([]);
  };

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        key: `linea_${Date.now()}`,
        stock_disponible: 0,
        cantidad: 1,
      },
    ]);
  };

  const eliminarLinea = (key: string) => {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  };

  const handleSelectLote = (key: string, loteId: number) => {
    const lote = stockLotes.find((l) => l.lote_id === loteId);
    if (!lote) return;

    setLineas((prev) =>
      prev.map((l) => {
        if (l.key === key) {
          return {
            ...l,
            producto_id: lote.producto_id,
            lote_id: lote.lote_id,
            producto_nombre: lote.producto_nombre,
            numero_lote: lote.numero_lote || 'Sin lote',
            marca: lote.marca || null,
            unidad_medida: lote.unidad_medida_codigo || '',
            fecha_vencimiento: lote.fecha_vencimiento,
            stock_disponible: lote.cantidad,
            cantidad: 1,
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
          return { ...l, cantidad: c };
        }
        return l;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (lineas.length === 0) {
        message.warning('Debe agregar al menos un ítem para despachar');
        return;
      }

      for (const l of lineas) {
        if (!l.lote_id || !l.producto_id) {
          message.warning('Todos los ítems deben tener un producto y lote seleccionado');
          return;
        }
        if (l.cantidad <= 0) {
          message.warning(`La cantidad para ${l.producto_nombre} debe ser mayor a 0`);
          return;
        }
        if (l.cantidad > l.stock_disponible) {
          message.error(
            `La cantidad asignada para ${l.producto_nombre} (${l.cantidad}) supera el stock disponible (${l.stock_disponible})`
          );
          return;
        }
      }

      setSaving(true);
      await despachosApi.crear({
        almacen_id: values.almacen_id,
        receptor_personal_id: values.receptor_personal_id,
        fecha: values.fecha?.format('YYYY-MM-DD'),
        observaciones: values.observaciones,
        items: lineas.map((l) => ({
          producto_id: l.producto_id!,
          lote_id: l.lote_id!,
          cantidad: l.cantidad,
        })),
      });

      message.success('Despacho y asignación registrados exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error registrando el despacho';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaDespacho> = [
    {
      title: 'Producto y Lote',
      dataIndex: 'lote_id',
      key: 'lote_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar ítem en stock..."
          loading={loadingLotes}
          value={record.lote_id}
          onChange={(val) => handleSelectLote(record.key, val)}
          showSearch
          optionFilterProp="label"
          options={stockLotes.map((s) => ({
            value: s.lote_id,
            label: `${s.producto_nombre} | Marca: ${s.marca || 'Sin marca'} | Lote: ${s.numero_lote || 'S/L'} | Disp: ${s.cantidad} ${s.unidad_medida_codigo || ''}`,
          }))}
        />
      ),
    },
    {
      title: 'Vencimiento',
      key: 'vencimiento',
      width: 120,
      render: (_, record) =>
        record.fecha_vencimiento ? (
          <Tag color="cyan">{record.fecha_vencimiento}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Stock Disp.',
      dataIndex: 'stock_disponible',
      key: 'stock_disponible',
      width: 100,
      align: 'right',
      render: (val, r) => (
        <Text strong style={{ color: '#0284c7' }}>
          {val} {r.unidad_medida}
        </Text>
      ),
    },
    {
      title: 'Cantidad a Asignar',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 140,
      render: (val, record) => (
        <InputNumber
          min={0.01}
          max={record.stock_disponible || 999999}
          step={1}
          value={val}
          onChange={(v) => handleCantidadChange(record.key, v)}
          style={{ width: '100%' }}
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
          <span>Nuevo Despacho & Asignación al Personal</span>
          <Tag color="gold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Almacén
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
            Registrar Despacho
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="almacen_id"
              label="Almacén de Origen"
              rules={[{ required: true, message: 'Seleccione el almacén de origen' }]}
            >
              <Select
                placeholder="Seleccione almacén..."
                onChange={handleAlmacenChange}
                options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="receptor_personal_id"
              label="Trabajador / Personal Receptor"
              rules={[{ required: true, message: 'Seleccione al colaborador receptor' }]}
            >
              <Select
                placeholder="Buscar por nombre o DNI..."
                showSearch
                optionFilterProp="label"
                options={personalList.map((p) => ({
                  value: p.id,
                  label: `${p.nombres} ${p.apellidos} (${p.numero_documento || 'Sin doc'}) - ${p.cargo || 'Personal'}`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fecha"
              label="Fecha de Despacho"
              rules={[{ required: true, message: 'Seleccione la fecha' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="observaciones" label="Observaciones">
              <Input.TextArea rows={1} placeholder="Motivo o referencia del despacho..." />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            Ítems a Despachar (Salen de Almacén → Entran en Custodia del Trabajador)
          </Text>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarLinea}>
            Agregar Ítem
          </Button>
        </div>

        <GlobalTable<LineaDespacho>
          rowKey="key"
          dataSource={lineas}
          columns={columns}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No hay ítems agregados. Haga clic en "Agregar Ítem".' }}
        />
      </Form>
    </Drawer>
  );
}
