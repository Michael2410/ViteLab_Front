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
import { useMetodos, useCrearMetodo, useActualizarMetodo, useEliminarMetodo } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { MetodoFormModal } from '../components/MetodoFormModal';
import type { Metodo, CreateMetodoInput, UpdateMetodoInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface MetodosPageProps {
  isTab?: boolean;
  createTrigger?: number;
  externalSearch?: string;
}

export const MetodosPage = ({ isTab = false, createTrigger, externalSearch }: MetodosPageProps) => {
  const [internalSearchText, setInternalSearchText] = useState('');
  const searchText = isTab && externalSearch !== undefined ? externalSearch : internalSearchText;
  const setSearchText = setInternalSearchText;
  const [modalOpen, setModalOpen] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<Metodo | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

  const { hasPermission } = useAuthStore();
  const { data: metodos, isLoading } = useMetodos({});
  const crearMetodoMutation = useCrearMetodo();
  const actualizarMetodoMutation = useActualizarMetodo();
  const eliminarMetodoMutation = useEliminarMetodo();

  // Filtrado local
  const metodosFiltrados = metodos?.filter((metodo) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      metodo.nombre.toLowerCase().includes(search) ||
      (metodo.descripcion && metodo.descripcion.toLowerCase().includes(search))
    );
  });

  const handleNuevo = () => {
    setMetodoSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (metodo: Metodo) => {
    setMetodoSeleccionado(metodo);
    setModalOpen(true);
  };

  const handleEliminar = (metodo: Metodo) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este método?',
      content: `Se eliminará el método "${metodo.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarMetodoMutation.mutateAsync(metodo.id);
      },
    });
  };

  const handleToggleActivo = async (metodo: Metodo) => {
    if (!hasPermission('catalogs.methods.update')) return;
    await actualizarMetodoMutation.mutateAsync({
      id: metodo.id,
      data: { activo: !metodo.activo },
    });
  };

  const handleSubmitForm = async (data: CreateMetodoInput | UpdateMetodoInput) => {
    if (metodoSeleccionado) {
      await actualizarMetodoMutation.mutateAsync({
        id: metodoSeleccionado.id,
        data: data as UpdateMetodoInput,
      });
    } else {
      await crearMetodoMutation.mutateAsync(data as CreateMetodoInput);
    }
    setModalOpen(false);
    setMetodoSeleccionado(null);
  };

  const columns: ColumnsType<Metodo> = [
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
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Metodo) => record.activo === value,
      render: (activo: boolean, record: Metodo) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.methods.update')}
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
      render: (_, record: Metodo) => (
        <Space size="small">
          {hasPermission('catalogs.methods.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.methods.delete') && (
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
        dataSource={metodosFiltrados || []}
        loading={isLoading}
        resourceName="métodos"
      />

      {/* Modal */}
      <MetodoFormModal
        open={modalOpen}
        metodo={metodoSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setMetodoSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearMetodoMutation.isPending || actualizarMetodoMutation.isPending}
      />
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <ModulePageLayout
      title="Métodos de Análisis"
      subtitle="Gestión y estandarización de técnicas y metodologías analíticas"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por método o técnica..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          {hasPermission('catalogs.methods.create') && (
            <BrandCreateButton onClick={handleNuevo}>
              Nuevo Método
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};

