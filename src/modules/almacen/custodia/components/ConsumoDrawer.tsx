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
import { custodiaApi } from '../custodia.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import type { ItemCustodia } from '../custodia.types';

const { Text } = Typography;

interface LineaConsumo {
  key: string;
  custodia_id?: number;
  almacen_origen_id?: number;
  producto_id?: number;
  lote_id?: number;
  producto_nombre?: string;
  numero_lote?: string;
  unidad_medida?: string;
  stock_disponible: number;
  cantidad: number;
  observacion?: string;
}

interface ConsumoDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personalId?: number;
  itemsCustodiaIniciales?: ItemCustodia[];
}

export default function ConsumoDrawer({
  open,
  onClose,
  onSuccess,
  personalId,
  itemsCustodiaIniciales = [],
}: ConsumoDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();

  const [disponiblesCustodia, setDisponiblesCustodia] = useState<ItemCustodia[]>([]);
  const [lineas, setLineas] = useState<LineaConsumo[]>([]);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ fecha: dayjs() });
      if (itemsCustodiaIniciales.length > 0) {
        setDisponiblesCustodia(itemsCustodiaIniciales);
      } else {
        custodiaApi
          .listar({ personal_id: personalId, solo_con_stock: true, limit: 100 })
          .then((res) => setDisponiblesCustodia(res.items || []))
          .catch(console.error);
      }
      setLineas([]);
    }
  }, [open, personalId, itemsCustodiaIniciales, form]);

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

  const handleSelectCustodia = (key: string, itemCustodiaId: number) => {
    const item = disponiblesCustodia.find((c) => c.id === itemCustodiaId);
    if (!item) return;

    setLineas((prev) =>
      prev.map((l) => {
        if (l.key === key) {
          return {
            ...l,
            custodia_id: item.id,
            almacen_origen_id: item.almacen_origen_id,
            producto_id: item.producto_id,
            lote_id: item.lote_id,
            producto_nombre: item.producto_nombre,
            numero_lote: item.numero_lote || 'Sin lote',
            unidad_medida: item.unidad_medida_codigo,
            stock_disponible: item.cantidad,
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
        message.warning('Debe agregar al menos un ítem para registrar consumo');
        return;
      }

      for (const l of lineas) {
        if (!l.producto_id || !l.lote_id || !l.almacen_origen_id) {
          message.warning('Todos los ítems deben provenir de un ítem en custodia válido');
          return;
        }
        if (l.cantidad <= 0) {
          message.warning(`La cantidad consumida para ${l.producto_nombre} debe ser mayor a 0`);
          return;
        }
        if (l.cantidad > l.stock_disponible) {
          message.error(
            `La cantidad consumida para ${l.producto_nombre} (${l.cantidad}) supera el saldo en custodia (${l.stock_disponible})`
          );
          return;
        }
      }

      setSaving(true);
      await custodiaApi.crearConsumo({
        sede_id: sedeId || 1,
        personal_id: personalId,
        fecha: values.fecha?.format('YYYY-MM-DD'),
        observaciones: values.observaciones,
        items: lineas.map((l) => ({
          almacen_origen_id: l.almacen_origen_id!,
          producto_id: l.producto_id!,
          lote_id: l.lote_id!,
          cantidad: l.cantidad,
          observacion: l.observacion,
        })),
      });

      message.success('Consumo registrado exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error registrando consumo');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaConsumo> = [
    {
      title: 'Ítem en Custodia',
      key: 'custodia_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar ítem asignado..."
          value={record.custodia_id}
          onChange={(val) => handleSelectCustodia(record.key, val)}
          showSearch
          optionFilterProp="label"
          options={disponiblesCustodia.map((c) => ({
            value: c.id,
            label: `${c.producto_nombre} | Lote: ${c.numero_lote || 'S/L'} | Saldo: ${c.cantidad} ${c.unidad_medida_codigo}`,
          }))}
        />
      ),
    },
    {
      title: 'Saldo Custodia',
      dataIndex: 'stock_disponible',
      key: 'stock_disponible',
      width: 110,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: '#059669' }}>
          {v} {r.unidad_medida}
        </Text>
      ),
    },
    {
      title: 'Cantidad a Consumir',
      dataIndex: 'cantidad',
      key: 'cantidad',
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
      title: 'Nota / Motivo',
      key: 'observacion',
      width: 160,
      render: (_, record) => (
        <Input
          placeholder="Uso en prueba..."
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
          <span>Registrar Consumo de Material</span>
          <Tag color="gold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Custodia
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
            Confirmar Consumo
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fecha"
              label="Fecha del Consumo"
              rules={[{ required: true, message: 'Seleccione la fecha' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="observaciones" label="Observaciones">
              <Input.TextArea rows={1} placeholder="Observación general del consumo..." />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            Materiales Consumidos (Se descuentan de su inventario personal)
          </Text>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarLinea}>
            Agregar Ítem
          </Button>
        </div>

        <GlobalTable<LineaConsumo>
          rowKey="key"
          dataSource={lineas}
          columns={columns}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No hay ítems seleccionados. Haga clic en "Agregar Ítem".' }}
        />
      </Form>
    </Drawer>
  );
}
