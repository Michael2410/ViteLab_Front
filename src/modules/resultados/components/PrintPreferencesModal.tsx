import { Modal, Form, Switch, Divider, Typography, Space } from 'antd';
import {
  PictureOutlined,
  EnvironmentOutlined,
  EditOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

export interface PrintPreferences {
  // Logos
  mostrarLogoEmpresa: boolean;
  mostrarLogoConvenio: boolean;
  // Direcciones en pie de página
  mostrarDireccionEmpresa: boolean;
  mostrarDireccionConvenio: boolean;
  // Firmas
  mostrarFirmaTecnologo: boolean;
  mostrarFirmaDirector: boolean;
  // IA
  mostrarInterpretacionIA: boolean;
}

export const defaultPrintPreferences: PrintPreferences = {
  mostrarLogoEmpresa: true,
  mostrarLogoConvenio: true,
  mostrarDireccionEmpresa: true,
  mostrarDireccionConvenio: true,
  mostrarFirmaTecnologo: true,
  mostrarFirmaDirector: true,
  mostrarInterpretacionIA: true,
};

interface PrintPreferencesModalProps {
  open: boolean;
  preferences: PrintPreferences;
  onCancel: () => void;
  onSave: (preferences: PrintPreferences) => void;
}

export const PrintPreferencesModal: React.FC<PrintPreferencesModalProps> = ({
  open,
  preferences,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    const values = form.getFieldsValue();
    onSave(values);
  };

  return (
    <Modal
      title="Preferencias de Impresión"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Aplicar"
      cancelText="Cancelar"
      width={450}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={preferences}
      >
        {/* Sección de Logos */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            <PictureOutlined style={{ marginRight: 8 }} />
            Logos en Cabecera
          </Title>
          
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Logo de la Empresa (izquierda)</Text>
              <Form.Item name="mostrarLogoEmpresa" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Logo del Convenio (derecha)</Text>
              <Form.Item name="mostrarLogoConvenio" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Sección de Direcciones */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            Direcciones en Pie de Página
          </Title>
          
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Dirección de la Empresa</Text>
              <Form.Item name="mostrarDireccionEmpresa" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Dirección del Convenio</Text>
              <Form.Item name="mostrarDireccionConvenio" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Sección de Firmas */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            <EditOutlined style={{ marginRight: 8 }} />
            Firmas
          </Title>
          
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Firma del Tecnólogo Médico</Text>
              <Form.Item name="mostrarFirmaTecnologo" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Firma del Director Técnico</Text>
              <Form.Item name="mostrarFirmaDirector" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Sección de Interpretación IA */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            <RobotOutlined style={{ marginRight: 8 }} />
            Inteligencia Artificial
          </Title>
          
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Mostrar interpretación de resultados (IA)</Text>
              <Form.Item name="mostrarInterpretacionIA" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            La interpretación es generada automáticamente por IA y debe ser revisada por el médico tratante.
          </Text>
        </div>
      </Form>
    </Modal>
  );
};
