import { useState, useRef, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
  Tag,
  Avatar,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  DollarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useConvenios, useCrearConvenio, useActualizarConvenio, useEliminarConvenio } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { ConvenioFormModal } from '../components/ConvenioFormModal';
import type { Convenio, CreateConvenioInput, UpdateConvenioInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

interface ConveniosPageProps {
  isTab?: boolean;
  createTrigger?: number;
}

export const ConveniosPage = ({ isTab = false, createTrigger }: ConveniosPageProps) => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<Convenio | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

  const { hasPermission } = useAuthStore();
  const { data: convenios, isLoading } = useConvenios({});
  const crearConvenioMutation = useCrearConvenio();
  const actualizarConvenioMutation = useActualizarConvenio();
  const eliminarConvenioMutation = useEliminarConvenio();

  // Filtrado local
  const conveniosFiltrados = convenios?.filter((convenio) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      convenio.nombre_empresa.toLowerCase().includes(search) ||
      convenio.ruc.toLowerCase().includes(search)
    );
  });

  const handleNuevo = () => {
    setConvenioSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (convenio: Convenio) => {
    setConvenioSeleccionado(convenio);
    setModalOpen(true);
  };

  const handleEliminar = (convenio: Convenio) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este convenio?',
      content: `Se eliminará el convenio con "${convenio.nombre_empresa}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarConvenioMutation.mutateAsync(convenio.id);
      },
    });
  };

  const handleToggleActivo = async (convenio: Convenio) => {
    if (!hasPermission('catalogs.convenios.update')) return;
    await actualizarConvenioMutation.mutateAsync({
      id: convenio.id,
      data: { activo: !convenio.activo },
    });
  };

  const handleSubmitForm = async (data: CreateConvenioInput | UpdateConvenioInput) => {
    if (convenioSeleccionado) {
      await actualizarConvenioMutation.mutateAsync({
        id: convenioSeleccionado.id,
        data: data as UpdateConvenioInput,
      });
    } else {
      await crearConvenioMutation.mutateAsync(data as CreateConvenioInput);
    }
    setModalOpen(false);
    setConvenioSeleccionado(null);
  };

  const columns: ColumnsType<Convenio> = [
    {
      title: 'Logo',
      dataIndex: 'logo_url',
      key: 'logo_url',
      width: 80,
      align: 'center',
      render: (logo_url: string | null) => (
        logo_url ? (
          <Avatar
            src={logo_url}
            size={40}
            shape="square"
            style={{ border: '1px solid #d9d9d9' }}
          />
        ) : (
          <Avatar
            icon={<BankOutlined />}
            size={40}
            shape="square"
            style={{ backgroundColor: '#1890ff' }}
          />
        )
      ),
    },
    {
      title: 'Empresa',
      dataIndex: 'nombre_empresa',
      key: 'nombre_empresa',
      width: 250,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'RUC',
      dataIndex: 'ruc',
      key: 'ruc',
      width: 130,
      render: (ruc: string) => (
        <Space>
          <IdcardOutlined />
          <Text>{ruc}</Text>
        </Space>
      ),
    },
    {
      title: 'Contacto',
      key: 'contacto',
      width: 200,
      render: (_, record: Convenio) => (
        <div>
          {record.telefono && (
            <div>
              <PhoneOutlined /> <Text>{record.telefono}</Text>
            </div>
          )}
          {record.email && (
            <div>
              <MailOutlined /> <Text ellipsis>{record.email}</Text>
            </div>
          )}
          {!record.telefono && !record.email && <Text type="secondary">-</Text>}
        </div>
      ),
    },
    {
      title: 'Tarifario',
      dataIndex: 'tarifario',
      key: 'tarifario',
      width: 180,
      render: (tarifario: Convenio['tarifario']) =>
        tarifario ? (
          <Tag icon={<DollarOutlined />} color="blue">
            {tarifario.nombre}
          </Tag>
        ) : (
          <Text type="secondary">Sin tarifario</Text>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Convenio) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.convenios.update')}
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
      render: (_, record: Convenio) => (
        <Space size="small">
          {hasPermission('catalogs.convenios.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.convenios.delete') && (
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
            placeholder="Buscar por empresa o RUC..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{conveniosFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={conveniosFiltrados || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} convenios`,
        }}
      />

      {/* Modal */}
      <ConvenioFormModal
        open={modalOpen}
        convenio={convenioSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setConvenioSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={
          crearConvenioMutation.isPending ||
          actualizarConvenioMutation.isPending
        }
      />
    </>
  );

  if (isTab) {
    return <div style={{ paddingTop: 8 }}>{content}</div>;
  }

  return (
    <ModulePageLayout
      title="Convenios Empresariales"
      subtitle="Gestión de acuerdos institucionales, tarifas corporativas y condiciones contractuales"
      actionButton={
        hasPermission('catalogs.convenios.create') && (
          <BrandCreateButton onClick={handleNuevo}>
            Nuevo Convenio
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
            placeholder="Buscar por empresa o RUC..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{conveniosFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};
