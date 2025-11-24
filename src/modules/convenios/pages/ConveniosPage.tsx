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
  MailOutlined,
  IdcardOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useConvenios, useCrearConvenio, useActualizarConvenio, useEliminarConvenio } from '../hooks';
import { ConvenioFormModal } from '../components/ConvenioFormModal';
import type { Convenio, ConvenioFilters, CreateConvenioInput, UpdateConvenioInput } from '../types';

const { Title, Text } = Typography;

export const ConveniosPage: React.FC = () => {
  const [filtros, setFiltros] = useState<ConvenioFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<Convenio | null>(null);

  const { data: convenios, isLoading } = useConvenios(filtros);
  const crearConvenioMutation = useCrearConvenio();
  const actualizarConvenioMutation = useActualizarConvenio();
  const eliminarConvenioMutation = useEliminarConvenio();

  const handleFiltroChange = (key: keyof ConvenioFilters, value: any) => {
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 8 }}>Convenios Empresariales</Title>
          <Text type="secondary">Gestión de convenios con empresas y sus tarifarios</Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Convenio
          </Button>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Buscar por empresa o RUC..."
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
          dataSource={convenios || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} convenios`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <ConvenioFormModal
        open={modalOpen}
        convenio={convenioSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setConvenioSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearConvenioMutation.isPending || actualizarConvenioMutation.isPending}
      />
    </div>
  );
};
