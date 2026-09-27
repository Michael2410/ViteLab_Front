import React from 'react';
import { Modal, Button, Divider } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { DocumentoLaboralItem } from '../../types';
import viteLogo from '../../../../assets/logo/logo.png';

interface VistaPreviaDocumentoModalProps {
  open: boolean;
  onClose: () => void;
  documento: DocumentoLaboralItem | null;
}

export const VistaPreviaDocumentoModal: React.FC<VistaPreviaDocumentoModalProps> = ({
  open,
  onClose,
  documento,
}) => {
  if (!documento) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTitulo = () => {
    switch (documento.tipo_documento) {
      case 'CONSTANCIA_TRABAJO':
        return 'CONSTANCIA DE TRABAJO';
      case 'CERTIFICADO_LABORAL':
        return 'CERTIFICADO DE TRABAJO';
      case 'CARTA_PRESENTACION':
        return 'CARTA DE PRESENTACIÓN';
      default:
        return 'DOCUMENTO LABORAL';
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }}
        >
          Imprimir / Guardar PDF
        </Button>,
      ]}
    >
      <div
        id="print-area"
        style={{
          padding: '24px 32px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'serif',
          lineHeight: 1.8,
        }}
      >
        {/* Cabecera Membretada */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={viteLogo} alt="ViteLab" style={{ height: 44, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0d9488', letterSpacing: 1 }}>
                VITELAB CLÍNICO
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Laboratorio de Diagnóstico Clínico & Anatomía Patológica
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
            <div>RUC: 20608945123</div>
            <div>Código: <strong>{documento.codigo_emision}</strong></div>
          </div>
        </div>

        <Divider style={{ borderColor: '#0d9488', borderWidth: 2, margin: '16px 0 28px' }} />

        {/* Título Central */}
        <div style={{ textAlign: 'center', margin: '30px 0 36px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, textDecoration: 'underline', color: '#0f172a', letterSpacing: 2 }}>
            {getTitulo()}
          </h2>
        </div>

        {/* Cuerpo del Documento */}
        <div style={{ fontSize: 14.5, textAlign: 'justify', color: '#1e293b' }}>
          <p>
            La Dirección de Gestión del Talento Humano de <strong>VITELAB LABORATORIO CLÍNICO S.A.C.</strong>,
            debidamente representada por su Jefatura de Recursos Humanos:
          </p>

          <p style={{ marginTop: 16 }}>
            <strong>HACE CONSTAR QUE:</strong>
          </p>

          <p style={{ marginTop: 16 }}>
            El/La colaborador(a) <strong>{documento.colaborador_nombre.toUpperCase()}</strong>,
            identificado(a) con {documento.colaborador_documento}, viene prestando sus servicios
            profesionales en nuestra organización en el cargo de <strong>{documento.cargo_consignado.toUpperCase()}</strong>,
            demostrando en todo momento alto profesionalismo, idoneidad, puntualidad y cumplimiento
            de las normas de bioseguridad y control de calidad institucional.
          </p>

          {documento.remuneracion_consignada && (
            <p style={{ marginTop: 14 }}>
              A la fecha de emisión del presente documento, percibe una remuneración mensual bruta de
              <strong> S/ {Number(documento.remuneracion_consignada).toFixed(2)} Soles</strong>.
            </p>
          )}

          {documento.observaciones && (
            <p style={{ marginTop: 14, fontStyle: 'italic' }}>
              Nota: {documento.observaciones}
            </p>
          )}

          <p style={{ marginTop: 24 }}>
            Se expide la presente a solicitud verbal de la parte interesada para los fines legales,
            laborales o administrativos que considere convenientes.
          </p>

          <p style={{ marginTop: 32, textAlign: 'right' }}>
            Lima, {dayjs(documento.fecha_emision).format('DD [de] MMMM [de] YYYY')}
          </p>
        </div>

        {/* Firmas */}
        <div style={{ marginTop: 70, display: 'flex', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', width: 260, borderTop: '1px solid #475569', paddingTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              {documento.emitido_por_nombre || 'DIRECCIÓN DE TALENTO HUMANO'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>VITELAB CLÍNICO S.A.C.</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
