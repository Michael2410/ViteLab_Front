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
  message,
  Result,
  Tag,
  Select,
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
  ShopOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useConfiguracion, useActualizarConfiguracion } from '../hooks';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { uploadFile, deleteFile } from '../../../../shared/utils/apiClient';
import type { UpdateConfiguracionInput } from '../types';
import { useNavigate } from 'react-router-dom';
import ModulePageLayout, { brandButtonStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;
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
  const [form] = Form.useForm();
  const { hasPermission } = usePermissions();
  const canRead = hasPermission('settings.read');
  const canUpdate = hasPermission('settings.update');

  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [logoSecFile, setLogoSecFile] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: configuracion, isLoading, error } = useConfiguracion({
    enabled: canRead,
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
        regimen_laboral: configuracion.regimen_laboral || 'GENERAL',
        encabezado_reporte: configuracion.encabezado_reporte,
        pie_reporte: configuracion.pie_reporte,
      });

      if (configuracion.logo_principal) {
        const logoUrl = getImageUrl(configuracion.logo_principal);
        setLogoFile([
          {
            uid: '-1',
            name: 'logo_principal',
            status: 'done',
            url: logoUrl || '',
          },
        ]);
      }
      if (configuracion.logo_secundario) {
        const logoSecUrl = getImageUrl(configuracion.logo_secundario);
        setLogoSecFile([
          {
            uid: '-2',
            name: 'logo_secundario',
            status: 'done',
            url: logoSecUrl || '',
          },
        ]);
      }
    }
  }, [configuracion, form]);

  // --- Handlers de Upload ---
  const handleUploadLogo = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const result = await uploadFile(file as File, 'logos');
      setLogoFile([
        {
          uid: '-1',
          name: (file as File).name,
          status: 'done',
          url: `${API_URL.replace('/api', '')}${result.url}`,
        },
      ]);
      await actualizarMutation.mutateAsync({ logo_principal: result.url });
      onSuccess?.(result);
      message.success('Logo principal actualizado');
    } catch (err) {
      onError?.(err as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadLogoSec = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const result = await uploadFile(file as File, 'firmas');
      setLogoSecFile([
        {
          uid: '-2',
          name: (file as File).name,
          status: 'done',
          url: `${API_URL.replace('/api', '')}${result.url}`,
        },
      ]);
      await actualizarMutation.mutateAsync({ logo_secundario: result.url });
      onSuccess?.(result);
      message.success('Firma / sello actualizado');
    } catch (err) {
      onError?.(err as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (configuracion?.logo_principal) {
      try {
        const filename = configuracion.logo_principal.split('/').pop();
        if (filename) await deleteFile('logos', filename);
      } catch (e) {
        console.error(e);
      }
    }
    setLogoFile([]);
    await actualizarMutation.mutateAsync({ logo_principal: null });
    message.info('Logo principal eliminado');
  };

  const handleRemoveLogoSec = async () => {
    if (configuracion?.logo_secundario) {
      try {
        const filename = configuracion.logo_secundario.split('/').pop();
        if (filename) await deleteFile('firmas', filename);
      } catch (e) {
        console.error(e);
      }
    }
    setLogoSecFile([]);
    await actualizarMutation.mutateAsync({ logo_secundario: null });
    message.info('Firma / sello eliminado');
  };

  const handleSubmit = async (values: UpdateConfiguracionInput) => {
    try {
      await actualizarMutation.mutateAsync(values);
      message.success('Configuración guardada correctamente');
    } catch (error) {
      message.error('Error al guardar la configuración');
    }
  };

  // --- Render Uploader Equilibrado y Parejo ---
  const renderUploader = (
    title: string,
    files: UploadFile[],
    uploadHandler: any,
    removeHandler: any,
    hint: string
  ) => {
    const hasImage = files.length > 0 && files[0].url;

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '14px 16px',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
            {title}
          </Text>
          {hasImage ? (
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              style={{
                margin: 0,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 11,
                padding: '1px 9px',
                border: 'none',
                background: '#dcfce7',
                color: '#15803d',
              }}
            >
              Configurado
            </Tag>
          ) : (
            <Tag
              style={{
                margin: 0,
                borderRadius: 12,
                fontSize: 11,
                padding: '1px 9px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#94a3b8',
              }}
            >
              Sin asignar
            </Tag>
          )}
        </div>

        {hasImage ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
              backgroundSize: '12px 12px',
              padding: '10px 14px',
              minHeight: 105,
              marginBottom: 10,
            }}
          >
            <Image
              src={files[0].url}
              height={78}
              style={{ objectFit: 'contain', maxWidth: '100%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
              alt={title}
            />
          </div>
        ) : (
          <Dragger
            customRequest={uploadHandler}
            showUploadList={false}
            disabled={!canUpdate || uploading}
            style={{
              flex: 1,
              minHeight: 105,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1.5px dashed #cbd5e1',
              backgroundColor: '#ffffff',
              padding: '12px',
              marginBottom: 10,
            }}
          >
            <p className="ant-upload-drag-icon" style={{ margin: '0 0 6px' }}>
              <CloudUploadOutlined style={{ color: '#0284c7', fontSize: 26 }} />
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>
              Arrastra o haz clic para subir
            </p>
          </Dragger>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
            {hint}
          </span>
          {hasImage && (
            <Space size={6}>
              <Upload
                customRequest={uploadHandler}
                showUploadList={false}
                disabled={!canUpdate || uploading}
              >
                <Button
                  size="small"
                  icon={<CloudUploadOutlined />}
                  loading={uploading}
                  disabled={!canUpdate}
                  style={{ borderRadius: 6, fontSize: 11.5, height: 28, padding: '0 10px' }}
                >
                  Cambiar
                </Button>
              </Upload>
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={removeHandler}
                disabled={!canUpdate || uploading}
                style={{ borderRadius: 6, fontSize: 11.5, height: 28, padding: '0 8px' }}
              >
                Quitar
              </Button>
            </Space>
          )}
        </div>
      </div>
    );
  };

  if (!canRead) {
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

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
          gap: 16,
        }}
      >
        <Spin size="large" />
        <Text style={{ color: '#64748b', fontSize: 13 }}>Cargando parámetros del sistema...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: 12, borderColor: '#fecdd3', backgroundColor: '#fff1f2' }}>
        <Text type="danger" strong>
          Error al cargar la configuración del sistema. Por favor reintente o contacte a soporte.
        </Text>
      </Card>
    );
  }

  return (
    <ModulePageLayout
      title="Configuración del Sistema"
      subtitle="Gestión de la identidad corporativa, logotipos oficiales y datos fiscales del laboratorio"
      actionButton={
        canUpdate ? (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={actualizarMutation.isPending}
            style={brandButtonStyle}
          >
            Guardar Cambios
          </Button>
        ) : undefined
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="middle"
        disabled={!canUpdate}
        requiredMark={false}
      >
        <Row gutter={[20, 20]} style={{ alignItems: 'stretch' }}>
          {/* COLUMNA IZQUIERDA: Identidad Visual */}
          <Col xs={24} lg={8} style={{ display: 'flex' }}>
            <Card
              bordered
              styles={{
                header: { padding: '14px 18px', minHeight: 'auto', borderBottom: '1px solid #f1f5f9' },
                body: { padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                    }}
                  >
                    <PictureOutlined style={{ fontSize: 17 }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, display: 'block', lineHeight: 1.2 }}>
                      Identidad Visual
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Logos y sellos oficiales</span>
                  </div>
                </div>
              }
              style={{
                borderRadius: 14,
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Logo Principal */}
              {renderUploader(
                'Logo Principal',
                logoFile,
                handleUploadLogo,
                handleRemoveLogo,
                'Cabecera de reportes (PNG recomendado)'
              )}

              {/* Firma / Sello */}
              {renderUploader(
                'Firma / Sello Institucional',
                logoSecFile,
                handleUploadLogoSec,
                handleRemoveLogoSec,
                'Pie de resultados y certificados'
              )}

              {/* Tip de formato */}
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #e0f2fe',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <SafetyCertificateOutlined style={{ color: '#0284c7', fontSize: 14 }} />
                <span style={{ fontSize: 11, color: '#0369a1' }}>
                  Fondo transparente PNG recomendado para óptima impresión en PDF.
                </span>
              </div>
            </Card>
          </Col>

          {/* COLUMNA DERECHA: Información Corporativa & Fiscal */}
          <Col xs={24} lg={16} style={{ display: 'flex' }}>
            <Card
              bordered
              styles={{
                header: { padding: '14px 20px', minHeight: 'auto', borderBottom: '1px solid #f1f5f9' },
                body: { padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 },
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0f766e',
                    }}
                  >
                    <BankOutlined style={{ fontSize: 17 }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, display: 'block', lineHeight: 1.2 }}>
                      Información Corporativa & Fiscal
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Datos legales y contacto institucional</span>
                  </div>
                </div>
              }
              style={{
                borderRadius: 14,
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div>
                {/* Fila 1: Nombre comercial y RUC */}
                <Row gutter={16}>
                  <Col xs={24} md={14}>
                    <Form.Item
                      name="empresa_nombre"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Nombre Comercial</span>}
                      rules={[{ required: true, message: 'Requerido' }]}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        placeholder="Ej. ViteLab Laboratorios"
                        prefix={<ShopOutlined style={{ color: '#94a3b8' }} />}
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={10}>
                    <Form.Item
                      name="empresa_ruc"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>R.U.C.</span>}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        placeholder="20100000001"
                        maxLength={11}
                        prefix={<NumberOutlined style={{ color: '#94a3b8' }} />}
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Fila 2: Razón Social */}
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="empresa_razon_social"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Razón Social</span>}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        placeholder="Ej. Laboratorios Clínicos Vite S.A.C."
                        prefix={<FileTextOutlined style={{ color: '#94a3b8' }} />}
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Fila 3: Régimen Laboral de la Empresa */}
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="regimen_laboral"
                      label={
                        <Space size={8}>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Régimen Laboral de la Empresa</span>
                          <Tag color="cyan" style={{ fontSize: 11, borderRadius: 4, margin: 0, padding: '1px 8px' }}>
                            Impacta en Vacaciones
                          </Tag>
                        </Space>
                      }
                      style={{ marginBottom: 14 }}
                    >
                      <Select
                        style={{ height: 38 }}
                        options={[
                          {
                            value: 'GENERAL',
                            label: 'Régimen General',
                          },
                          {
                            value: 'MYPE',
                            label: 'Régimen MYPE / REMYPE',
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Fila 4: Dirección Fiscal */}
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="empresa_direccion"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Dirección Fiscal</span>}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        prefix={<EnvironmentOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="Av. Javier Prado Este 1234, San Isidro, Lima"
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Fila 5: Teléfono, Correo y Sitio Web */}
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="empresa_telefono"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Teléfono Central</span>}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="+51 987 654 321"
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="empresa_email"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Correo Institucional</span>}
                      rules={[{ type: 'email', message: 'Email no válido' }]}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="contacto@vitelab.pe"
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="empresa_web"
                      label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>Sitio Web</span>}
                      style={{ marginBottom: 14 }}
                    >
                      <Input
                        prefix={<GlobalOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="https://vitelab.pe"
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Mensaje de sincronización elegante */}
              <div
                style={{
                  marginTop: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <SafetyCertificateOutlined style={{ color: '#16a34a', fontSize: 15 }} />
                <span style={{ fontSize: 11.5, color: '#166534', fontWeight: 500 }}>
                  Los cambios se reflejan en tiempo real en los membretes, órdenes médicas y resultados emitidos.
                </span>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </ModulePageLayout>
  );
};

export default SistemaPage;