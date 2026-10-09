import React, { useState } from 'react';
import {
  Tag,
  Space,
  Button,
  Tooltip,
  Popconfirm,
  App,
  type TableProps,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { ModulePageLayout, BrandCreateButton } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import {
  usePlantillas,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
} from '../hooks';
import type { PlantillaDocumento, CrearPlantillaDTO, ActualizarPlantillaDTO } from '../plantillas.types';
import { PlantillaModal } from '../components/PlantillaModal';

export const PlantillasDocumentosPage: React.FC = () => {
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaDocumento | null>(null);

  const { data: plantillas = [], isLoading } = usePlantillas();
  const crearMutation = useCrearPlantilla();
  const actualizarMutation = useActualizarPlantilla();
  const eliminarMutation = useEliminarPlantilla();

  const handleCrear = () => {
    setPlantillaSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (p: PlantillaDocumento) => {
    setPlantillaSeleccionada(p);
    setModalOpen(true);
  };

  const handleSubmit = async (data: CrearPlantillaDTO | ActualizarPlantillaDTO) => {
    try {
      if (plantillaSeleccionada) {
        await actualizarMutation.mutateAsync({
          id: plantillaSeleccionada.id,
          data: data as ActualizarPlantillaDTO,
        });
        message.success('Plantilla actualizada exitosamente');
      } else {
        await crearMutation.mutateAsync(data as CrearPlantillaDTO);
        message.success('Plantilla creada exitosamente');
      }
      setModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al guardar plantilla');
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarMutation.mutateAsync(id);
      message.success('Plantilla eliminada exitosamente');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al eliminar plantilla');
    }
  };

  const getTipoTag = (tipo: string) => {
    switch (tipo) {
      case 'CONSTANCIA_TRABAJO':
        return <Tag color="blue">Constancia de Trabajo</Tag>;
      case 'CERTIFICADO_LABORAL':
        return <Tag color="green">Certificado Laboral</Tag>;
      case 'CARTA_PRESENTACION':
        return <Tag color="purple">Carta de Presentación</Tag>;
      default:
        return <Tag color="default">{tipo}</Tag>;
    }
  };

  const columns: TableProps<PlantillaDocumento>['columns'] = [
    {
      title: 'Tipo de Documento',
      dataIndex: 'tipo_documento',
      key: 'tipo',
      width: 190,
      render: (tipo: string) => getTipoTag(tipo),
    },
    {
      title: 'Nombre de la Plantilla',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (n: string, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{n}</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>
            Título en hoja: <strong style={{ color: '#0369a1' }}>{r.titulo_documento}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Firmante de RRHH',
      key: 'firmante',
      width: 220,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>
            {r.firmante_nombre || <span style={{ color: '#94a3b8' }}>Sin firmante específico</span>}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.firmante_cargo || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Logo',
      dataIndex: 'mostrar_logo',
      key: 'logo',
      width: 110,
      align: 'center',
      render: (m) => (m !== false ? <Tag color="cyan">Con Logo</Tag> : <Tag color="default">Sin Logo</Tag>),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 100,
      align: 'center',
      render: (activo) =>
        activo ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Activo
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            Inactivo
          </Tag>
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar Plantilla">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
            />
          </Tooltip>

          <Popconfirm
            title="¿Eliminar plantilla?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleEliminar(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar Plantilla">
              <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ef4444' }} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Plantillas de Documentos Laborales"
      subtitle="Configuración de formatos, textos dinámicos, títulos y firmantes para constancias y certificados de RRHH."
      actionButton={
        <BrandCreateButton onClick={handleCrear}>
          Nueva Plantilla
        </BrandCreateButton>
      }
    >
      <GlobalTable<PlantillaDocumento>
        resourceName="plantillas-documentos"
        rowKey="id"
        columns={columns}
        dataSource={plantillas}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'No hay plantillas de documentos registradas' }}
      />

      <PlantillaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        plantilla={plantillaSeleccionada}
        loading={crearMutation.isPending || actualizarMutation.isPending}
      />
    </ModulePageLayout>
  );
};

export default PlantillasDocumentosPage;
