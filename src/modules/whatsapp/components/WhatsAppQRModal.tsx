/**
 * Modal para vincular WhatsApp mostrando el QR en tiempo real
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Result, Typography, Space, Alert } from 'antd';
import {
  QrcodeOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
  LoadingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import QRCode from 'qrcode';
import { useWhatsAppSession } from '../hooks';
import type { ConnectionState } from '../types';
import './WhatsAppQRModal.css';

const { Text, Title } = Typography;

interface WhatsAppQRModalProps {
  open: boolean;
  onClose: () => void;
}

export const WhatsAppQRModal: React.FC<WhatsAppQRModalProps> = ({ open, onClose }) => {
  const {
    qrCode,
    connectionState,
    phoneNumber,
    startSession,
    disconnect,
    isStarting,
    isDisconnecting,
  } = useWhatsAppSession();

  // Estado para la imagen QR generada
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  // Referencia para evitar múltiples llamadas
  const hasStartedRef = React.useRef(false);

  // Convertir el string QR a imagen cuando cambie
  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then((url) => {
          console.log('✅ QR convertido a imagen');
          setQrImageUrl(url);
        })
        .catch((err) => {
          console.error('❌ Error al generar imagen QR:', err);
          setQrImageUrl(null);
        });
    } else {
      setQrImageUrl(null);
    }
  }, [qrCode]);

  // Iniciar sesión al abrir el modal si no está conectado
  React.useEffect(() => {
    if (open && connectionState === 'disconnected' && !isStarting && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startSession();
    }
    
    // Reset cuando se cierra el modal
    if (!open) {
      hasStartedRef.current = false;
    }
  }, [open]); // Solo depender de 'open'

  // Reset la referencia cuando se conecta exitosamente
  React.useEffect(() => {
    if (connectionState === 'connected') {
      hasStartedRef.current = false;
    }
  }, [connectionState]);

  const renderContent = () => {
    switch (connectionState) {
      case 'connecting':
        return (
          <div className="whatsapp-modal-content">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <Text style={{ marginTop: 16 }}>Conectando con WhatsApp...</Text>
          </div>
        );

      case 'qr':
        return (
          <div className="whatsapp-modal-content">
            <Alert
              message="Escanea el código QR"
              description="Abre WhatsApp en tu teléfono > Menú > Dispositivos vinculados > Vincular dispositivo"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {qrImageUrl ? (
              <div className="qr-container">
                <img src={qrImageUrl} alt="Código QR de WhatsApp" className="qr-image" />
              </div>
            ) : (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            )}
            <Text type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
              El código QR se actualiza automáticamente cada 20 segundos
            </Text>
          </div>
        );

      case 'connected':
        return (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="WhatsApp Conectado"
            subTitle={
              <Space direction="vertical">
                <Text>Tu cuenta de WhatsApp está vinculada correctamente</Text>
                {phoneNumber && (
                  <Text strong>Número: +{phoneNumber}</Text>
                )}
              </Space>
            }
            extra={[
              <Button
                key="disconnect"
                danger
                icon={<DisconnectOutlined />}
                onClick={disconnect}
                loading={isDisconnecting}
              >
                Desvincular
              </Button>,
              <Button key="close" type="primary" onClick={onClose}>
                Cerrar
              </Button>,
            ]}
          />
        );

      case 'disconnected':
      default:
        return (
          <div className="whatsapp-modal-content">
            <QrcodeOutlined style={{ fontSize: 64, color: '#25D366' }} />
            <Title level={4} style={{ marginTop: 16 }}>Vincular WhatsApp</Title>
            <Text type="secondary" style={{ marginBottom: 24 }}>
              Conecta tu cuenta de WhatsApp para enviar resultados a los pacientes
            </Text>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={startSession}
              loading={isStarting}
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              Generar código QR
            </Button>
          </div>
        );
    }
  };

  const getTitle = () => {
    const statusIcons: Record<ConnectionState, React.ReactNode> = {
      disconnected: <DisconnectOutlined style={{ color: '#ff4d4f' }} />,
      connecting: <LoadingOutlined spin style={{ color: '#1890ff' }} />,
      qr: <QrcodeOutlined style={{ color: '#25D366' }} />,
      connected: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    };

    return (
      <Space>
        {statusIcons[connectionState]}
        <span>WhatsApp</span>
      </Space>
    );
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={onClose}
      footer={connectionState !== 'connected' ? (
        <Button onClick={onClose}>Cerrar</Button>
      ) : null}
      width={450}
      centered
      destroyOnClose
    >
      {renderContent()}
    </Modal>
  );
};

export default WhatsAppQRModal;
