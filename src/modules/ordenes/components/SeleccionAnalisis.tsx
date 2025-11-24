import { useState } from 'react';
import { Card, Table, Select, Tag, Space, Typography, Empty, Input } from 'antd';
import { ExperimentOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAreasActivas, useAnalisisPorArea } from '../hooks';
import type { Analisis } from '../types';

const { Text } = Typography;

interface SeleccionAnalisisProps {
  analisisSeleccionados: number[];
  onAnalisisChange: (analisisIds: number[]) => void;
}

export const SeleccionAnalisis: React.FC<SeleccionAnalisisProps> = ({
  analisisSeleccionados,
  onAnalisisChange,
}) => {
  const [areaIdSeleccionada, setAreaIdSeleccionada] = useState<number | undefined>();
  const [busqueda, setBusqueda] = useState('');

  const { data: areas, isLoading: loadingAreas } = useAreasActivas();
  const { data: analisis, isLoading: loadingAnalisis } = useAnalisisPorArea(areaIdSeleccionada);

  // Filtrar análisis por término de búsqueda
  const analisisFiltrados = analisis?.filter((item) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      item.nombre.toLowerCase().includes(searchLower) ||
      item.codigo.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnsType<Analisis> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
    },
    {
      title: 'Análisis',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string, record: Analisis) => (
        <Space direction="vertical" size={0}>
          <Text strong>{nombre}</Text>
          {record.area_nombre && <Text type="secondary">{record.area_nombre}</Text>}
        </Space>
      ),
    },
    {
      title: 'Método',
      dataIndex: 'metodo_nombre',
      key: 'metodo_nombre',
      width: 180,
    },
    {
      title: 'Precio Base',
      dataIndex: 'precio_base',
      key: 'precio_base',
      width: 120,
      align: 'right',
      render: (precio: number) => (
        <Text strong>S/ {precio.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Tiempo',
      dataIndex: 'tiempo_entrega',
      key: 'tiempo_entrega',
      width: 120,
      render: (tiempo: string) => tiempo && <Tag color="blue">{tiempo}</Tag>,
    },
  ];

  const rowSelection = {
    selectedRowKeys: analisisSeleccionados,
    onChange: (selectedRowKeys: React.Key[]) => {
      onAnalisisChange(selectedRowKeys as number[]);
    },
    getCheckboxProps: (record: Analisis) => ({
      name: record.nombre,
    }),
  };

  return (
    <Card
      title={
        <>
          <ExperimentOutlined /> Selección de Análisis
        </>
      }
      bordered={false}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Filtros */}
        <Space wrap>
          <Select
            placeholder="Filtrar por área"
            style={{ width: 200 }}
            loading={loadingAreas}
            allowClear
            value={areaIdSeleccionada}
            onChange={(value) => {
              setAreaIdSeleccionada(value);
              setBusqueda(''); // Limpiar búsqueda al cambiar área
            }}
            options={areas?.map((area) => ({
              label: area.nombre,
              value: area.id,
            }))}
          />

          <Input
            placeholder="Buscar por código o nombre..."
            prefix={<SearchOutlined />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Tag color="blue">
            {analisisSeleccionados.length} análisis seleccionados
          </Tag>
        </Space>

        {/* Tabla de análisis */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={analisisFiltrados}
          rowKey="id"
          loading={loadingAnalisis}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} análisis`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  areaIdSeleccionada || busqueda
                    ? 'No se encontraron análisis con los filtros aplicados'
                    : 'Seleccione un área para ver los análisis disponibles'
                }
              />
            ),
          }}
          size="small"
        />

        {/* Resumen */}
        {analisisSeleccionados.length > 0 && (
          <Card size="small" style={{ background: '#f0f2f5' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Resumen de selección:</Text>
              <Text>
                Total de análisis: <Text strong>{analisisSeleccionados.length}</Text>
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Los precios finales se calcularán según el tarifario del convenio seleccionado
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};
