import React from 'react';
import { Modal, Typography, Button, Space, Spin, Alert, Card, theme, message } from 'antd';
import { RobotOutlined, CopyOutlined, PrinterOutlined } from '@ant-design/icons';
import { usePreanalitica } from '../hooks';
import type { Orden } from '../types';

const { Title, Text, Paragraph } = Typography;

interface CondicionesPreanaliticasModalProps {
  open: boolean;
  onClose: () => void;
  orden: Orden | null;
}

export const CondicionesPreanaliticasModal: React.FC<CondicionesPreanaliticasModalProps> = ({
  open,
  onClose,
  orden,
}) => {
  const { token } = theme.useToken();
  const ordenId = orden?.id || 0;

  const { data: preanalitica, isLoading, isError, refetch } = usePreanalitica(ordenId, open && ordenId > 0);

  const handleCopy = () => {
    if (!preanalitica) return;
    navigator.clipboard.writeText(preanalitica);
    message.success('Indicaciones copiadas al portapapeles');
  };

  const handlePrint = () => {
    if (!preanalitica || !orden) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Indicaciones Pre-Analíticas - Orden ${orden.numero_atencion}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #0052cc; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0; color: #0052cc; }
            .info { font-size: 14px; margin-bottom: 15px; background: #f4f6f8; padding: 10px; border-radius: 6px; }
            .content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
            .footer { margin-top: 20px; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ViteLab - Laboratorio Clínico</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px;">Indicaciones y Condiciones Pre-Analíticas para el Paciente</p>
          </div>
          <div class="info">
            <strong>N° Atención:</strong> ${orden.numero_atencion}<br/>
            <strong>Paciente:</strong> ${orden.paciente_nombres || ''} ${orden.paciente_apellidos || ''}<br/>
            <strong>DNI:</strong> ${orden.paciente_dni || '-'}<br/>
            <strong>Fecha:</strong> ${new Date(orden.fecha_registro).toLocaleDateString()}
          </div>
          <div class="content">${preanalitica}</div>
          <div class="footer">
            Generado automáticamente por el Sistema ViteLab LIMS.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space align="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${token.colorPrimary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: token.colorPrimary,
              fontSize: 20,
            }}
          >
            <RobotOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Condiciones Pre-Analíticas
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Indicaciones de preparación del paciente generadas con IA
            </Text>
          </div>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button
          key="copy"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          disabled={!preanalitica || isLoading}
        >
          Copiar
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          disabled={!preanalitica || isLoading}
        >
          Imprimir Ticket
        </Button>,
      ]}
      width={600}
      centered
    >
      {orden && (
        <Card
          size="small"
          bordered={false}
          style={{
            background: token.colorBgLayout,
            marginBottom: 16,
            borderRadius: token.borderRadius,
          }}
        >
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 14 }}>
              Orden N° {orden.numero_atencion} &bull; {orden.paciente_nombres} {orden.paciente_apellidos}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              DNI: {orden.paciente_dni || '-'} &bull; Sede: {orden.sede_nombre || '-'}
            </Text>
          </Space>
        </Card>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Generando indicaciones personalizadas con IA...</Text>
          </div>
        </div>
      ) : isError ? (
        <Alert
          type="error"
          message="Error al obtener las indicaciones"
          description="No se pudieron generar las condiciones pre-analíticas en este momento."
          action={
            <Button size="small" type="primary" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <div
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: 16,
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            maxHeight: 350,
            overflowY: 'auto',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          {preanalitica || 'No se han registrado indicaciones pre-analíticas para esta orden.'}
        </div>
      )}
    </Modal>
  );
};
