import { useState } from 'react';
import {
  Button,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Tooltip,
  App,
  Table,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import { useOrdenes, useEliminarOrden, useSedesActivas, useRecepcionarMuestra } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import {
  EstadoOrden,
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  type Orden,
  type OrdenFilters,
} from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const OrdenesPage: React.FC = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { hasPermission } = useAuthStore();
  const [filtros, setFiltros] = useState<OrdenFilters>({
    page: 1,
    limit: 20,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { data: ordenes, isLoading } = useOrdenes(filtros);
  const { data: sedes } = useSedesActivas();
  const eliminarOrdenMutation = useEliminarOrden();
  const recepcionarMuestraMutation = useRecepcionarMuestra();

  const handleFiltroChange = (key: keyof OrdenFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page cuando cambian filtros
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      page: 1,
      limit: 20,
    });
  };

  const handleEliminar = (record: Orden) => {
    modal.confirm({
      title: '¿Está seguro de eliminar esta orden?',
      content: `Se eliminará la orden ${record.numero_atencion}. Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await eliminarOrdenMutation.mutateAsync(record.id);
      },
    });
  };

  const handleRecepcionarMuestra = (record: Orden) => {
    console.log('🔵 [RECEPCIONAR] Botón clickeado para orden:', record.id, record.numero_atencion);
    console.log('🔵 [RECEPCIONAR] Record completo:', record);
    
    modal.confirm({
      title: '¿Confirmar recepción de muestra?',
      content: `Se marcará la muestra de la orden ${record.numero_atencion} como recepcionada.`,
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
      onOk: async () => {
        console.log('🟢 [RECEPCIONAR] Modal confirmado, llamando a mutateAsync...');
        try {
          const resultado = await recepcionarMuestraMutation.mutateAsync(record.id);
          console.log('✅ [RECEPCIONAR] Mutación exitosa:', resultado);
        } catch (error) {
          console.error('❌ [RECEPCIONAR] Error en mutación:', error);
        }
      },
    });
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setFiltros((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const columns: ColumnsType<Orden> = [
    {
      title: 'N° Orden',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 80,
      render: (numero: number) => <Text strong>{numero}</Text>,
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      width: 120,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Paciente',
      key: 'paciente',
      width: 280,
      render: (_, record: any) => (
        <div>
          <div>
            <Text strong>{record.paciente_nombres} {record.paciente_apellidos}</Text>
          </div>
          <Text type="secondary">DNI: {record.paciente_dni}</Text>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_paciente',
      key: 'tipo_paciente',
      width: 100,
      render: (tipo: string ) => (
        <Tag color={tipo === 'CONVENIO' ? 'blue' : 'green'}>
          {tipo === 'CONVENIO' ? 'Convenio' : 'Particular'}
        </Tag>
      ),
    },
    {
      title: 'Convenio',
      dataIndex: 'convenio_nombre',
      key: 'convenio_nombre',
      width: 150,
      render: (nombre: string | null) => nombre || <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 140,
      render: (estado: EstadoOrden) => (
        <Tag color={ESTADO_ORDEN_COLORS[estado]}>{ESTADO_ORDEN_LABELS[estado]}</Tag>
      ),
    },
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 150,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (total: number) => <Text strong>S/ {total.toFixed(2)}</Text>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('orders.read') && (
            <Tooltip title="Ver detalle">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/ordenes/${record.id}`)}
              />
            </Tooltip>
          )}
          {hasPermission('orders.update') && record.estado === EstadoOrden.REGISTRADA && (
            <Tooltip title="Recepcionar Muestra">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleRecepcionarMuestra(record)}
              >
                Recepcionar
              </Button>
            </Tooltip>
          )}
          {hasPermission('orders.delete') && (
            <Tooltip title="Eliminar">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminar(record)}
                disabled={record.estado !== EstadoOrden.REGISTRADA}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filtrosActivos = Object.keys(filtros).filter(
    (key) =>
      key !== 'page' &&
      key !== 'limit' &&
      filtros[key as keyof OrdenFilters] !== undefined &&
      filtros[key as keyof OrdenFilters] !== ''
  ).length;

return (
  <PageContainer>

    {/* 🔵 Header: título + búsqueda + filtros + botón nueva orden */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>Órdenes de Atención</Title>
        <Text type="secondary">Gestión de órdenes de laboratorio</Text>
      </div>

      {/* Buscadores + filtros + crear */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Buscar por nombre */}
        <Input
          placeholder="Buscar por nombre del paciente..."
          prefix={<SearchOutlined />}
          allowClear
          value={filtros.paciente_nombre}
          onChange={(e) => handleFiltroChange('paciente_nombre', e.target.value)}
          style={{ width: 240 }}
        />

        {/* Buscar por DNI */}
        <Input
          placeholder="Buscar por DNI..."
          prefix={<SearchOutlined />}
          allowClear
          maxLength={8}
          value={filtros.paciente_dni}
          onChange={(e) => handleFiltroChange('paciente_dni', e.target.value)}
          style={{ width: 240 }}
        />

        {/* Filtros avanzados */}
        <Button
          icon={<FilterOutlined />}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          Filtros {filtrosActivos > 0 && `(${filtrosActivos})`}
        </Button>

        {filtrosActivos > 0 && (
          <Button type="link" onClick={handleLimpiarFiltros}>
            Limpiar
          </Button>
        )}

        {/* Nueva Orden */}
        {hasPermission('orders.create') && (
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/ordenes/nueva')}
          >
            Nueva Orden
          </Button>
        )}
      </div>
    </div>

    {/* 🔵 Filtros avanzados */}
    {mostrarFiltros && (
      <div style={{ marginBottom: 16 }}>
        <Card>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Select
                placeholder="Estado"
                style={{ width: '100%' }}
                allowClear
                value={filtros.estado}
                onChange={(value) => handleFiltroChange('estado', value)}
                options={Object.values(EstadoOrden).map((estado) => ({
                  label: ESTADO_ORDEN_LABELS[estado],
                  value: estado,
                }))}
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                placeholder="Sede"
                style={{ width: '100%' }}
                allowClear
                value={filtros.sede_id}
                onChange={(value) => handleFiltroChange('sede_id', value)}
                options={sedes?.map((sede) => ({
                  label: sede.nombre,
                  value: sede.id,
                }))}
              />
            </Col>

            <Col xs={24} md={12}>
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Fecha desde', 'Fecha hasta']}
                value={
                  filtros.fecha_desde && filtros.fecha_hasta
                    ? [dayjs(filtros.fecha_desde), dayjs(filtros.fecha_hasta)]
                    : null
                }
                onChange={(dates) => {
                  if (dates) {
                    handleFiltroChange('fecha_desde', dates[0]?.format('YYYY-MM-DD'));
                    handleFiltroChange('fecha_hasta', dates[1]?.format('YYYY-MM-DD'));
                  } else {
                    handleFiltroChange('fecha_desde', undefined);
                    handleFiltroChange('fecha_hasta', undefined);
                  }
                }}
              />
            </Col>
          </Row>
        </Card>
      </div>
    )}

    {/* 🔵 Tabla */}
      <Table
        columns={columns}
        dataSource={ordenes?.items || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1200 }}
        pagination={{
          current: filtros.page,
          pageSize: filtros.limit,
          total: ordenes?.total || 0,
          showSizeChanger: true,
          showTotal: (total: number) => `Total ${total} órdenes`,
          onChange: handlePaginationChange,
        }}
      />

  </PageContainer>
);

};
