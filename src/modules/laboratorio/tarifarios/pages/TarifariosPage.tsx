import { useState, useRef, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTarifarios, useCrearTarifario, useActualizarTarifario, useEliminarTarifario } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { TarifarioFormModal, TarifarioPreciosModal } from '../components';
import type { Tarifario, CreateTarifarioInput, UpdateTarifarioInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

interface TarifariosPageProps {
  isTab?: boolean;
  createTrigger?: number;
}

export const TarifariosPage = ({ isTab = false, createTrigger }: TarifariosPageProps) => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [preciosModalOpen, setPreciosModalOpen] = useState(false);
  const [tarifarioSeleccionado, setTarifarioSeleccionado] = useState<Tarifario | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

  const { hasPermission } = useAuthStore();
  const { data: tarifarios, isLoading } = useTarifarios({});
  const crearTarifarioMutation = useCrearTarifario();
  const actualizarTarifarioMutation = useActualizarTarifario();
  const eliminarTarifarioMutation = useEliminarTarifario();

  // Filtrado local
  const tarifariosFiltrados = tarifarios?.filter((tarifario) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      tarifario.nombre.toLowerCase().includes(search) ||
      (tarifario.descripcion && tarifario.descripcion.toLowerCase().includes(search))
    );
  });

  const handleNuevo = () => {
    setTarifarioSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (tarifario: Tarifario) => {
    setTarifarioSeleccionado(tarifario);
    setModalOpen(true);
  };

  const handleGestionarPrecios = (tarifario: Tarifario) => {
    setTarifarioSeleccionado(tarifario);
    setPreciosModalOpen(true);
  };

  const handleEliminar = (tarifario: Tarifario) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este tarifario?',
      content: `Se eliminará el tarifario "${tarifario.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarTarifarioMutation.mutateAsync(tarifario.id);
      },
    });
  };

  const handleToggleActivo = async (tarifario: Tarifario) => {
    if (!hasPermission('tariffs.update')) return;
    await actualizarTarifarioMutation.mutateAsync({
      id: tarifario.id,
      data: { activo: !tarifario.activo },
    });
  };

  const handleSubmitForm = async (data: CreateTarifarioInput | UpdateTarifarioInput) => {
    if (tarifarioSeleccionado) {
      await actualizarTarifarioMutation.mutateAsync({
        id: tarifarioSeleccionado.id,
        data: data as UpdateTarifarioInput,
      });
    } else {
      await crearTarifarioMutation.mutateAsync(data as CreateTarifarioInput);
    }
    setModalOpen(false);
    setTarifarioSeleccionado(null);
  };

  const columns: ColumnsType<Tarifario> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (descripcion: string | null) => descripcion || <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 150,
      align: 'center',
      render: (activo: boolean, record: Tarifario) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('tariffs.update')}
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
      render: (_, record: Tarifario) => (
        <Space size="small">
          {hasPermission('tariffs.update') && (
            <Tooltip title="Gestionar Precios">
              <Button
                type="primary"
                ghost
                size="small"
                icon={<UnorderedListOutlined />}
                onClick={() => handleGestionarPrecios(record)}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
          {hasPermission('tariffs.update') && (
            <Tooltip title="Editar">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#0284c7' }} />}
                onClick={() => handleEditar(record)}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
          {hasPermission('tariffs.delete') && (
            <Tooltip title="Eliminar">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminar(record)}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (isTab) {
    return (
      <div style={{ paddingTop: 8 }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
          }}
        >
          <Input
            placeholder="Buscar tarifario..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{tarifariosFiltrados?.length ?? 0}</strong>
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={tarifariosFiltrados || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tarifarios`,
          }}
        />

        {/* Modal de formulario */}
        <TarifarioFormModal
          open={modalOpen}
          tarifario={tarifarioSeleccionado}
          onCancel={() => {
            setModalOpen(false);
            setTarifarioSeleccionado(null);
          }}
          onSubmit={handleSubmitForm}
          loading={
            crearTarifarioMutation.isPending ||
            actualizarTarifarioMutation.isPending
          }
        />

        {/* Modal de Precios */}
        {hasPermission('tariffs.update') && (
          <TarifarioPreciosModal
            open={preciosModalOpen}
            tarifarioId={tarifarioSeleccionado?.id || null}
            tarifarioNombre={tarifarioSeleccionado?.nombre || ''}
            onClose={() => {
              setPreciosModalOpen(false);
              setTarifarioSeleccionado(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <ModulePageLayout
      title="Tarifarios"
      subtitle="Gestión de listas de precios, asignación de tarifas y costos por análisis"
      actionButton={
        hasPermission('tariffs.create') && (
          <BrandCreateButton onClick={handleNuevo}>
            Nuevo Tarifario
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
            placeholder="Buscar tarifario..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{tarifariosFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={tarifariosFiltrados || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tarifarios`,
        }}
      />

      {/* Modal de formulario */}
      <TarifarioFormModal
        open={modalOpen}
        tarifario={tarifarioSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setTarifarioSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={
          crearTarifarioMutation.isPending ||
          actualizarTarifarioMutation.isPending
        }
      />

      {/* Modal de Precios */}
      {hasPermission('tariffs.update') && (
        <TarifarioPreciosModal
          open={preciosModalOpen}
          tarifarioId={tarifarioSeleccionado?.id || null}
          tarifarioNombre={tarifarioSeleccionado?.nombre || ''}
          onClose={() => {
            setPreciosModalOpen(false);
            setTarifarioSeleccionado(null);
          }}
        />
      )}
    </ModulePageLayout>
  );

};
