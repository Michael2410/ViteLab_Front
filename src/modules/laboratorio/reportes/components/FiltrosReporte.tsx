import { DatePicker, Select, Button, Space, Card, Row, Col, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { FiltrosReporte } from '../types';
import { useSedesActivas } from '../../ordenes/hooks';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface Props {
  filtros: FiltrosReporte;
  onFiltrosChange: (filtros: FiltrosReporte) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  loading?: boolean;
  mostrarEstado?: boolean;
  mostrarSede?: boolean;
  mostrarMetodoPago?: boolean;
  sedes?: { id: number; nombre: string }[];
}

const estadosOrden = [
  { value: 'REGISTRADA', label: 'Registrada' },
  { value: 'MUESTRA_RECIBIDA', label: 'Muestra Recibida' },
  { value: 'CON_RESULTADOS', label: 'Con Resultados' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'IMPRESO', label: 'Impreso' },
];

const metodosPago = [
  { value: 'EFECTIVO', label: '💵 Efectivo' },
  { value: 'YAPE', label: '🟣 Yape' },
  { value: 'PLIN', label: '🔵 Plin' },
  { value: 'TARJETA', label: '💳 Tarjeta / POS' },
  { value: 'TRANSFERENCIA', label: '🏦 Transferencia' },
];

export default function FiltrosReporteComponent({
  filtros,
  onFiltrosChange,
  onBuscar,
  onLimpiar,
  loading = false,
  mostrarEstado = false,
  mostrarSede = false,
  mostrarMetodoPago = false,
  sedes: sedesProp,
}: Props) {
  // Cargar sedes activas automáticamente si no fueron provistas
  const { data: sedesData, isLoading: loadingSedes } = useSedesActivas();
  const sedesList = sedesProp && sedesProp.length > 0 ? sedesProp : (sedesData || []);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    onFiltrosChange({
      ...filtros,
      fecha_inicio: dates?.[0]?.format('YYYY-MM-DD') || undefined,
      fecha_fin: dates?.[1]?.format('YYYY-MM-DD') || undefined,
    });
  };

  const rangeValue: [Dayjs, Dayjs] | null =
    filtros.fecha_inicio && filtros.fecha_fin
      ? [dayjs(filtros.fecha_inicio), dayjs(filtros.fecha_fin)]
      : null;

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        background: '#ffffff',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Row gutter={[16, 16]} align="bottom">
        <Col xs={24} sm={12} md={8} lg={6}>
          <div style={{ marginBottom: 6 }}>
            <Text strong style={{ fontSize: 13, color: '#334155' }}>
              Rango de Fechas
            </Text>
          </div>
          <RangePicker
            style={{ width: '100%', height: 38, borderRadius: 8 }}
            format="DD/MM/YYYY"
            value={rangeValue}
            onChange={handleDateChange}
            placeholder={['Fecha inicial', 'Fecha final']}
            presets={[
              { label: 'Hoy', value: [dayjs(), dayjs()] },
              { label: 'Últimos 7 días', value: [dayjs().subtract(6, 'day'), dayjs()] },
              { label: 'Este mes', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              { label: 'Mes anterior', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
            ]}
          />
        </Col>

        {mostrarSede && (
          <Col xs={24} sm={12} md={8} lg={mostrarMetodoPago ? 5 : 6}>
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13, color: '#334155' }}>
                Sede del Laboratorio
              </Text>
            </div>
            <Select
              style={{ width: '100%', height: 38 }}
              placeholder="Todas las sedes"
              allowClear
              loading={loadingSedes}
              value={filtros.sede_id}
              onChange={(value) => onFiltrosChange({ ...filtros, sede_id: value })}
              options={sedesList.map((s) => ({ value: s.id, label: s.nombre }))}
            />
          </Col>
        )}

        {mostrarEstado && (
          <Col xs={24} sm={12} md={8} lg={4}>
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13, color: '#334155' }}>
                Estado de Orden
              </Text>
            </div>
            <Select
              style={{ width: '100%', height: 38 }}
              placeholder="Todos los estados"
              allowClear
              value={filtros.estado}
              onChange={(value) => onFiltrosChange({ ...filtros, estado: value })}
              options={estadosOrden}
            />
          </Col>
        )}

        {mostrarMetodoPago && (
          <Col xs={24} sm={12} md={8} lg={4}>
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13, color: '#334155' }}>
                Método de Pago
              </Text>
            </div>
            <Select
              style={{ width: '100%', height: 38 }}
              placeholder="Todos"
              allowClear
              value={filtros.metodo_pago}
              onChange={(value) => onFiltrosChange({ ...filtros, metodo_pago: value })}
              options={metodosPago}
            />
          </Col>
        )}

        <Col xs={24} sm={12} md={8} lg={mostrarMetodoPago ? 5 : 6}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={onBuscar}
              loading={loading}
              style={{
                height: 38,
                borderRadius: 8,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                border: 'none',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              }}
            >
              Consultar
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={onLimpiar}
              disabled={loading}
              style={{
                height: 38,
                borderRadius: 8,
                borderColor: '#cbd5e1',
                color: '#475569',
              }}
            >
              Limpiar
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
