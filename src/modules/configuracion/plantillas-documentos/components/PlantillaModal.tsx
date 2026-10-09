import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  Tag,
  Row,
  Col,
  Space,
  Tooltip,
  Upload,
  Button,
  message,
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  UploadOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { PlantillaDocumento, CrearPlantillaDTO, ActualizarPlantillaDTO } from '../plantillas.types';
import { VARIABLES_DOCUMENTO } from '../plantillas.types';
import { useConfiguracion } from '../../sistema/hooks';
import { uploadFile } from '../../../../shared/utils/apiClient';
import dayjs from 'dayjs';

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

interface PlantillaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CrearPlantillaDTO | ActualizarPlantillaDTO) => Promise<void>;
  plantilla?: PlantillaDocumento | null;
  loading?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

export const PlantillaModal: React.FC<PlantillaModalProps> = ({
  open,
  onClose,
  onSubmit,
  plantilla,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('editor');
  const textareaRef = useRef<any>(null);

  const { data: configSistema } = useConfiguracion();
  const logoUrl = getImageUrl(configSistema?.logo_principal);

  // Valores en tiempo real para la previsualización
  const [cuerpoPreview, setCuerpoPreview] = useState<string>('');
  const [tituloPreview, setTituloPreview] = useState<string>('');
  const [cierrePreview, setCierrePreview] = useState<string>('');
  const [ciudadPreview, setCiudadPreview] = useState<string>('LIMA');
  const [firmanteNombre, setFirmanteNombre] = useState<string>('');
  const [firmanteCargo, setFirmanteCargo] = useState<string>('');
  const [firmanteFirmaUrl, setFirmanteFirmaUrl] = useState<string>('');
  const [mostrarLogo, setMostrarLogo] = useState<boolean>(true);
  const [uploadingFirma, setUploadingFirma] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (plantilla) {
        form.setFieldsValue({
          tipo_documento: plantilla.tipo_documento,
          nombre: plantilla.nombre,
          titulo_documento: plantilla.titulo_documento,
          cuerpo_template: plantilla.cuerpo_template,
          parrafo_cierre: plantilla.parrafo_cierre || '',
          ciudad_defecto: plantilla.ciudad_defecto || 'LIMA',
          mostrar_logo: plantilla.mostrar_logo !== false,
          firmante_nombre: plantilla.firmante_nombre || '',
          firmante_cargo: plantilla.firmante_cargo || '',
          firmante_firma_url: plantilla.firmante_firma_url || '',
          activo: plantilla.activo,
        });
        setCuerpoPreview(plantilla.cuerpo_template);
        setTituloPreview(plantilla.titulo_documento);
        setCierrePreview(plantilla.parrafo_cierre || '');
        setCiudadPreview(plantilla.ciudad_defecto || 'LIMA');
        setFirmanteNombre(plantilla.firmante_nombre || '');
        setFirmanteCargo(plantilla.firmante_cargo || '');
        setFirmanteFirmaUrl(plantilla.firmante_firma_url || '');
        setMostrarLogo(plantilla.mostrar_logo !== false);
      } else {
        form.resetFields();
        const defectoCuerpo =
          'Por medio del presente **{empresa_nombre}**, con R.U.C. No. **{empresa_ruc}** certifica que el/la Sr(a). **{colaborador_nombre}** identificado/a con {colaborador_documento}, se encuentra trabajando en nuestra empresa desempeñando el cargo de **{cargo}** en el área de **{area}** desde el **{fecha_ingreso}** a la fecha.';
        const defectoCierre =
          'Se expide la presente constancia a solicitud del interesado para los fines que estime conveniente.';
        form.setFieldsValue({
          tipo_documento: 'CONSTANCIA_TRABAJO',
          nombre: 'Nueva Plantilla de Documento',
          titulo_documento: 'CONSTANCIA DE TRABAJO',
          cuerpo_template: defectoCuerpo,
          parrafo_cierre: defectoCierre,
          ciudad_defecto: 'LIMA',
          mostrar_logo: true,
          firmante_nombre: 'MONTOYA COTTLE ANAHI',
          firmante_cargo: 'GERENTE DE GESTION DE PERSONAS',
          firmante_firma_url: '',
          activo: true,
        });
        setCuerpoPreview(defectoCuerpo);
        setTituloPreview('CONSTANCIA DE TRABAJO');
        setCierrePreview(defectoCierre);
        setCiudadPreview('LIMA');
        setFirmanteNombre('MONTOYA COTTLE ANAHI');
        setFirmanteCargo('GERENTE DE GESTION DE PERSONAS');
        setFirmanteFirmaUrl('');
        setMostrarLogo(true);
      }
      setActiveTab('editor');
    }
  }, [open, plantilla, form]);

  // Insertar variable en el textarea
  const handleInsertVariable = (tag: string) => {
    const valorActual = form.getFieldValue('cuerpo_template') || '';
    const nuevoValor = `${valorActual} ${tag} `;
    form.setFieldsValue({ cuerpo_template: nuevoValor });
    setCuerpoPreview(nuevoValor);
  };

  // Renderizar Markdown simple de negritas para la vista previa
  const renderTextoConNegritas = (texto: string) => {
    if (!texto) return '';
    let reemplazado = texto
      .replace(/\{empresa_nombre\}/gi, configSistema?.empresa_razon_social || configSistema?.empresa_nombre || 'CLINICA INTERNACIONAL S.A.')
      .replace(/\{empresa_ruc\}/gi, configSistema?.empresa_ruc || '20100054184')
      .replace(/\{empresa_direccion\}/gi, configSistema?.empresa_direccion || 'Jr. Washington Nro. 1471 - Lima')
      .replace(/\{colaborador_nombre\}/gi, 'GOMEZ HUARAC, MICHAEL ESTEBEN')
      .replace(/\{colaborador_apellidos\}/gi, 'GOMEZ HUARAC')
      .replace(/\{colaborador_nombres\}/gi, 'MICHAEL ESTEBEN')
      .replace(/\{colaborador_documento\}/gi, 'DNI Nro. 70904523')
      .replace(/\{cargo\}/gi, 'OPERADOR DE PLATAFORMA Y APLICACIONES')
      .replace(/\{area\}/gi, 'SERVICIOS DE PLATAFORMAS Y APLICACIONES')
      .replace(/\{sueldo\}/gi, 'S/ 2,800.00')
      .replace(/\{fecha_ingreso\}/gi, '01 de Mayo del 2023')
      .replace(/\{fecha_cese\}/gi, '06 de Septiembre del 2025')
      .replace(/\{fecha_emision\}/gi, fechaEspanolFormal(dayjs().format('YYYY-MM-DD')))
      .replace(/\{fecha_actual\}/gi, fechaEspanolFormal(dayjs().format('YYYY-MM-DD')))
      .replace(/\{ciudad_emision\}/gi, ciudadPreview || 'LIMA')
      .replace(/\{firmante_nombre\}/gi, firmanteNombre || 'MONTOYA COTTLE ANAHI')
      .replace(/\{firmante_cargo\}/gi, firmanteCargo || 'GERENTE DE GESTION DE PERSONAS');

    const partes = reemplazado.split(/(\*\*.*?\*\*)/g);
    return partes.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleFinish = async (values: any) => {
    const payload = {
      ...values,
      firmante_firma_url: firmanteFirmaUrl || null,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <FileTextOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {plantilla ? 'Editar Plantilla de Documento' : 'Nueva Plantilla de Documento'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Diseña el formato legal y las variables dinámicas de expedición
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={plantilla ? 'Guardar Cambios' : 'Crear Plantilla'}
      cancelText="Cancelar"
      width={980}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'editor',
            label: (
              <span>
                <EditOutlined style={{ marginRight: 6 }} />
                Configuración & Cuerpo del Documento
              </span>
            ),
            children: (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                onValuesChange={(_, all) => {
                  setCuerpoPreview(all.cuerpo_template || '');
                  setTituloPreview(all.titulo_documento || '');
                  setCierrePreview(all.parrafo_cierre || '');
                  setCiudadPreview(all.ciudad_defecto || 'LIMA');
                  setFirmanteNombre(all.firmante_nombre || '');
                  setFirmanteCargo(all.firmante_cargo || '');
                  setMostrarLogo(all.mostrar_logo !== false);
                }}
                style={{ marginTop: 12 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="tipo_documento"
                      label={<span style={{ fontWeight: 600 }}>Tipo de Documento (Identificador)</span>}
                      rules={[{ required: true, message: 'Ingrese el tipo de documento' }]}
                    >
                      <Select
                        disabled={!!plantilla}
                        options={[
                          { label: 'Constancia de Trabajo (CONSTANCIA_TRABAJO)', value: 'CONSTANCIA_TRABAJO' },
                          { label: 'Certificado Laboral (CERTIFICADO_LABORAL)', value: 'CERTIFICADO_LABORAL' },
                          { label: 'Carta de Presentación (CARTA_PRESENTACION)', value: 'CARTA_PRESENTACION' },
                          { label: 'Carta de Recomendación (RECOMENDACION)', value: 'RECOMENDACION' },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="nombre"
                      label={<span style={{ fontWeight: 600 }}>Nombre Descriptivo de la Plantilla</span>}
                      rules={[{ required: true, message: 'Ingrese un nombre descriptivo' }]}
                    >
                      <Input placeholder="Ej: Constancia de Trabajo Oficial" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="titulo_documento"
                      label={<span style={{ fontWeight: 600 }}>Título Central de la Hoja (Subrayado)</span>}
                      rules={[{ required: true, message: 'Ingrese el título principal' }]}
                    >
                      <Input placeholder="Ej: CONSTANCIA DE TRABAJO" style={{ textTransform: 'uppercase', fontWeight: 700 }} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="ciudad_defecto"
                      label={<span style={{ fontWeight: 600 }}>Ciudad de Emisión</span>}
                    >
                      <Input placeholder="Ej: LIMA" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Chips de Variables Dinámicas */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    📌 Variables Disponibles (Haz clic sobre un chip para insertarlo en el cuerpo):
                  </div>
                  <Space wrap size={[6, 8]}>
                    {VARIABLES_DOCUMENTO.map((v) => (
                      <Tooltip key={v.tag} title={`Ejemplo: ${v.ejemplo}`}>
                        <Tag
                          color={v.origen === 'SISTEMA' ? 'blue' : v.origen === 'COLABORADOR' ? 'cyan' : 'purple'}
                          style={{
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                          onClick={() => handleInsertVariable(v.tag)}
                        >
                          + {v.tag}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                    💡 Consejo: Puedes encerrar palabras entre asteriscos dobles como <code>**palabra**</code> para que salgan en <strong>negrita</strong> al imprimir.
                  </div>
                </div>

                {/* Cuerpo de la Plantilla */}
                <Form.Item
                  name="cuerpo_template"
                  label={<span style={{ fontWeight: 600 }}>Cuerpo / Párrafo Central de la Plantilla</span>}
                  rules={[{ required: true, message: 'Ingrese el texto de la plantilla' }]}
                >
                  <Input.TextArea
                    ref={textareaRef}
                    rows={6}
                    placeholder="Redacte el texto legal del documento utilizando las variables dinámicas..."
                    style={{ fontSize: 13, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}
                  />
                </Form.Item>

                {/* Párrafo de Cierre */}
                <Form.Item
                  name="parrafo_cierre"
                  label={<span style={{ fontWeight: 600 }}>Párrafo de Cierre / Expedición (Opcional)</span>}
                >
                  <Input.TextArea
                    rows={2}
                    placeholder="Ej: Se expide la presente constancia a solicitud del interesado para los fines que estime conveniente."
                  />
                </Form.Item>

                {/* Configuración de Firmante */}
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: 8,
                    padding: '14px 16px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                    ✍️ Datos del Firmante de RRHH
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="firmante_nombre"
                        label={<span style={{ fontWeight: 600 }}>Nombre y Apellidos del Firmante</span>}
                      >
                        <Input placeholder="Ej: MONTOYA COTTLE ANAHI" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="firmante_cargo"
                        label={<span style={{ fontWeight: 600 }}>Cargo del Firmante</span>}
                      >
                        <Input placeholder="Ej: GERENTE DE GESTION DE PERSONAS" />
                      </Form.Item>
                    </Col>

                    {/* Firma / Sello en Imagen Opcional */}
                    <Col xs={24}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span>Firma / Sello en Imagen (Opcional)</span>
                            <Tooltip title="Sube una imagen de firma o sello (idealmente PNG con fondo transparente o JPG). Aparecerá sobre la línea de firma en los documentos emitidos e impresos.">
                              <InfoCircleOutlined style={{ color: '#0284c7' }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          {firmanteFirmaUrl ? (
                            <div
                              style={{
                                position: 'relative',
                                border: '1px solid #cbd5e1',
                                borderRadius: 8,
                                padding: '6px 14px',
                                backgroundColor: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              }}
                            >
                              <img
                                src={getImageUrl(firmanteFirmaUrl) || ''}
                                alt="Firma del firmante"
                                style={{ maxHeight: 46, maxWidth: 150, objectFit: 'contain' }}
                              />
                              <Button
                                danger
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  setFirmanteFirmaUrl('');
                                  form.setFieldsValue({ firmante_firma_url: '' });
                                }}
                              >
                                Quitar Firma
                              </Button>
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              Sin firma cargada (la línea se imprimirá en blanco para firma manuscrita)
                            </div>
                          )}

                          <Upload
                            accept="image/png,image/jpeg,image/webp"
                            showUploadList={false}
                            beforeUpload={async (file) => {
                              try {
                                setUploadingFirma(true);
                                const res = await uploadFile(file, 'firmas');
                                if (res?.url) {
                                  setFirmanteFirmaUrl(res.url);
                                  form.setFieldsValue({ firmante_firma_url: res.url });
                                  message.success('Imagen de firma cargada correctamente');
                                }
                              } catch (err) {
                                message.error('Error al subir la imagen de la firma');
                              } finally {
                                setUploadingFirma(false);
                              }
                              return false;
                            }}
                          >
                            <Button icon={<UploadOutlined />} loading={uploadingFirma}>
                              {firmanteFirmaUrl ? 'Cambiar Imagen de Firma' : 'Subir Imagen de Firma / Sello'}
                            </Button>
                          </Upload>
                        </div>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="mostrar_logo"
                      valuePropName="checked"
                      label={<span style={{ fontWeight: 600 }}>Mostrar Logo de Parámetros del Sistema</span>}
                    >
                      <Switch checkedChildren="Sí" unCheckedChildren="No" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="activo"
                      valuePropName="checked"
                      label={<span style={{ fontWeight: 600 }}>Estado de la Plantilla</span>}
                    >
                      <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            ),
          },
          {
            key: 'preview',
            label: (
              <span>
                <EyeOutlined style={{ marginRight: 6 }} />
                Vista Previa del Documento (Hoja A4 Simulada)
              </span>
            ),
            children: (
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '24px 16px',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'center',
                  maxHeight: '65vh',
                  overflowY: 'auto',
                }}
              >
                {/* Hoja A4 Simulada */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 620,
                    minHeight: 880,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    borderRadius: 4,
                    padding: '44px 56px 36px 56px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    color: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div>
                    {/* Logotipo Superior */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      {mostrarLogo && logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo Empresa"
                          style={{ maxHeight: 52, maxWidth: 200, objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Arial, sans-serif', color: '#000000' }}>
                          {configSistema?.empresa_nombre || 'VITELAB'}
                        </div>
                      )}
                    </div>

                    {/* Título Subrayado (Posicionado en la zona central) */}
                    <div style={{ textAlign: 'center', marginTop: 55, marginBottom: 40 }}>
                      <h2
                        style={{
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          fontSize: 17,
                          fontWeight: 700,
                          textDecoration: 'underline',
                          letterSpacing: '1px',
                          color: '#000000',
                          textTransform: 'uppercase',
                          margin: 0,
                          display: 'inline-block',
                        }}
                      >
                        {tituloPreview || 'CONSTANCIA DE TRABAJO'}
                      </h2>
                    </div>

                    {/* Cuerpo */}
                    <div
                      style={{
                        fontSize: 13.5,
                        lineHeight: 2.0,
                        textAlign: 'justify',
                        marginBottom: 28,
                        color: '#000000',
                      }}
                    >
                      {renderTextoConNegritas(cuerpoPreview)}
                    </div>

                    {/* Cierre */}
                    {cierrePreview && (
                      <div
                        style={{
                          fontSize: 13.5,
                          lineHeight: 2.0,
                          textAlign: 'justify',
                          marginBottom: 32,
                          color: '#000000',
                        }}
                      >
                        {renderTextoConNegritas(cierrePreview)}
                      </div>
                    )}

                    {/* Ciudad y Fecha */}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        marginTop: 40,
                        marginBottom: 25,
                        color: '#000000',
                        textAlign: 'left',
                      }}
                    >
                      {ciudadPreview || 'LIMA'}, {fechaEspanolFormal(dayjs().format('YYYY-MM-DD'))}
                    </div>

                    {/* Bloque de Firma y Empresa alineado a la izquierda */}
                    <div style={{ marginTop: 80, width: 280, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      {firmanteFirmaUrl ? (
                        <img
                          src={getImageUrl(firmanteFirmaUrl) || ''}
                          alt="Firma"
                          style={{ maxHeight: 60, maxWidth: 170, objectFit: 'contain', marginBottom: -10, marginLeft: 10 }}
                        />
                      ) : (
                        <div style={{ height: 25 }} />
                      )}
                      <div style={{ width: 270, borderTop: '1.2px solid #000000', paddingTop: 6, textAlign: 'left', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#000000' }}>
                          {firmanteNombre || 'MONTOYA COTTLE ANAHI'}
                        </div>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#000000' }}>
                          {firmanteCargo || 'GERENTE DE GESTION DE PERSONAS'}
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: '#000000', lineHeight: 1.45, textTransform: 'uppercase' }}>
                        <div style={{ fontWeight: 700 }}>
                          {configSistema?.empresa_razon_social || configSistema?.empresa_nombre || 'CLINICA INTERNACIONAL S.A.'}
                        </div>
                        <div>
                          {configSistema?.empresa_direccion || 'JR. WASHINGTON NRO.1471 - LIMA - LIMA'}
                        </div>
                        <div>
                          RUC: {configSistema?.empresa_ruc || '20100054184'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
