import { DatePicker, Select, Button, Space, Card, Row, Col } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { FiltrosReporte } from '../types';

const { RangePicker } = DatePicker;

interface Props {
  filtros: FiltrosReporte;
  onFiltrosChange: (filtros: FiltrosReporte) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  loading?: boolean;
  mostrarEstado?: boolean;
  mostrarSede?: boolean;
  sedes?: { id: number; nombre: string }[];
}

const estadosOrden = [
  { value: 'REGISTRADA', label: 'Registrada' },
  { value: 'MUESTRA_RECIBIDA', label: 'Muestra Recibida' },
  { value: 'CON_RESULTADOS', label: 'Con Resultados' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'IMPRESO', label: 'Impreso' },
];

export default function FiltrosReporteComponent({
  filtros,
  onFiltrosChange,
  onBuscar,
  onLimpiar,
  loading = false,
  mostrarEstado = false,
  mostrarSede = false,
  sedes = [],
}: Props) {
  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    onFiltrosChange({
      ...filtros,
      fecha_inicio: dates?.[0]?.format('YYYY-MM-DD') || undefined,
      fecha_fin: dates?.[1]?.format('YYYY-MM-DD') || undefined,
    });
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            Período
          </label>
          <RangePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            onChange={handleDateChange}
            placeholder={['Fecha inicio', 'Fecha fin']}
          />
        </Col>

        {mostrarSede && sedes.length > 0 && (
          <Col xs={24} sm={12} md={8} lg={4}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Sede
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Todas las sedes"
              allowClear
              value={filtros.sede_id}
              onChange={(value) => onFiltrosChange({ ...filtros, sede_id: value })}
              options={sedes.map(s => ({ value: s.id, label: s.nombre }))}
            />
          </Col>
        )}

        {mostrarEstado && (
          <Col xs={24} sm={12} md={8} lg={4}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Estado
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Todos los estados"
              allowClear
              value={filtros.estado}
              onChange={(value) => onFiltrosChange({ ...filtros, estado: value })}
              options={estadosOrden}
            />
          </Col>
        )}

        <Col xs={24} sm={12} md={8} lg={6}>
          <label style={{ display: 'block', marginBottom: 4, opacity: 0 }}>
            Acciones
          </label>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={onBuscar}
              loading={loading}
            >
              Generar Reporte
            </Button>
            <Button icon={<ClearOutlined />} onClick={onLimpiar}>
              Limpiar
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
