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
import GlobalTable from '../../../../shared/components/GlobalTable';
import { transferenciasApi } from '../transferencias.api';
import { stockApi } from '../../stock/stock.api';
import { almacenApi } from '../../shared/almacen.api';
import type { Almacen } from '../../maestros/maestros.types';
import type { StockItem } from '../../stock/stock.types';

const { Text } = Typography;

interface LineaEnvio {
  key: string;
  producto_id?: number;
  lote_id?: number;
  producto_nombre?: string;
  numero_lote?: string;
  unidad_medida?: string;
  stock_disponible: number;
  cantidad_enviada: number;
}

interface TransferenciaDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferenciaDrawer({
  open,
  onClose,
  onSuccess,
}: TransferenciaDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [stockLotes, setStockLotes] = useState<StockItem[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lineas, setLineas] = useState<LineaEnvio[]>([]);

  const origenId = Form.useWatch('almacen_origen_id', form);

  useEffect(() => {
    if (open) {
      almacenApi
        .get<Almacen[]>('/maestros/almacenes', { activo: true })
        .then((data) => {
          setAlmacenes(data || []);
          if (data && data.length > 0) {
            form.setFieldsValue({ almacen_origen_id: data[0].id });
            cargarStockDeAlmacen(data[0].id);
          }
        })
        .catch(console.error);

      setLineas([]);
    }
  }, [open, form]);

  const cargarStockDeAlmacen = async (almId: number) => {
    try {
      setLoadingLotes(true);
      const res = await stockApi.listarStock({
        almacen_id: almId,
        desglosar_lote: true,
        con_saldo: true,
        limit: 200,
      });
      const disponibles = (res.items || []).filter((s) => s.cantidad > 0);
      setStockLotes(disponibles);
    } catch (err) {
      console.error(err);
      message.error('Error cargando stock del almacén');
    } finally {
      setLoadingLotes(false);
    }
  };

  const handleOrigenChange = (almId: number) => {
    cargarStockDeAlmacen(almId);
    setLineas([]);
    // Si destino era igual a origen, resetearlo
    if (form.getFieldValue('almacen_destino_id') === almId) {
      form.setFieldsValue({ almacen_destino_id: undefined });
    }
  };

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        key: `linea_${Date.now()}`,
        stock_disponible: 0,
        cantidad_enviada: 1,
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
            unidad_medida: lote.unidad_medida_codigo || '',
            stock_disponible: lote.cantidad,
            cantidad_enviada: 1,
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
          return { ...l, cantidad_enviada: c };
        }
        return l;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (lineas.length === 0) {
        message.warning('Debe agregar al menos un ítem para transferir');
        return;
      }

      for (const l of lineas) {
        if (!l.lote_id || !l.producto_id) {
          message.warning('Todos los ítems deben tener un lote seleccionado');
          return;
        }
        if (l.cantidad_enviada <= 0) {
          message.warning(`La cantidad enviada para ${l.producto_nombre} debe ser mayor a 0`);
          return;
        }
        if (l.cantidad_enviada > l.stock_disponible) {
          message.error(
            `La cantidad para ${l.producto_nombre} (${l.cantidad_enviada}) supera el stock disponible (${l.stock_disponible})`
          );
          return;
        }
      }

      setSaving(true);
      await transferenciasApi.crear({
        almacen_origen_id: values.almacen_origen_id,
        almacen_destino_id: values.almacen_destino_id,
        observaciones: values.observaciones,
        items: lineas.map((l) => ({
          producto_id: l.producto_id!,
          lote_id: l.lote_id!,
          cantidad_enviada: l.cantidad_enviada,
        })),
      });

      message.success('Transferencia enviada en tránsito');
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error enviando transferencia');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaEnvio> = [
    {
      title: 'Producto y Lote en Origen',
      key: 'lote_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar lote disponible..."
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
      title: 'Stock Disp.',
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
      title: 'Cantidad a Enviar',
      dataIndex: 'cantidad_enviada',
      key: 'cantidad_enviada',
      width: 140,
      render: (v, record) => (
        <InputNumber
          min={0.01}
          max={record.stock_disponible || 99999}
          step={1}
          value={v}
          onChange={(val) => handleCantidadChange(record.key, val)}
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
          <span>Nueva Transferencia entre Almacenes</span>
          <Tag color="gold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            En Tránsito
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
            Enviar Transferencia
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="almacen_origen_id"
              label="Almacén de Origen (Remitente)"
              rules={[{ required: true, message: 'Seleccione almacén origen' }]}
            >
              <Select
                placeholder="Seleccione origen..."
                onChange={handleOrigenChange}
                options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="almacen_destino_id"
              label="Almacén de Destino (Receptor)"
              rules={[{ required: true, message: 'Seleccione almacén destino' }]}
            >
              <Select
                placeholder="Seleccione destino..."
                options={almacenes
                  .filter((a) => a.id !== origenId)
                  .map((a) => ({ value: a.id, label: a.nombre }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={1} placeholder="Motivo o guía de remisión del traslado..." />
        </Form.Item>

        <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            Ítems a Transferir (Se descuentan del origen y quedan en tránsito)
          </Text>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarLinea}>
            Agregar Ítem
          </Button>
        </div>

        <GlobalTable<LineaEnvio>
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
