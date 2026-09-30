import { useState, useRef, useEffect } from 'react';
import {
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
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface AnalisisPageProps {
  isTab?: boolean;
  createTrigger?: number;
  externalSearch?: string;
}

export const AnalisisPage = ({ isTab = false, createTrigger, externalSearch }: AnalisisPageProps) => {
  const [internalSearchText, setInternalSearchText] = useState('');
  const searchText = isTab && externalSearch !== undefined ? externalSearch : internalSearchText;
  const setSearchText = setInternalSearchText;
  const [modalOpen, setModalOpen] = useState(false);
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState<Analisis | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

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
      width: 130,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Analisis) => record.activo === value,
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

  const content = (
    <div style={{ paddingTop: isTab ? 4 : 0 }}>
      <GlobalTable
        columns={columns}
        dataSource={analisisFiltrados || []}
        loading={isLoading}
        resourceName="análisis"
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
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <ModulePageLayout
      title="Análisis Clínicos"
      subtitle="Gestión de pruebas, catálogo maestro de exámenes y componentes asociados"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por nombre o sinónimos..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          {hasPermission('catalogs.analysis.create') && (
            <BrandCreateButton onClick={handleNuevo}>
              Nuevo Análisis
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};
