import { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Upload,
  Image,
  Space,
  theme,
  message,
  Divider,
  Result,
} from 'antd';
import {
  SaveOutlined,
  DeleteOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  NumberOutlined,
  CloudUploadOutlined,
  PictureOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useConfiguracion, useActualizarConfiguracion } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { uploadFile, deleteFile } from '../../../shared/utils/apiClient';
import type { UpdateConfiguracionInput } from '../types';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper para construir URL de imagen
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL.replace('/api', '')}${path}`;
};

export const SistemaPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('settings.update');

  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [logoSecFile, setLogoSecFile] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: configuracion, isLoading, error } = useConfiguracion({
    enabled: hasPermission('settings.read'),
  });
  const actualizarMutation = useActualizarConfiguracion();

  // --- Efectos y Carga de Datos ---
  useEffect(() => {
    if (configuracion) {
      form.setFieldsValue({
        empresa_nombre: configuracion.empresa_nombre,
        empresa_razon_social: configuracion.empresa_razon_social,
        empresa_ruc: configuracion.empresa_ruc,
        empresa_direccion: configuracion.empresa_direccion,
        empresa_telefono: configuracion.empresa_telefono,
        empresa_email: configuracion.empresa_email,
        empresa_web: configuracion.empresa_web,
        moneda: configuracion.moneda,
        igv_porcentaje: configuracion.igv_porcentaje,
        encabezado_reporte: configuracion.encabezado_reporte,
        pie_reporte: configuracion.pie_reporte,
      });

      if (configuracion.logo_principal) {
        const logoUrl = getImageUrl(configuracion.logo_principal);
        setLogoFile([{
          uid: '-1',
          name: 'logo_principal',
          status: 'done',
          url: logoUrl || '',
        }]);
      }
      if (configuracion.logo_secundario) {
        const logoSecUrl = getImageUrl(configuracion.logo_secundario);
        setLogoSecFile([{
          uid: '-2',
          name: 'logo_secundario',
          status: 'done',
          url: logoSecUrl || '',
        }]);
      }
    }
  }, [configuracion, form]);

  // --- Handlers ---
  const handleUploadLogo = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const result = await uploadFile(file as File, 'logos');
      setLogoFile([{ uid: '-1', name: (file as File).name, status: 'done', url: `${API_URL.replace('/api', '')}${result.url}` }]);
      await actualizarMutation.mutateAsync({ logo_principal: result.url });
      onSuccess?.(result);
      message.success('Logo principal actualizado');
    } catch (err) { onError?.(err as Error); } finally { setUploading(false); }
  };

  const handleUploadLogoSec = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const result = await uploadFile(file as File, 'firmas');
      setLogoSecFile([{ uid: '-2', name: (file as File).name, status: 'done', url: `${API_URL.replace('/api', '')}${result.url}` }]);
      await actualizarMutation.mutateAsync({ logo_secundario: result.url });
      onSuccess?.(result);
      message.success('Firma actualizada');
    } catch (err) { onError?.(err as Error); } finally { setUploading(false); }
  };

  const handleRemoveLogo = async () => {
    if (configuracion?.logo_principal) {
        try {
          const filename = configuracion.logo_principal.split('/').pop();
          if(filename) await deleteFile('logos', filename);
        } catch (e) { console.error(e); }
    }
    setLogoFile([]);
    await actualizarMutation.mutateAsync({ logo_principal: null });
    message.info('Logo eliminado');
  };

  const handleRemoveLogoSec = async () => {
      if (configuracion?.logo_secundario) {
        try {
          const filename = configuracion.logo_secundario.split('/').pop();
          if(filename) await deleteFile('firmas', filename);
        } catch (e) { console.error(e); }
    }
    setLogoSecFile([]);
    await actualizarMutation.mutateAsync({ logo_secundario: null });
    message.info('Firma eliminada');
  };

  const handleSubmit = async (values: UpdateConfiguracionInput) => {
    try {
      await actualizarMutation.mutateAsync(values);
      message.success('Configuración guardada correctamente');
    } catch (error) {
      message.error('Error al guardar');
    }
  };

  // --- Render Uploader (MEJORADO) ---
  const renderUploader = (title: string, files: UploadFile[], uploadHandler: any, removeHandler: any, hint: string) => {
    const hasImage = files.length > 0 && files[0].url;
    
    const uploaderContainerStyle: React.CSSProperties = {
        borderRadius: token.borderRadiusLG,
        backgroundColor: token.colorBgLayout, 
        transition: 'all 0.3s',
    };

    return (
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ marginBottom: 8, display: 'block', color: token.colorTextHeading }}>{title}</Text>
        {hasImage ? (
          <div style={{
            ...uploaderContainerStyle,
            position: 'relative',
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: 24,
            textAlign: 'center',
            boxShadow: `inset 0 2px 8px ${token.colorFillTertiary}`,
          }}>
              <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                 <Image src={files[0].url} height={90} style={{ objectFit: 'contain' }} />
              </div>
              <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={removeHandler} disabled={!canUpdate}>
                Eliminar imagen
              </Button>
          </div>
        ) : (
          <Dragger
            customRequest={uploadHandler}
            showUploadList={false}
            disabled={!canUpdate || uploading}
            style={{
                ...uploaderContainerStyle,
                border: `1px dashed ${token.colorBorderSecondary}`,
                backgroundColor: token.colorBgLayout,
            }}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ color: token.colorPrimary, fontSize: 32 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 14, color: token.colorText }}>Arrastra tu imagen aquí</p>
            <p className="ant-upload-hint" style={{ fontSize: 12, color: token.colorTextTertiary, padding: '0 10px' }}>{hint}</p>
          </Dragger>
        )}
      </div>
    );
  };

  const cardShadowStyle = token.boxShadowSecondary;

  if (!hasPermission('settings.read')) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para ver la configuración del sistema."
        extra={
          <Button type="primary" onClick={() => navigate('/')} icon={<ArrowLeftOutlined />}>
            Volver al inicio
          </Button>
        }
      />
    );
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (error) return <Card><Text type="danger">Error cargando configuración</Text></Card>;

  const inputIconColor = token.colorTextTertiary;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding:20 }}>
        <div>
           <Title level={2} style={{ margin: 0 }}>Configuración del Sistema</Title>
           <Text type="secondary">Gestione la identidad corporativa y parámetros generales</Text>
        </div>
        {canUpdate && (
          <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={actualizarMutation.isPending}
              style={{ boxShadow: `0 4px 14px ${token.colorPrimary}40` }}
          >
              Guardar Cambios
          </Button>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large" disabled={!canUpdate}>
        <Row gutter={24}>

            {/* COLUMNA IZQUIERDA: Identidad Visual */}
            <Col xs={24} lg={8}>
                <Card
                    title={<Space><PictureOutlined style={{ color: token.colorPrimaryActive }} /> Identidad Visual</Space>}
                    bordered={false}
                    style={{ borderRadius: token.borderRadiusLG, boxShadow: cardShadowStyle, height: '100%', border: `1px solid ${token.colorBorderSecondary}` }}
                >
                    {renderUploader(
                        "Logo Principal",
                        logoFile,
                        handleUploadLogo,
                        handleRemoveLogo,
                        "Aparece en la cabecera de documentos. Formato PNG/JPG."
                    )}

                    <Divider style={{ margin: '24px 0' }} />

                    {renderUploader(
                        "Firma / Sello",
                        logoSecFile,
                        handleUploadLogoSec,
                        handleRemoveLogoSec,
                        "Aparece al pie de los reportes. Fondo transparente recomendado."
                    )}
                </Card>
            </Col>

            {/* COLUMNA DERECHA: Datos */}
            <Col xs={24} lg={16}>

                {/* 1. Datos de Empresa */}
                <Card
                    title={<Space><BankOutlined style={{ color: token.colorPrimary }} /> Información Corporativa</Space>}
                    bordered={false}
                    style={{ borderRadius: token.borderRadiusLG, boxShadow: cardShadowStyle, marginBottom: 24, border: `1px solid ${token.colorBorderSecondary}` }}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item name="empresa_nombre" label="Nombre Comercial" rules={[{ required: true }]}>
                                <Input placeholder="Ej. ViteLab" prefix={<BankOutlined style={{ color: inputIconColor }} />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                             <Form.Item name="empresa_ruc" label="R.U.C.">
                                <Input placeholder="20100000001" maxLength={11} prefix={<NumberOutlined style={{ color: inputIconColor }} />} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="empresa_razon_social" label="Razón Social">
                                <Input placeholder="Ej. Laboratorios Vite S.A.C." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="empresa_direccion" label="Dirección Fiscal">
                                <Input prefix={<EnvironmentOutlined style={{ color: inputIconColor }} />} placeholder="Av. Principal 123..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                             <Form.Item name="empresa_telefono" label="Teléfono">
                                <Input prefix={<PhoneOutlined style={{ color: inputIconColor }} />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                             <Form.Item name="empresa_email" label="Email" rules={[{ type: 'email' }]}>
                                <Input prefix={<MailOutlined style={{ color: inputIconColor }} />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                             <Form.Item name="empresa_web" label="Sitio Web">
                                <Input prefix={<GlobalOutlined style={{ color: inputIconColor }} />} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
      </Form>
    </div>
  );
};