import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useAnalisis,
  useCrearAnalisis,
  useActualizarAnalisis,
  useEliminarAnalisis
} from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { obtenerAnalisisPorId } from '../api';
import { AnalisisFormModal } from '../components/AnalisisFormModal';
import type { Analisis, CreateAnalisisInput, UpdateAnalisisInput } from '../types';
import ModulePageLayout, { brandButtonStyle, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

export const AnalisisPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState<Analisis | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: analisis, isLoading } = useAnalisis({});
  const crearAnalisisMutation = useCrearAnalisis();
  const actualizarAnalisisMutation = useActualizarAnalisis();
  const eliminarAnalisisMutation = useEliminarAnalisis();

  // Filtrado local
  const analisisFiltrados = analisis?.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      item.nombre.toLowerCase().includes(search) ||
      (item.sinonimia && item.sinonimia.some((s) => s.toLowerCase().includes(search)))
    );
  });

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
    if (!hasPermission('catalogs.analysis.update')) return;
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
          disabled={!hasPermission('catalogs.analysis.update')}
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
          {hasPermission('catalogs.analysis.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.analysis.delete') && (
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

  return (
    <ModulePageLayout
      title="Análisis Clínicos"
      subtitle="Gestión de pruebas, catálogo maestro de exámenes y componentes asociados"
      actionButton={
        hasPermission('catalogs.analysis.create') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNuevo}
            style={brandButtonStyle}
          >
            Nuevo Análisis
          </Button>
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
            placeholder="Buscar por nombre o sinónimos..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{analisisFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={analisisFiltrados || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} análisis`,
        }}
      />

      {/* Modal */}
      <AnalisisFormModal
        open={modalOpen}
        analisis={analisisSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setAnalisisSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={
          crearAnalisisMutation.isPending ||
          actualizarAnalisisMutation.isPending
        }
      />
    </ModulePageLayout>
  );
};
