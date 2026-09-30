import { useState, useRef, useEffect } from 'react';
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useTiposCliente,
  useCrearTipoCliente,
  useActualizarTipoCliente,
  useEliminarTipoCliente
} from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { TipoClienteFormModal } from '../components/TipoClienteFormModal';
import type { TipoCliente, CreateTipoClienteInput, UpdateTipoClienteInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface TiposClientePageProps {
  isTab?: boolean;
  createTrigger?: number;
  externalSearch?: string;
}

export const TiposClientePage = ({ isTab = false, createTrigger, externalSearch }: TiposClientePageProps) => {
  const [internalSearchText, setInternalSearchText] = useState('');
  const searchText = isTab && externalSearch !== undefined ? externalSearch : internalSearchText;
  const setSearchText = setInternalSearchText;
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<TipoCliente | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

  const { hasPermission } = useAuthStore();
  const { data: tiposCliente, isLoading } = useTiposCliente({});
  const crearTipoClienteMutation = useCrearTipoCliente();
  const actualizarTipoClienteMutation = useActualizarTipoCliente();
  const eliminarTipoClienteMutation = useEliminarTipoCliente();

  // Filtrado local
  const tiposClienteFiltrados = tiposCliente?.filter((tc) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return tc.nombre.toLowerCase().includes(search);
  });

  const handleNuevo = () => {
    setTipoClienteSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (tipoCliente: TipoCliente) => {
    setTipoClienteSeleccionado(tipoCliente);
    setModalOpen(true);
  };

  const handleEliminar = (tipoCliente: TipoCliente) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este tipo de cliente?',
      content: `Se eliminará el tipo "${tipoCliente.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarTipoClienteMutation.mutateAsync(tipoCliente.id);
      },
    });
  };

  const handleToggleActivo = async (tipoCliente: TipoCliente) => {
    if (!hasPermission('catalogs.tipos-cliente.update')) return;
    await actualizarTipoClienteMutation.mutateAsync({
      id: tipoCliente.id,
      data: { activo: !tipoCliente.activo },
    });
  };

  const handleSubmitForm = async (data: CreateTipoClienteInput | UpdateTipoClienteInput) => {
    if (tipoClienteSeleccionado) {
      await actualizarTipoClienteMutation.mutateAsync({
        id: tipoClienteSeleccionado.id,
        data: data as UpdateTipoClienteInput,
      });
    } else {
      await crearTipoClienteMutation.mutateAsync(data as CreateTipoClienteInput);
    }
    setModalOpen(false);
    setTipoClienteSeleccionado(null);
  };

  const columns: ColumnsType<TipoCliente> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record) => record.activo === value,
      render: (activo: boolean, record: TipoCliente) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.tipos-cliente.update')}
        />
      ),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      align: 'center',
      render: (_, record: TipoCliente) => (
        <Space size="small">
          {hasPermission('catalogs.tipos-cliente.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.tipos-cliente.delete') && (
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
    <div style={{ paddingTop: isTab ? 4 : 0 }}>
      <GlobalTable
        columns={columns}
        dataSource={tiposClienteFiltrados || []}
        loading={isLoading}
        resourceName="tipos de cliente"
      />

      <TipoClienteFormModal
        open={modalOpen}
        tipoCliente={tipoClienteSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setTipoClienteSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearTipoClienteMutation.isPending || actualizarTipoClienteMutation.isPending}
      />
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <ModulePageLayout
      title="Tipos de Cliente"
      subtitle="Clasificación comercial y tarifaria de clientes (Particular, Convenios, Empresas)"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por tipo de cliente..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, ...brandSearchStyle }}
          />
          {hasPermission('catalogs.tipos-cliente.create') && (
            <BrandCreateButton onClick={handleNuevo}>
              Nuevo Tipo
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};

