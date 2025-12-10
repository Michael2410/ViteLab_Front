import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Input,
  Card,
  Row,
  Col,
  Modal,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAreas, useCrearArea, useActualizarArea, useEliminarArea } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { AreaFormModal } from '../components/AreaFormModal';
import type { Area, CreateAreaInput, UpdateAreaInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const AreasPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: areas, isLoading } = useAreas({});
  const crearAreaMutation = useCrearArea();
  const actualizarAreaMutation = useActualizarArea();
  const eliminarAreaMutation = useEliminarArea();

  // Filtrado local
  const areasFiltradas = areas?.filter((area) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      area.nombre.toLowerCase().includes(search) ||
      (area.descripcion && area.descripcion.toLowerCase().includes(search))
    );
  });

  const handleNuevo = () => {
    setAreaSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (area: Area) => {
    setAreaSeleccionada(area);
    setModalOpen(true);
  };

  const handleEliminar = (area: Area) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta área?',
      content: `Se eliminará el área "${area.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarAreaMutation.mutateAsync(area.id);
      },
    });
  };

  const handleToggleActivo = async (area: Area) => {
    if (!hasPermission('catalogs.areas.update')) return;
    await actualizarAreaMutation.mutateAsync({
      id: area.id,
      data: { activo: !area.activo },
    });
  };

  const handleSubmitForm = async (data: CreateAreaInput | UpdateAreaInput) => {
    if (areaSeleccionada) {
      await actualizarAreaMutation.mutateAsync({
        id: areaSeleccionada.id,
        data: data as UpdateAreaInput,
      });
    } else {
      await crearAreaMutation.mutateAsync(data as CreateAreaInput);
    }
    setModalOpen(false);
    setAreaSeleccionada(null);
  };

  const columns: ColumnsType<Area> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 250,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion: string) => descripcion || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Area) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.areas.update')}
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
      width: 120,
      align: 'center',
      render: (_, record: Area) => (
        <Space size="small">
          {hasPermission('catalogs.areas.update') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          )}
          {hasPermission('catalogs.areas.delete') && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleEliminar(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>

      {/* 🔵 Header con título + buscador + botón, igual a la imagen */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Áreas de Laboratorio</Title>
          <Text type="secondary">Gestión de áreas para clasificación de análisis</Text>
        </div>

        {/* Buscador + Botón juntos en la cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            placeholder="Buscar por código o nombre..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          {hasPermission('catalogs.areas.create') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNuevo}
            >
              Nueva Área
            </Button>
          )}
        </div>
      </div>

      {/* 🔵 Tabla igual a la imagen */}
      
        <Table
          columns={columns}
          dataSource={areasFiltradas || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} áreas`,
          }}
        />
      

      {/* Modal */}
      <AreaFormModal
        open={modalOpen}
        area={areaSeleccionada}
        onCancel={() => {
          setModalOpen(false);
          setAreaSeleccionada(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearAreaMutation.isPending || actualizarAreaMutation.isPending}
      />
    </PageContainer>
  );

};
