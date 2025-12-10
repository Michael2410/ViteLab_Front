import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Input,
  Button,
  Select,
  Modal,
  Empty,
  Divider,
} from 'antd';
import {
  ExperimentOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useBuscarAnalisis } from '../hooks';
import { obtenerPreciosAnalisis } from '../api';
import type { AnalisisSeleccionado, Analisis, MuestraSimple } from '../types';

const { Text } = Typography;

interface AnalisisConMuestras extends Analisis {
  muestras_ids?: number[];
  muestras_nombres?: string[];
  precio?: number;
}

interface SeleccionAnalisisProps {
  analisisSeleccionados: AnalisisSeleccionado[];
  onAnalisisChange: (analisis: AnalisisSeleccionado[]) => void;
  convenioId?: number;
}

export const SeleccionAnalisis: React.FC<SeleccionAnalisisProps> = ({
  analisisSeleccionados,
  onAnalisisChange,
  convenioId,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [analisisAgregados, setAnalisisAgregados] = useState<AnalisisConMuestras[]>([]);
  const [muestraModalVisible, setMuestraModalVisible] = useState(false);
  const [analisisParaAgregar, setAnalisisParaAgregar] = useState<Analisis | null>(null);
  const [muestrasSeleccionadas, setMuestrasSeleccionadas] = useState<number[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldSearch = debouncedBusqueda.trim().length >= 2;
  const { data: resultadosBusqueda, isLoading: loadingBusqueda } = useBuscarAnalisis(debouncedBusqueda, shouldSearch);

  // Obtener muestras disponibles de los componentes del análisis seleccionado
  const muestrasDisponibles = useMemo(() => {
    if (!analisisParaAgregar?.componentes) return [];
    
    const muestrasMap = new Map<number, MuestraSimple>();
    analisisParaAgregar.componentes.forEach((componente) => {
      if (componente.muestras && componente.muestras.length > 0) {
        componente.muestras.forEach((muestra) => {
          if (!muestrasMap.has(muestra.id)) {
            muestrasMap.set(muestra.id, muestra);
          }
        });
      }
    });
    
    return Array.from(muestrasMap.values());
  }, [analisisParaAgregar]);

  // Debounce manual
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [busqueda]);

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
  };

  const handleAgregarAnalisis = (analisis: Analisis) => {
    // Verificar si ya está agregado
    if (analisisSeleccionados.some((a) => a.id === analisis.id)) {
      return;
    }

    // Abrir modal para seleccionar muestras
    setAnalisisParaAgregar(analisis);
    setMuestrasSeleccionadas([]);
    setMuestraModalVisible(true);
  };

  const handleConfirmarMuestras = async () => {
    if (!analisisParaAgregar) return;

    // Obtener precio del análisis según el tarifario
    let precio = 0;
    try {
      const precios = await obtenerPreciosAnalisis([analisisParaAgregar.id], convenioId);
      if (precios.length > 0) {
        precio = precios[0].precio;
      }
    } catch (error) {
      console.error('Error al obtener precio:', error);
    }

    const nuevoAnalisis: AnalisisSeleccionado = {
      id: analisisParaAgregar.id,
      muestras_ids: muestrasSeleccionadas.length > 0 ? muestrasSeleccionadas : undefined,
    };

    const analisisConMuestras: AnalisisConMuestras = {
      ...analisisParaAgregar,
      muestras_ids: muestrasSeleccionadas.length > 0 ? muestrasSeleccionadas : undefined,
      muestras_nombres: muestrasSeleccionadas.length > 0 
        ? muestrasSeleccionadas.map(id => 
            muestrasDisponibles.find(m => m.id === id)?.nombre || ''
          ).filter(Boolean)
        : undefined,
      precio,
    };

    setAnalisisAgregados([...analisisAgregados, analisisConMuestras]);
    onAnalisisChange([...analisisSeleccionados, nuevoAnalisis]);

    setMuestraModalVisible(false);
    setAnalisisParaAgregar(null);
    setMuestrasSeleccionadas([]);
  };

  const handleEliminarAnalisis = (analisisId: number) => {
    setAnalisisAgregados(analisisAgregados.filter((a) => a.id !== analisisId));
    onAnalisisChange(analisisSeleccionados.filter((a) => a.id !== analisisId));
  };

  // Columnas para resultados de búsqueda
  const columnasBusqueda: ColumnsType<Analisis> = [
    {
      title: 'Análisis',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string, record: Analisis) => (
        <Space direction="vertical" size={0}>
          <Text strong>{nombre}</Text>
          {record.sinonimia && record.sinonimia.length > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Sinonimias: {record.sinonimia.join(', ')}
            </Text>
          )}
          {record.componentes && record.componentes.length > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Componentes: {record.componentes.map(c => c.nombre).join(', ')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 100,
      align: 'center',
      render: (_, record: Analisis) => {
        const yaAgregado = analisisSeleccionados.some((a) => a.id === record.id);
        return (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAgregarAnalisis(record)}
            disabled={yaAgregado}
          >
            {yaAgregado ? 'Agregado' : 'Agregar'}
          </Button>
        );
      },
    },
  ];

  // Columnas para análisis seleccionados
  const columnasSeleccionados: ColumnsType<AnalisisConMuestras> = [
    {
      title: 'Análisis',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Tipos de Muestra',
      key: 'muestras_nombres',
      width: 200,
      render: (_, record: AnalisisConMuestras) =>
        record.muestras_nombres && record.muestras_nombres.length > 0 ? (
          <Space wrap>
            {record.muestras_nombres.map((nombre, idx) => (
              <Tag key={idx} color="blue">{nombre}</Tag>
            ))}
          </Space>
        ) : (
          <Tag>Sin especificar</Tag>
        ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      width: 100,
      align: 'right',
      render: (precio: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          S/ {(precio || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 80,
      align: 'center',
      render: (_, record: AnalisisConMuestras) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleEliminarAnalisis(record.id)}
        />
      ),
    },
  ];

  // Calcular total
  const totalPrecios = analisisAgregados.reduce((sum, a) => sum + (a.precio || 0), 0);

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
        {/* Búsqueda por sinonimia */}
        <Input
          placeholder="Buscar análisis por nombre o sinonimia..."
          prefix={<SearchOutlined />}
          value={busqueda}
          onChange={handleBusquedaChange}
          size="large"
          allowClear
        />

        {/* Resultados de búsqueda */}
        {debouncedBusqueda.length >= 2 && (
          <Card size="small" title="Resultados de búsqueda">
            <Table
              columns={columnasBusqueda}
              dataSource={resultadosBusqueda || []}
              rowKey="id"
              loading={loadingBusqueda}
              pagination={false}
              size="small"
              locale={{
                emptyText: (
                  <Empty
                    description="No se encontraron análisis"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Card>
        )}

        {/* Análisis seleccionados */}
        <Card
          size="small"
          title={
            <Space>
              <span>Análisis Seleccionados</span>
              <Tag color="blue">{analisisAgregados.length}</Tag>
            </Space>
          }
        >
          <Table
            columns={columnasSeleccionados}
            dataSource={analisisAgregados}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{
              emptyText: (
                <Empty
                  description="Busque y agregue análisis usando el campo de arriba"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            summary={() => (
              analisisAgregados.length > 0 ? (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>TOTAL</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#1890ff' }}>S/ {totalPrecios.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              ) : null
            )}
          />
        </Card>
      </Space>

      {/* Modal para seleccionar muestras */}
      <Modal
        title="Seleccionar Tipos de Muestra"
        open={muestraModalVisible}
        onCancel={() => {
          setMuestraModalVisible(false);
          setAnalisisParaAgregar(null);
          setMuestrasSeleccionadas([]);
        }}
        onOk={handleConfirmarMuestras}
        okText="Agregar"
        cancelText="Cancelar"
        width={500}
      >
        {analisisParaAgregar && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text>Análisis: </Text>
              <Text strong>{analisisParaAgregar.nombre}</Text>
            </div>
            
            {analisisParaAgregar.componentes && analisisParaAgregar.componentes.length > 0 && (
              <div>
                <Text type="secondary">Componentes: </Text>
                <Text type="secondary">
                  {analisisParaAgregar.componentes.map(c => c.nombre).join(', ')}
                </Text>
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {muestrasDisponibles.length > 0 ? (
              <>
                <Text>Seleccione uno o varios tipos de muestra:</Text>
                <Select
                  mode="multiple"
                  placeholder="Seleccione tipos de muestra"
                  style={{ width: '100%' }}
                  value={muestrasSeleccionadas}
                  onChange={setMuestrasSeleccionadas}
                  options={muestrasDisponibles.map((m) => ({
                    label: m.nombre,
                    value: m.id,
                  }))}
                />
              </>
            ) : (
              <Text type="warning">
                Este análisis no tiene muestras configuradas en sus componentes.
              </Text>
            )}
          </Space>
        )}
      </Modal>
    </Card>
  );
};
