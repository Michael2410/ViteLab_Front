import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Typography,
  type TableProps,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PrinterOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, brandControlStyle } from '../../../../shared/components/ModulePageLayout';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import {
  useDocumentosLaboralesList,
  useGenerarDocumentoLaboral,
  usePersonalList,
} from '../../hooks';
import type { DocumentoLaboralItem } from '../../types';
import { GenerarDocumentoModal } from '../components/GenerarDocumentoModal';
import { VistaPreviaDocumentoModal } from '../components/VistaPreviaDocumentoModal';

const { Text } = Typography;

export default function DocumentosPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('personal.documentos.create');

  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [search, setSearch] = useState('');

  const [modalGenerarOpen, setModalGenerarOpen] = useState(false);
  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoLaboralItem | null>(null);

  const { data: documentos = [], isLoading } = useDocumentosLaboralesList();
  const { data: personalList = [] } = usePersonalList({ activo: true });
  const generarMutation = useGenerarDocumentoLaboral();

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((d) => {
      const matchTipo = tipoFilter === 'TODOS' || d.tipo_documento === tipoFilter;
      const matchSearch =
        !search ||
        d.colaborador_nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.codigo_emision.toLowerCase().includes(search.toLowerCase());
      return matchTipo && matchSearch;
    });
  }, [documentos, tipoFilter, search]);

  const handleGenerar = async (data: any, colabInfo: any) => {
    await generarMutation.mutateAsync({
      data,
      colaborador: colabInfo,
    });
    setModalGenerarOpen(false);
  };

  const handleVerDocumento = (doc: DocumentoLaboralItem) => {
    setDocumentoSeleccionado(doc);
    setModalVistaOpen(true);
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

  const columns: TableProps<DocumentoLaboralItem>['columns'] = [
    {
      title: 'Código / Emisión',
      key: 'codigo',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.codigo_emision}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {dayjs(r.fecha_emision).format('DD/MM/YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Colaborador',
      key: 'colab',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.colaborador_nombre}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {r.cargo_consignado} • Doc: {r.colaborador_documento}
          </div>
        </div>
      ),
    },
    {
      title: 'Tipo de Documento',
      dataIndex: 'tipo_documento',
      key: 'tipo',
      render: (t) => getTipoTag(t),
    },
    {
      title: 'Destinatario',
      dataIndex: 'destinatario',
      key: 'destinatario',
      render: (d) => <span style={{ fontSize: 12, color: '#475569' }}>{d || 'A quien corresponda'}</span>,
    },
    {
      title: 'Remuneración',
      key: 'remu',
      align: 'right',
      render: (_, r) =>
        r.remuneracion_consignada ? (
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            S/ {Number(r.remuneracion_consignada).toFixed(2)}
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>No consignada</span>
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 130,
      render: (_, r) => (
        <Space size={6}>
          <Button
            size="small"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => handleVerDocumento(r)}
            style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', borderRadius: 6 }}
          >
            Imprimir
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleVerDocumento(r)}
            style={{ borderRadius: 6 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span>Documentos & Constancias Laborales</span>
        </span>
      }
      subtitle="Emisión oficial y registro de constancias de trabajo, certificados de servicios y cartas institucionales con membrete"
      wrapInTableCard={false}
      actionButton={
        canCreate ? (
          <BrandCreateButton onClick={() => setModalGenerarOpen(true)}>
            Generar Documento
          </BrandCreateButton>
        ) : undefined
      }
      filters={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="Buscar por código o colaborador..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 280, ...brandSearchStyle }}
            />

            <Select
              value={tipoFilter}
              onChange={(v) => setTipoFilter(v)}
              style={{ width: 220, ...brandControlStyle }}
              options={[
                { label: 'Todos los tipos', value: 'TODOS' },
                { label: 'Constancias de Trabajo', value: 'CONSTANCIA_TRABAJO' },
                { label: 'Certificados Laborales', value: 'CERTIFICADO_LABORAL' },
                { label: 'Cartas de Presentación', value: 'CARTA_PRESENTACION' },
              ]}
            />
          </div>

          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{documentosFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >

      {/* Tabla Libre */}
      <Table
        columns={columns}
        dataSource={documentosFiltrados}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: 'No hay documentos laborales emitidos' }}
      />

      {/* Modal Generar */}
      <GenerarDocumentoModal
        open={modalGenerarOpen}
        onClose={() => setModalGenerarOpen(false)}
        onSubmit={handleGenerar}
        loading={generarMutation.isPending}
        personalList={personalList}
      />

      {/* Modal Vista Previa / Impresión */}
      <VistaPreviaDocumentoModal
        open={modalVistaOpen}
        onClose={() => {
          setModalVistaOpen(false);
          setDocumentoSeleccionado(null);
        }}
        documento={documentoSeleccionado}
      />
    </ModulePageLayout>
  );
}
