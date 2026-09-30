import { useState } from 'react';
import {
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSedes, useCrearSede, useActualizarSede, useEliminarSede } from '../hooks';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { SedeFormModal } from '../components/SedeFormModal';
import type { Sede, CreateSedeInput, UpdateSedeInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

export const SedesPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<Sede | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('catalogs.sedes.create');
  const canUpdate = hasPermission('catalogs.sedes.update');
  const canDelete = hasPermission('catalogs.sedes.delete');

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
    if (!canUpdate) return;
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
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (activo: boolean, record: Sede) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canUpdate}
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
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: Sede) => (
              <Space size="small">
                {canUpdate && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ color: '#0284c7' }} />}
                    onClick={() => handleEditar(record)}
                    style={{ borderRadius: 6 }}
                  />
                )}
                {canDelete && (
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
        ]
      : []),
  ];

  return (
    <ModulePageLayout
      title="Sedes del Laboratorio"
      subtitle="Gestión de locales, centros de toma de muestras y sucursales operativas"
      actionButton={
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar sede o dirección..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          {canCreate && (
            <BrandCreateButton onClick={handleNuevo}>
              Nueva Sede
            </BrandCreateButton>
          )}
        </Space>
      }
    >
      <GlobalTable<Sede>
        resourceName="configuracion-sedes"
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
    </ModulePageLayout>
  );

};
