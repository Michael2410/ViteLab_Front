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
import { almacenApi } from '../../shared/almacen.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import type { ItemCustodia } from '../custodia.types';
import type { Almacen } from '../../maestros/maestros.types';

const { Text } = Typography;

interface LineaDevolucion {
  key: string;
  custodia_id?: number;
  producto_id?: number;
  lote_id?: number;
  producto_nombre?: string;
  numero_lote?: string;
  unidad_medida?: string;
  stock_disponible: number;
  cantidad: number;
  observacion?: string;
}

interface DevolucionDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personalId?: number;
}

export default function DevolucionDrawer({
  open,
  onClose,
  onSuccess,
  personalId,
}: DevolucionDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { sedeId } = useAlmacenSedeStore();

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [disponiblesCustodia, setDisponiblesCustodia] = useState<ItemCustodia[]>([]);
  const [lineas, setLineas] = useState<LineaDevolucion[]>([]);

  useEffect(() => {
    if (open) {
      almacenApi
        .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
        .then((data) => {
          setAlmacenes(data || []);
          if (data && data.length > 0) {
            form.setFieldsValue({ almacen_id: data[0].id });
          }
        })
        .catch(console.error);

      custodiaApi
        .listar({ personal_id: personalId, solo_con_stock: true, limit: 100 })
        .then((res) => setDisponiblesCustodia(res.items || []))
        .catch(console.error);

      form.setFieldsValue({ fecha: dayjs() });
      setLineas([]);
    }
  }, [open, personalId, sedeId, form]);

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
        message.warning('Debe agregar al menos un ítem para devolver');
        return;
      }

      for (const l of lineas) {
        if (!l.producto_id || !l.lote_id) {
          message.warning('Todos los ítems deben provenir de un ítem en custodia');
          return;
        }
        if (l.cantidad <= 0) {
          message.warning(`La cantidad devuelta para ${l.producto_nombre} debe ser mayor a 0`);
          return;
        }
        if (l.cantidad > l.stock_disponible) {
          message.error(
            `La cantidad devuelta para ${l.producto_nombre} (${l.cantidad}) supera el saldo en custodia (${l.stock_disponible})`
          );
          return;
        }
      }

      setSaving(true);
      await custodiaApi.crearDevolucion({
        almacen_id: values.almacen_id,
        personal_id: personalId,
        fecha: values.fecha?.format('YYYY-MM-DD'),
        observaciones: values.observaciones,
        items: lineas.map((l) => ({
          producto_id: l.producto_id!,
          lote_id: l.lote_id!,
          cantidad: l.cantidad,
          observacion: l.observacion,
        })),
      });

      message.success('Devolución registrada exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error registrando devolución');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<LineaDevolucion> = [
    {
      title: 'Ítem en Custodia a Devolver',
      key: 'custodia_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar ítem..."
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
      title: 'Cantidad a Devolver',
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
      title: 'Motivo / Detalle',
      key: 'observacion',
      width: 160,
      render: (_, record) => (
        <Input
          placeholder="Sobrante, cambio..."
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
          <span>Devolver Material a Almacén</span>
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
            Confirmar Devolución
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="almacen_id"
              label="Almacén Destino"
              rules={[{ required: true, message: 'Seleccione almacén destino' }]}
            >
              <Select
                placeholder="Seleccione almacén..."
                options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fecha"
              label="Fecha de Devolución"
              rules={[{ required: true, message: 'Seleccione la fecha' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={1} placeholder="Motivo de la devolución al almacén..." />
        </Form.Item>

        <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            Ítems a Devolver (Se reintegran al stock general del almacén)
          </Text>
          <Button type="dashed" icon={<PlusOutlined />} onClick={agregarLinea}>
            Agregar Ítem
          </Button>
        </div>

        <GlobalTable<LineaDevolucion>
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
