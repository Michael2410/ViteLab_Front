import React, { useState, useRef, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
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
import { useAuthStore } from '../../../auth/hooks';
import { AreaFormModal } from '../components/AreaFormModal';
import type { Area, CreateAreaInput, UpdateAreaInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandButtonStyle, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

interface AreasPageProps {
  isTab?: boolean;
  createTrigger?: number;
}

export const AreasPage = ({ isTab = false, createTrigger }: AreasPageProps) => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

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
      render: (nombre: string) => <Text strong>{nombre}</Text>,
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
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.areas.delete') && (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleEliminar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
        </Space>
      ),
    },
  ];

  const content = (
    <>
      {isTab && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
          }}
        >
          <Input
            placeholder="Buscar por código o nombre de área..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{areasFiltradas?.length ?? 0}</strong>
          </Text>
        </div>
      )}

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
    </>
  );

  if (isTab) {
    return <div style={{ paddingTop: 8 }}>{content}</div>;
  }

  return (
    <ModulePageLayout
      title="Áreas de Laboratorio"
      subtitle="Gestión y clasificación de áreas técnicas para análisis clínicos"
      actionButton={
        hasPermission('catalogs.areas.create') && (
          <BrandCreateButton onClick={handleNuevo}>
            Nueva Área
          </BrandCreateButton>
        )
      }
      filters={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Input
            placeholder="Buscar por código o nombre de área..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{areasFiltradas?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};

