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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSedes, useCrearSede, useActualizarSede, useEliminarSede } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { SedeFormModal } from '../components/SedeFormModal';
import type { Sede, CreateSedeInput, UpdateSedeInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const SedesPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<Sede | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: sedes, isLoading } = useSedes({});
  const crearSedeMutation = useCrearSede();
  const actualizarSedeMutation = useActualizarSede();
  const eliminarSedeMutation = useEliminarSede();

  // Filtrado local
  const sedesFiltradas = sedes?.filter((sede) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      sede.nombre.toLowerCase().includes(search) ||
      (sede.direccion && sede.direccion.toLowerCase().includes(search))
    );
  });

  const handleNuevo = () => {
    setSedeSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (sede: Sede) => {
    setSedeSeleccionada(sede);
    setModalOpen(true);
  };

  const handleEliminar = (sede: Sede) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta sede?',
      content: `Se eliminará la sede "${sede.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarSedeMutation.mutateAsync(sede.id);
      },
    });
  };

  const handleToggleActivo = async (sede: Sede) => {
    if (!hasPermission('catalogs.sedes.update')) return;
    await actualizarSedeMutation.mutateAsync({
      id: sede.id,
      data: { activo: !sede.activo },
    });
  };

  const handleSubmitForm = async (data: CreateSedeInput | UpdateSedeInput) => {
    if (sedeSeleccionada) {
      await actualizarSedeMutation.mutateAsync({
        id: sedeSeleccionada.id,
        data: data as UpdateSedeInput,
      });
    } else {
      await crearSedeMutation.mutateAsync(data as CreateSedeInput);
    }
    setModalOpen(false);
    setSedeSeleccionada(null);
  };

  const columns: ColumnsType<Sede> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 250,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
      ellipsis: true,
      render: (direccion: string) => 
        direccion ? (
          <Space>
            <EnvironmentOutlined />
            <Text>{direccion}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 150,
      render: (telefono: string) => 
        telefono ? (
          <Space>
            <PhoneOutlined />
            <Text>{telefono}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Sede) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.sedes.update')}
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
      render: (_, record: Sede) => (
        <Space size="small">
          {hasPermission('catalogs.sedes.update') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          )}
          {hasPermission('catalogs.sedes.delete') && (
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

    {/* 🔵 Header con título + buscador + botón */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>Sedes del Laboratorio</Title>
        <Text type="secondary">Gestión de sedes y sucursales del laboratorio</Text>
      </div>

      {/* Buscador + botón (alineados a la derecha) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input
          placeholder="Buscar por nombre..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
        />

        {hasPermission('catalogs.sedes.create') && (
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleNuevo}
          >
            Nueva Sede
          </Button>
        )}
      </div>
    </div>
    {/* 🔵 Tabla */}
      <Table
        columns={columns}
        dataSource={sedesFiltradas || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} sedes`,
        }}
      />
    {/* Modal */}
    <SedeFormModal
      open={modalOpen}
      sede={sedeSeleccionada}
      onCancel={() => {
        setModalOpen(false);
        setSedeSeleccionada(null);
      }}
      onSubmit={handleSubmitForm}
      loading={crearSedeMutation.isPending || actualizarSedeMutation.isPending}
    />
  </PageContainer>
);

};
