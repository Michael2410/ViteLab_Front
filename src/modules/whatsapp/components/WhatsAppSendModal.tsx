import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Alert } from 'antd';
import { WhatsAppOutlined, SendOutlined } from '@ant-design/icons';
import { useSendWhatsAppResults, useWhatsAppStatus } from '../hooks';
import './WhatsAppSendModal.css';

const { Text } = Typography;

const DEFAULT_COUNTRY_CODE = '+51';

function normalizarTelefono(raw: string): { codigoPais: string; numero: string } {
  const limpio = raw.trim().replace(/\s+/g, '');

  if (limpio.startsWith('+')) {
    const match = limpio.match(/^(\+\d{1,3})(\d+)$/);
    if (match) return { codigoPais: match[1], numero: match[2] };
  }

  if (limpio.startsWith('51') && limpio.length > 9) {
    return { codigoPais: '+51', numero: limpio.slice(2) };
  }

  return { codigoPais: DEFAULT_COUNTRY_CODE, numero: limpio };
}

interface WhatsAppSendModalProps {
  open: boolean;
  onClose: () => void;
  ordenId: number;
  numeroAtencion: string;
  pacienteNombre: string;
  telefonoPaciente?: string;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  open,
  onClose,
  ordenId,
  numeroAtencion,
  pacienteNombre,
  telefonoPaciente,
}) => {
  const [form] = Form.useForm();
  const sendMutation = useSendWhatsAppResults();
  const { data: status } = useWhatsAppStatus();

  useEffect(() => {
    if (open) {
      if (telefonoPaciente) {
        const { codigoPais, numero } = normalizarTelefono(telefonoPaciente);
        form.setFieldsValue({ codigoPais, numero });
      } else {
        form.setFieldsValue({ codigoPais: DEFAULT_COUNTRY_CODE, numero: '' });
      }
    }
  }, [open, telefonoPaciente, form]);

  const handleSubmit = async (values: { codigoPais: string; numero: string }) => {
    const phoneNumber = `${values.codigoPais}${values.numero}`;
    try {
      await sendMutation.mutateAsync({ ordenId, phoneNumber });
      form.resetFields();
      onClose();
    } catch {}
  };

  const isWhatsAppConnected = status?.isConnected;

  return (
    <Modal
      title={
        <Space>
          <WhatsAppOutlined style={{ color: '#25D366' }} />
          <span>Enviar Resultados por WhatsApp</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={450}
      centered
      destroyOnClose
    >
      {!isWhatsAppConnected ? (
        <Alert
          message="WhatsApp no está conectado"
          description="Para enviar resultados, primero debes vincular tu cuenta de WhatsApp desde el menú superior."
          type="warning"
          showIcon
          className="whatsapp-send-modal-info"
        />
      ) : (
        <>
          <div className="whatsapp-send-modal-info">
            <Text className="whatsapp-send-modal-label">Orden:</Text>
            <Text strong className="whatsapp-send-modal-value">{numeroAtencion}</Text>
          </div>
          <div className="whatsapp-send-modal-info">
            <Text className="whatsapp-send-modal-label">Paciente:</Text>
            <Text strong className="whatsapp-send-modal-value">{pacienteNombre}</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ codigoPais: DEFAULT_COUNTRY_CODE, numero: '' }}
          >
            <Form.Item
              label="Número de WhatsApp"
              extra={
                telefonoPaciente
                  ? 'Número registrado del paciente. Edita si es necesario.'
                  : 'Ingresa el número del destinatario.'
              }
            >
              <Space.Compact style={{ width: '100%' }}>
                {/* Código de país — editable para casos especiales */}
                <Form.Item
                  name="codigoPais"
                  noStyle
                  rules={[
                    { required: true, message: 'Requerido' },
                    {
                      pattern: /^\+\d{1,4}$/,
                      message: 'Formato: +51',
                    },
                  ]}
                >
                  <Input
                    style={{ width: 72, textAlign: 'center', fontWeight: 600 }}
                    placeholder="+51"
                    maxLength={5}
                    size="large"
                  />
                </Form.Item>

                {/* Número local */}
                <Form.Item
                  name="numero"
                  noStyle
                  rules={[
                    { required: true, message: 'Ingresa el número' },
                    {
                      pattern: /^[0-9]{7,12}$/,
                      message: 'Solo dígitos, entre 7 y 12 caracteres',
                    },
                  ]}
                >
                  <Input
                    prefix={<WhatsAppOutlined className="whatsapp-icon" />}
                    placeholder="987654321"
                    size="large"
                    maxLength={12}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item className="whatsapp-send-modal-footer">
              <Space>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={sendMutation.isPending}
                  className="whatsapp-send-button"
                >
                  Enviar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default WhatsAppSendModal;
