import React, { useMemo } from 'react';
import { Modal, Button, Tag, Spin } from 'antd';
import { PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { DocumentoLaboralItem } from '../../types';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';
import { personalDocumentosApi } from '../../api';
import { imprimirDocumentoLaboralA4 } from '../utils/printDocumentoLaboralHelper';
import defaultLogo from '../../../../assets/logo/logo.png';

dayjs.locale('es');

interface VistaPreviaDocumentoModalProps {
  open: boolean;
  onClose: () => void;
  documento: DocumentoLaboralItem | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
];

function fechaEspanolFormal(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const d = dayjs(fechaStr);
  if (!d.isValid()) return fechaStr;
  const dia = d.date();
  const mes = MESES[d.month()];
  const anio = d.year();
  return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del ${anio}`;
}

export const VistaPreviaDocumentoModal: React.FC<VistaPreviaDocumentoModalProps> = ({
  open,
  onClose,
  documento,
}) => {
  const { data: configuracion } = useConfiguracion();

  // Consultar datos enriquecidos si están disponibles
  const { data: enrichedData, isLoading: loadingDetails } = useQuery({
    queryKey: ['personal', 'documentos', 'detail', documento?.id],
    queryFn: () => personalDocumentosApi.getById(documento!.id),
    enabled: !!documento?.id && open,
  });

  const logoSrc = useMemo(() => {
    return getImageUrl(configuracion?.logo_principal) || defaultLogo;
  }, [configuracion]);

  const cuerpoTexto = enrichedData?.contenido_renderizado || documento?.contenido_renderizado || '';

  // Parsear texto del cuerpo a párrafos con negritas (Hook incondicional)
  const parrafos = useMemo(() => {
    if (!cuerpoTexto) return [];
    return cuerpoTexto.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
  }, [cuerpoTexto]);

  if (!documento) return null;

  const handlePrint = () => {
    imprimirDocumentoLaboralA4(documento, configuracion, enrichedData);
  };

  const titulo = enrichedData?.titulo_documento || (
    documento.tipo_documento === 'CONSTANCIA_TRABAJO'
      ? 'CONSTANCIA DE TRABAJO'
      : documento.tipo_documento === 'CERTIFICADO_LABORAL'
      ? 'CERTIFICADO DE TRABAJO'
      : 'CARTA DE PRESENTACIÓN'
  );

  const renderParrafo = (txt: string) => {
    // Reemplazar **negrita** con <strong>
    const parts = txt.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const firmanteNombre = enrichedData?.firmante_nombre || documento.firmante_nombre || 'DIRECCIÓN DE GESTIÓN HUMANA';
  const firmanteCargo = enrichedData?.firmante_cargo || documento.firmante_cargo || 'JEFE DE RECURSOS HUMANOS';
  const firmanteFirmaUrl = enrichedData?.firmante_firma_url || documento.firmante_firma_url || null;
  const empresaRazonSocial = configuracion?.empresa_razon_social || configuracion?.empresa_nombre || 'VITELAB LABORATORIO CLÍNICO S.A.C.';
  const empresaRuc = configuracion?.empresa_ruc || '20608945123';
  const empresaDireccion = configuracion?.empresa_direccion || 'Av. Principal 123 - Lima, Perú';
  const ciudadEmision = enrichedData?.ciudad_defecto || 'LIMA';
  // Fecha dinámica según la fecha actual del sistema
  const fechaFormal = fechaEspanolFormal(dayjs().format('YYYY-MM-DD'));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={780}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#0d9488', fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
              Vista Previa de Documento Laboral
            </span>
          </div>
          <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>
            {documento.codigo_emision}
          </Tag>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', fontWeight: 600 }}
        >
          Imprimir / Descargar PDF (A4)
        </Button>,
      ]}
    >
      <Spin spinning={loadingDetails}>
        <div
          style={{
            maxHeight: '75vh',
            overflowY: 'auto',
            backgroundColor: '#64748b22',
            padding: '24px 16px',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Hoja A4 Simulada */}
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              minHeight: 960,
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderRadius: 4,
              padding: '48px 64px 44px 64px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000000',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <div>
              {/* Cabecera Membrete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <img
                    src={logoSrc}
                    alt="Logo"
                    style={{ maxHeight: 54, maxWidth: 200, objectFit: 'contain' }}
                  />
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#64748b' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{documento.codigo_emision}</div>
                </div>
              </div>

              {/* Título Central */}
              <div style={{ textAlign: 'center', marginTop: 65, marginBottom: 45 }}>
                <h1
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    textDecoration: 'underline',
                    letterSpacing: 1.5,
                    color: '#000000',
                    textTransform: 'uppercase',
                    margin: 0,
                    display: 'inline-block',
                  }}
                >
                  {titulo}
                </h1>
              </div>

              {/* Cuerpo del Documento */}
              <div
                style={{
                  fontSize: 14,
                  textAlign: 'justify',
                  lineHeight: 2.0,
                  color: '#000000',
                }}
              >
                {parrafos.length > 0 ? (
                  parrafos.map((p: string, idx: number) => (
                    <p key={idx} style={{ marginBottom: 32 }}>
                      {renderParrafo(p)}
                    </p>
                  ))
                ) : (
                  <p style={{ marginBottom: 32 }}>
                    Por medio del presente documento, la Dirección de Gestión del Talento Humano de{' '}
                    <strong>{empresaRazonSocial}</strong> hace constar que{' '}
                    <strong>{documento.colaborador_nombre.toUpperCase()}</strong>, identificado(a) con{' '}
                    {documento.colaborador_documento}, labora en nuestra organización desempeñando el cargo de{' '}
                    <strong>{documento.cargo_consignado.toUpperCase()}</strong>.
                  </p>
                )}

                {enrichedData?.parrafo_cierre ? (
                  <p style={{ marginBottom: 32 }}>
                    {renderParrafo(enrichedData.parrafo_cierre)}
                  </p>
                ) : (
                  <p style={{ marginBottom: 32 }}>
                    Extendemos el presente certificado a solicitud del interesado para los fines que estime conveniente.
                  </p>
                )}

                {documento.observaciones && (
                  <p style={{ marginTop: '1em', fontStyle: 'italic', color: '#475569', fontSize: 13 }}>
                    Nota: {documento.observaciones}
                  </p>
                )}
              </div>

              {/* Fecha alineada a la izquierda en mayúsculas como en el formato legal */}
              <div
                style={{
                  marginTop: 50,
                  marginBottom: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#000000',
                  textAlign: 'left',
                }}
              >
                {ciudadEmision.toUpperCase()}, {fechaFormal}
              </div>

              {/* Bloque de Firma y Datos de la Empresa alineados a la izquierda según el ejemplo */}
              <div
                style={{
                  marginTop: 90,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                {firmanteFirmaUrl ? (
                  <img
                    src={getImageUrl(firmanteFirmaUrl) || ''}
                    alt="Firma del firmante"
                    style={{ maxHeight: 65, maxWidth: 180, objectFit: 'contain', marginBottom: -10, marginLeft: 10 }}
                  />
                ) : (
                  <div style={{ height: 35 }} />
                )}
                <div style={{ width: 270, borderTop: '1.2px solid #000000', marginBottom: 8 }} />
                <div
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#000000',
                  }}
                >
                  {firmanteNombre}
                </div>
                <div
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 11.5,
                    textTransform: 'uppercase',
                    color: '#000000',
                    marginTop: 2,
                    marginBottom: 12,
                  }}
                >
                  {firmanteCargo}
                </div>
                <div
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    color: '#000000',
                    lineHeight: 1.45,
                  }}
                >
                  <div>{empresaRazonSocial}</div>
                  {empresaDireccion && <div>{empresaDireccion.toUpperCase()}</div>}
                  <div>RUC: {empresaRuc}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};
