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
  Radio,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { ajustesApi } from '../ajustes.api';
import { stockApi } from '../../stock/stock.api';
import { almacenApi } from '../../shared/almacen.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import type { Almacen } from '../../maestros/maestros.types';
import type { StockItem } from '../../stock/stock.types';

const { Text } = Typography;

interface LineaAjuste {
  key: string;
  producto_id?: number;
  lote_id?: number;
  producto_nombre?: string;
  numero_lote?: string;
  marca?: string | null;
  unidad_medida?: string;
  stock_disponible: number;
  sentido: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  costo_unitario?: number;
  observacion?: string;
}

interface AjusteDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AjusteDrawer({ open, onClose, onSuccess }: AjusteDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [stockLotes, setStockLotes] = useState<StockItem[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lineas, setLineas] = useState<LineaAjuste[]>([]);

  const tipo = Form.useWatch('tipo', form);

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

      form.setFieldsValue({ tipo: 'CONTEO_FISICO' });
      setLineas([]);
    }
  }, [open, sedeId, form]);

  const cargarStockDeAlmacen = async (almId: number) => {
    try {
      setLoadingLotes(true);
      const res = await stockApi.listarStock({
        almacen_id: almId,
        desglosar_lote: true,
        limit: 300,
      });
      setStockLotes(res.items || []);
    } catch (err) {
      console.error(err);
      message.error('Error cargando lotes del almacén');
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
        sentido: tipo === 'BAJA' || tipo === 'MERMA' ? 'SALIDA' : 'SALIDA',
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
            stock_disponible: lote.cantidad,
            cantidad: 1,
          };
        }
        return l;
      })
    );
  };

  const handleSentidoChange = (key: string, sentido: 'ENTRADA' | 'SALIDA') => {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, sentido } : l))
    );
  };

  const handleCantidadChange = (key: string, valor: number | null) => {
    const c = valor || 0;
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, cantidad: c } : l))
    );
  };

  const handleObservacionChange = (key: string, obs: string) => {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, observacion: obs } : l))
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (lineas.length === 0) {
        message.warning('Debe agregar al menos un ítem al ajuste');
        return;
      }

      for (const l of lineas) {
        if (!l.lote_id || !l.producto_id) {
          message.warning('Todos los ítems deben tener un lote seleccionado');
          return;
        }
        if (l.cantidad <= 0) {
          message.warning(`La cantidad para ${l.producto_nombre} debe ser mayor a 0`);
          return;
        }
        if (l.sentido === 'SALIDA' && l.cantidad > l.stock_disponible) {
          message.error(
            `La salida para ${l.producto_nombre} (${l.cantidad}) supera el stock actual disponible (${l.stock_disponible})`
          );
          return;
        }
      }

      setSaving(true);
      await ajustesApi.crear({
        almacen_id: values.almacen_id,
        tipo: values.tipo,
        motivo: values.motivo,
        observaciones: values.observaciones,
        items: lineas.map((l) => ({
          producto_id: l.producto_id!,
          lote_id: l.lote_id!,
          cantidad: l.cantidad,
          sentido: l.sentido,
          costo_unitario: l.costo_unitario || 0,
          observacion: l.observacion,
        })),
      });

      message.success('Ajuste registrado en estado PENDIENTE para aprobación (principio de 4 ojos)');
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error registrando ajuste');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaAjuste> = [
    {
      title: 'Producto y Lote',
      key: 'lote_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar lote..."
          loading={loadingLotes}
          value={record.lote_id}
          onChange={(val) => handleSelectLote(record.key, val)}
          showSearch
          optionFilterProp="label"
          options={stockLotes.map((s) => ({
            value: s.lote_id,
            label: `${s.producto_nombre} | Marca: ${s.marca || 'Sin marca'} | Lote: ${s.numero_lote || 'S/L'} | Stock: ${s.cantidad} ${s.unidad_medida_codigo || ''}`,
          }))}
        />
      ),
    },
    {
      title: 'Sentido',
      dataIndex: 'sentido',
      key: 'sentido',
      width: 170,
      render: (val, record) => (
        <Radio.Group
          value={val}
          size="small"
          onChange={(e) => handleSentidoChange(record.key, e.target.value)}
        >
          <Radio.Button value="SALIDA">Salida (-)</Radio.Button>
          <Radio.Button value="ENTRADA">Entrada (+)</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      title: 'Stock Actual',
      dataIndex: 'stock_disponible',
      key: 'stock_disponible',
      width: 100,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: '#0284c7' }}>
          {v} {r.unidad_medida}
        </Text>
      ),
    },
    {
      title: 'Cantidad Ajuste',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 130,
      render: (v, record) => (
        <InputNumber
          min={0.01}
          max={record.sentido === 'SALIDA' ? record.stock_disponible : 99999}
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
      width: 150,
      render: (_, record) => (
        <Input
          placeholder="Detalle..."
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
          <span>Nuevo Ajuste / Baja de Inventario</span>
          <Tag color="gold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Control Físico
          </Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={840}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            Registrar Ajuste
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="almacen_id"
              label="Almacén"
              rules={[{ required: true, message: 'Seleccione almacén' }]}
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
              name="tipo"
              label="Tipo de Operación"
              rules={[{ required: true, message: 'Seleccione tipo' }]}
            >
              <Select
                options={[
                  { value: 'CONTEO_FISICO', label: 'Conteo Físico (Inventario)' },
                  { value: 'BAJA', label: 'Baja de Mercadería' },
                  { value: 'MERMA', label: 'Merma / Pérdida' },
                  { value: 'REGULARIZACION', label: 'Regularización / Corrección' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="motivo" label="Causa / Motivo Específico">
              <Select
                placeholder="Seleccione causa..."
                allowClear
                options={[
                  { value: 'VENCIMIENTO', label: 'Producto Vencido / Caducado' },
                  { value: 'DETERIORO', label: 'Deterioro / Daño Físico' },
                  { value: 'RUPTURA_CADENA_FRIO', label: 'Ruptura Cadena de Frío' },
                  { value: 'CONTAMINACION', label: 'Contaminación de Reactivo' },
                  { value: 'SOBRANTE', label: 'Sobrante Físico (Sobra en almacén)' },
                  { value: 'FALTANTE', label: 'Faltante Físico (Falta en almacén)' },
                  { value: 'OTRO', label: 'Otro' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="observaciones" label="Observaciones o Acta">
              <Input.TextArea rows={1} placeholder="Referencia de auditoría o acta de baja..." />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            Ítems del Ajuste (Quedan pendientes de aprobación por otra persona)
          </Text>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarLinea}>
            Agregar Ítem
          </Button>
        </div>

        <GlobalTable<LineaAjuste>
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
