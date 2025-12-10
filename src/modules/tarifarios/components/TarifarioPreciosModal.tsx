import { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  InputNumber,
  Select,
  Typography,
  Empty,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  useTarifario, 
  useCrearTarifarioPrecio, 
  useActualizarTarifarioPrecio, 
  useEliminarTarifarioPrecio 
} from '../hooks';
import { useAnalisisActivos } from '../../analisis/hooks';
import type { TarifarioPrecio } from '../types';

const { Title, Text } = Typography;

interface TarifarioPreciosModalProps {
  open: boolean;
  tarifarioId: number | null;
  tarifarioNombre: string;
  onClose: () => void;
}

export const TarifarioPreciosModal: React.FC<TarifarioPreciosModalProps> = ({
  open,
  tarifarioId,
  tarifarioNombre,
  onClose,
}) => {
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState<number | null>(null);
  const [precioNuevo, setPrecioNuevo] = useState<number>(0);
  const [preciosEditados, setPreciosEditados] = useState<Record<number, number>>({});

  const { data: tarifario, isLoading } = useTarifario(tarifarioId || 0);
  const { data: analisisList } = useAnalisisActivos();
  
  const crearPrecioMutation = useCrearTarifarioPrecio();
  const actualizarPrecioMutation = useActualizarTarifarioPrecio();
  const eliminarPrecioMutation = useEliminarTarifarioPrecio();

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setAnalisisSeleccionado(null);
      setPrecioNuevo(0);
      setPreciosEditados({});
    }
  }, [open]);

  // Análisis disponibles (no agregados aún)
  const analisisDisponibles = analisisList?.filter(
    (a) => !tarifario?.precios?.some((p) => p.analisis_id === a.id)
  ) || [];

  const handleAgregarAnalisis = async () => {
    if (!analisisSeleccionado || !tarifarioId || precioNuevo <= 0) return;
    
    await crearPrecioMutation.mutateAsync({
      tarifario_id: tarifarioId,
      analisis_id: analisisSeleccionado,
      precio: precioNuevo,
    });
    
    setAnalisisSeleccionado(null);
    setPrecioNuevo(0);
  };

  const handlePrecioChange = (precioId: number, valor: number | null) => {
    setPreciosEditados((prev) => ({
      ...prev,
      [precioId]: valor || 0,
    }));
  };

  const handleGuardarPrecio = async (precio: TarifarioPrecio) => {
    const nuevoPrecio = preciosEditados[precio.id];
    if (nuevoPrecio === undefined || nuevoPrecio === precio.precio) return;

    await actualizarPrecioMutation.mutateAsync({
      id: precio.id,
      tarifarioId: tarifarioId!,
      data: { precio: nuevoPrecio },
    });

    setPreciosEditados((prev) => {
      const updated = { ...prev };
      delete updated[precio.id];
      return updated;
    });
  };

  const handleEliminarPrecio = async (precio: TarifarioPrecio) => {
    await eliminarPrecioMutation.mutateAsync({
      id: precio.id,
      tarifarioId: tarifarioId!,
    });
  };

  const columns: ColumnsType<TarifarioPrecio> = [
    {
      title: 'Análisis',
      dataIndex: 'analisis_nombre',
      key: 'analisis_nombre',
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Precio (S/.)',
      dataIndex: 'precio',
      key: 'precio',
      width: 150,
      render: (precio: number, record: TarifarioPrecio) => (
        <InputNumber
          min={0}
          step={0.5}
          precision={2}
          value={preciosEditados[record.id] !== undefined ? preciosEditados[record.id] : precio}
          onChange={(val) => handlePrecioChange(record.id, val)}
          prefix="S/."
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      align: 'center',
      render: (_, record: TarifarioPrecio) => (
        <Space>
          {preciosEditados[record.id] !== undefined && preciosEditados[record.id] !== record.precio && (
            <Button
              type="link"
              size="small"
              icon={<SaveOutlined />}
              onClick={() => handleGuardarPrecio(record)}
              loading={actualizarPrecioMutation.isPending}
            />
          )}
          <Popconfirm
            title="¿Eliminar este análisis del tarifario?"
            onConfirm={() => handleEliminarPrecio(record)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalAnalisis = tarifario?.precios?.length || 0;

  return (
    <Modal
      title={
        <Space>
          <span>Precios del Tarifario:</span>
          <Text type="secondary">{tarifarioNombre}</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
    >
      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic title="Total Análisis" value={totalAnalisis} />
        </Col>
      </Row>

      {/* Agregar nuevo análisis */}
      <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
        <Title level={5} style={{ marginBottom: 12 }}>Agregar Análisis</Title>
        <Row gutter={12}>
          <Col flex="auto">
            <Select
              placeholder="Seleccionar análisis..."
              value={analisisSeleccionado}
              onChange={setAnalisisSeleccionado}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={analisisDisponibles.map((a) => ({
                label: a.nombre,
                value: a.id,
              }))}
              notFoundContent={
                analisisDisponibles.length === 0 
                  ? "Todos los análisis ya están agregados" 
                  : "No se encontraron análisis"
              }
            />
          </Col>
          <Col>
            <InputNumber
              min={0}
              step={0.5}
              precision={2}
              value={precioNuevo}
              onChange={(val) => setPrecioNuevo(val || 0)}
              placeholder="Precio"
              prefix="S/."
              style={{ width: 120 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAgregarAnalisis}
              disabled={!analisisSeleccionado || precioNuevo <= 0}
              loading={crearPrecioMutation.isPending}
            >
              Agregar
            </Button>
          </Col>
        </Row>
      </div>

      {/* Tabla de precios */}
      <Table
        columns={columns}
        dataSource={tarifario?.precios || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No hay análisis en este tarifario. Agregue el primero."
            />
          ),
        }}
      />
    </Modal>
  );
};
