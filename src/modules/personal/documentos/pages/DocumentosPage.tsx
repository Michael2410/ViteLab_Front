import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Tag,
  Space,
  Input,
  Tooltip,
  type TableProps,
} from 'antd';
import {
  SearchOutlined,
  PrinterOutlined,
  EyeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import {
  useDocumentosLaboralesList,
  useGenerarDocumentoLaboral,
  usePersonalList,
} from '../../hooks';
import { personalDocumentosApi } from '../../api';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';
import { imprimirDocumentoLaboralA4 } from '../utils/printDocumentoLaboralHelper';
import type { DocumentoLaboralItem } from '../../types';
import { GenerarDocumentoModal } from '../components/GenerarDocumentoModal';
import { VistaPreviaDocumentoModal } from '../components/VistaPreviaDocumentoModal';

export default function DocumentosPage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = hasPermission('personal.documentos.create');
  const canManagePlantillas = isSuperAdmin || hasPermission('configuracion.plantillas.read') || hasPermission('settings.read');

  const [tipoFilter, setTipoFilter] = useState<string[] | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [printingId, setPrintingId] = useState<number | null>(null);

  const [modalGenerarOpen, setModalGenerarOpen] = useState(false);
  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoLaboralItem | null>(null);

  const { data: configuracion } = useConfiguracion();
  const { data: documentos = [], isLoading } = useDocumentosLaboralesList();
  const { data: personalList = [] } = usePersonalList({ activo: true });
  const generarMutation = useGenerarDocumentoLaboral();

  const handleImprimirDirecto = async (doc: DocumentoLaboralItem) => {
    try {
      setPrintingId(doc.id);
      const fullDoc = await personalDocumentosApi.getById(doc.id);
      imprimirDocumentoLaboralA4(doc, configuracion, fullDoc);
    } catch (err) {
      imprimirDocumentoLaboralA4(doc, configuracion);
    } finally {
      setPrintingId(null);
    }
  };

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((d) => {
      const matchTipo = !tipoFilter || tipoFilter.length === 0 || tipoFilter.includes(d.tipo_documento);
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
      filters: [
        { text: 'Constancias de Trabajo', value: 'CONSTANCIA_TRABAJO' },
        { text: 'Certificados Laborales', value: 'CERTIFICADO_LABORAL' },
        { text: 'Cartas de Presentación', value: 'CARTA_PRESENTACION' },
      ],
      filteredValue: tipoFilter && tipoFilter.length > 0 ? tipoFilter : null,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
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
            loading={printingId === r.id}
            onClick={() => handleImprimirDirecto(r)}
            style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', borderRadius: 6 }}
          >
            Imprimir
          </Button>
          <Tooltip title="Ver Detalle y Vista Previa">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleVerDocumento(r)}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
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
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar por código o colaborador..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 280, ...brandSearchStyle }}
          />
          {canManagePlantillas && (
            <Button
              icon={<SettingOutlined />}
              onClick={() => navigate('/configuracion/plantillas-documentos')}
              style={{
                borderRadius: 8,
                fontWeight: 500,
                color: '#475569',
                borderColor: '#cbd5e1',
              }}
            >
              Configurar Plantillas
            </Button>
          )}
          {canCreate && (
            <BrandCreateButton onClick={() => setModalGenerarOpen(true)}>
              Generar Documento
            </BrandCreateButton>
          )}
        </Space>
      }
    >
      {/* Tabla Libre */}
      <GlobalTable<DocumentoLaboralItem>
        resourceName="personal-documentos"
        columns={columns}
        dataSource={documentosFiltrados}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: 'No hay documentos laborales emitidos' }}
        onChange={(_pagination, tableFilters) => {
          const t = tableFilters.tipo;
          setTipoFilter(t && t.length > 0 ? (t as string[]) : undefined);
        }}
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
