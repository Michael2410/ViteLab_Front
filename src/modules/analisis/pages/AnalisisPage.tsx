import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Card,
  Row,
  Col,
  Modal,
  Switch,
  Tag,
  Badge,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExperimentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { 
  useAnalisis, 
  useCrearAnalisis, 
  useActualizarAnalisis, 
  useEliminarAnalisis 
} from '../hooks';
import { obtenerAnalisisPorId } from '../api';
import { AnalisisFormModal } from '../components/AnalisisFormModal';
import type { Analisis, AnalisisFilters, CreateAnalisisInput, UpdateAnalisisInput } from '../types';

const { Title, Text } = Typography;

export const AnalisisPage: React.FC = () => {
  const [filtros, setFiltros] = useState<AnalisisFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState<Analisis | null>(null);
  const navigate = useNavigate();

  const { data: analisis, isLoading } = useAnalisis(filtros);
  const crearAnalisisMutation = useCrearAnalisis();
  const actualizarAnalisisMutation = useActualizarAnalisis();
  const eliminarAnalisisMutation = useEliminarAnalisis();

  const handleFiltroChange = (key: keyof AnalisisFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setFiltros((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const handleNuevo = () => {
    setAnalisisSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = async (analisisItem: Analisis) => {
    // Si el análisis de la lista no tiene componentes cargados, hacer una petición adicional
    if (!analisisItem.componentes) {
      try {
        const analisisCompleto = await obtenerAnalisisPorId(analisisItem.id);
        setAnalisisSeleccionado(analisisCompleto);
      } catch (error) {
        console.error('Error al cargar componentes:', error);
        setAnalisisSeleccionado(analisisItem);
      }
    } else {
      setAnalisisSeleccionado(analisisItem);
    }
    setModalOpen(true);
  };


  const handleEliminar = (analisisItem: Analisis) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este análisis?',
      content: `Se eliminará el análisis "${analisisItem.nombre}" y todos sus componentes. Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarAnalisisMutation.mutateAsync(analisisItem.id);
      },
    });
  };

  const handleToggleActivo = async (analisisItem: Analisis) => {
    await actualizarAnalisisMutation.mutateAsync({
      id: analisisItem.id,
      data: { activo: !analisisItem.activo },
    });
  };

  const handleSubmitForm = async (data: CreateAnalisisInput | UpdateAnalisisInput) => {
    if (analisisSeleccionado) {
      await actualizarAnalisisMutation.mutateAsync({
        id: analisisSeleccionado.id,
        data: data as UpdateAnalisisInput,
      });
    } else {
      await crearAnalisisMutation.mutateAsync(data as CreateAnalisisInput);
    }
    setModalOpen(false);
    setAnalisisSeleccionado(null);
  };

  const columns: ColumnsType<Analisis> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => (
        <Space>
          <ExperimentOutlined />
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion: string) => descripcion || <Text type="secondary">-</Text>,
    },
    {
      title: 'Sinonimia',
      dataIndex: 'sinonimia',
      key: 'sinonimia',
      width: 250,
      render: (sinonimia: string[]) => (
        <div>
          {sinonimia && sinonimia.length > 0 ? (
            sinonimia.slice(0, 3).map((sin, idx) => (
              <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                {sin}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Sin sinónimos</Text>
          )}
          {sinonimia && sinonimia.length > 3 && (
            <Tooltip title={sinonimia.slice(3).join(', ')}>
              <Tag color="blue">+{sinonimia.length - 3}</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },

    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Analisis) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
        />
      ),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      align: 'center',
      render: (_, record: Analisis) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditar(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEliminar(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>Análisis Clínicos</Title>
            <Text type="secondary">Gestión de análisis y sus componentes</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Análisis
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Buscar por nombre o sinónimos..."
              prefix={<SearchOutlined />}
              allowClear
              value={filtros.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          dataSource={analisis || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} análisis`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <AnalisisFormModal
        open={modalOpen}
        analisis={analisisSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setAnalisisSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearAnalisisMutation.isPending || actualizarAnalisisMutation.isPending}
      />
    </div>
  );
};
