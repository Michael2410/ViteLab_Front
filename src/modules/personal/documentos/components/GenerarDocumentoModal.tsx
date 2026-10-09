import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Checkbox,
  Row,
  Col,
  Alert,
  Button,
  Tag,
} from 'antd';
import {
  FileTextOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { Personal } from '../../types';
import { usePlantillas } from '../../../configuracion/plantillas-documentos/hooks';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';
import { useAuthStore } from '../../../auth/hooks';

dayjs.locale('es');

interface GenerarDocumentoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any, colabInfo: any) => Promise<void>;
  loading: boolean;
  personalList: Personal[];
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
];

function fechaEspanol(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const d = dayjs(fechaStr);
  if (!d.isValid()) return fechaStr;
  return `${d.date()} de ${MESES[d.month()]} del ${d.year()}`;
}

export const GenerarDocumentoModal: React.FC<GenerarDocumentoModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  personalList,
}) => {
  const [form] = Form.useForm();
  const { data: plantillas = [] } = usePlantillas();
  const { data: configuracion } = useConfiguracion();
  const { user } = useAuthStore();

  const [selectedColabId, setSelectedColabId] = useState<number | undefined>();
  const [selectedTipo, setSelectedTipo] = useState<string>('CONSTANCIA_TRABAJO');
  const [incluirRemuneracion, setIncluirRemuneracion] = useState<boolean>(true);
  const [destinatario, setDestinatario] = useState<string>('A quien corresponda');
  const [firmanteFirmaUrl, setFirmanteFirmaUrl] = useState<string>('');

  // Encontrar la plantilla correspondiente
  const plantillaActiva = useMemo(() => {
    return plantillas.find((p) => p.tipo_documento === selectedTipo && p.activo) ||
      plantillas.find((p) => p.tipo_documento === selectedTipo) ||
      null;
  }, [plantillas, selectedTipo]);

  const selectedColab = useMemo(() => {
    return personalList.find((p) => p.id === selectedColabId);
  }, [personalList, selectedColabId]);

  // Generar texto interpolado
  const textoInterpoladoGenerado = useMemo(() => {
    const rawTemplate = plantillaActiva?.cuerpo_template || (
      selectedTipo === 'CONSTANCIA_TRABAJO'
        ? `Por medio del presente documento, la Dirección de Gestión del Talento Humano de {empresa_razon_social} hace constar que {colaborador_nombre}, identificado(a) con {colaborador_tipo_doc} N° {colaborador_num_doc}, labora en nuestra organización desempeñando el cargo de {cargo} en el área de {area}, desde el {fecha_ingreso} hasta la actualidad.`
        : selectedTipo === 'CERTIFICADO_LABORAL'
        ? `Por medio del presente certificado, la Dirección de Gestión del Talento Humano de {empresa_razon_social} certifica que {colaborador_nombre}, identificado(a) con {colaborador_tipo_doc} N° {colaborador_num_doc}, laboró en nuestra organización desempeñando el cargo de {cargo} en el área de {area}, desde el {fecha_ingreso} hasta el {fecha_cese}.`
        : `Por medio de la presente, nos dirigimos a usted con la finalidad de presentar a {colaborador_nombre}, identificado(a) con {colaborador_tipo_doc} N° {colaborador_num_doc}, quien se desempeña como {cargo} en nuestra institución {empresa_razon_social}.`
    );

    const nombreCompleto = selectedColab
      ? `${selectedColab.nombres || ''} ${selectedColab.apellidos || ''}`.trim().toUpperCase()
      : '{colaborador_nombre}';

    const fechaIng = selectedColab?.fecha_ingreso ? fechaEspanol(selectedColab.fecha_ingreso) : 'la fecha de ingreso';
    const fechaCes = selectedColab?.fecha_cese ? fechaEspanol(selectedColab.fecha_cese) : 'la fecha';
    const sueldoTxt = selectedColab?.sueldo_base && incluirRemuneracion
      ? `S/ ${Number(selectedColab.sueldo_base).toFixed(2)} Soles`
      : 'No consignado';

    const vars: Record<string, string> = {
      colaborador_nombre: nombreCompleto,
      colaborador_apellidos: selectedColab?.apellidos?.toUpperCase() || '{colaborador_apellidos}',
      colaborador_nombres: selectedColab?.nombres?.toUpperCase() || '{colaborador_nombres}',
      colaborador_documento: `${selectedColab?.tipo_documento || 'DNI'} N° ${selectedColab?.numero_documento || 'S/N'}`,
      colaborador_num_doc: selectedColab?.numero_documento || 'S/N',
      colaborador_tipo_doc: selectedColab?.tipo_documento || 'DNI',
      cargo: selectedColab?.cargo?.toUpperCase() || 'COLABORADOR(A)',
      area: selectedColab?.area?.toUpperCase() || 'OPERACIONES',
      fecha_ingreso: fechaIng,
      fecha_cese: fechaCes,
      sueldo: sueldoTxt,
      remuneracion_actual: sueldoTxt,
      destinatario: destinatario || 'A quien corresponda',
      fecha_emision: fechaEspanol(dayjs().format('YYYY-MM-DD')),
      fecha_actual: fechaEspanol(dayjs().format('YYYY-MM-DD')),
      ciudad_emision: plantillaActiva?.ciudad_defecto || 'LIMA',
      empresa_nombre: configuracion?.empresa_razon_social || configuracion?.empresa_nombre || 'VITELAB LABORATORIO CLÍNICO S.A.C.',
      empresa_razon_social: configuracion?.empresa_razon_social || configuracion?.empresa_nombre || 'VITELAB LABORATORIO CLÍNICO S.A.C.',
      empresa_ruc: configuracion?.empresa_ruc || '20608945123',
      empresa_direccion: configuracion?.empresa_direccion || '',
      firmante_nombre: plantillaActiva?.firmante_nombre || `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'DIRECCIÓN DE GESTIÓN HUMANA',
      firmante_cargo: plantillaActiva?.firmante_cargo || 'JEFE DE RECURSOS HUMANOS',
    };

    let result = rawTemplate;
    for (const [key, val] of Object.entries(vars)) {
      const reg = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(reg, val);
    }
    return result;
  }, [plantillaActiva, selectedTipo, selectedColab, incluirRemuneracion, destinatario, configuracion, user]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedColabId(undefined);
      setSelectedTipo('CONSTANCIA_TRABAJO');
      setIncluirRemuneracion(true);
      setDestinatario('A quien corresponda');

      const defFirmanteNom = plantillaActiva?.firmante_nombre || `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'DIRECCIÓN DE GESTIÓN HUMANA';
      const defFirmanteCar = plantillaActiva?.firmante_cargo || 'JEFE DE RECURSOS HUMANOS';
      const defFirmaUrl = plantillaActiva?.firmante_firma_url || '';

      setFirmanteFirmaUrl(defFirmaUrl);
      form.setFieldsValue({
        tipo_documento: 'CONSTANCIA_TRABAJO',
        destinatario: 'A quien corresponda',
        incluir_remuneracion: true,
        firmante_nombre: defFirmanteNom,
        firmante_cargo: defFirmanteCar,
        firmante_firma_url: defFirmaUrl,
      });
    }
  }, [open, form]);

  // Al cambiar colaborador o tipo, actualizar el cuerpo del texto y la firma por defecto
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        contenido_personalizado: textoInterpoladoGenerado,
        firmante_nombre: form.getFieldValue('firmante_nombre') || plantillaActiva?.firmante_nombre || `${user?.nombres || ''} ${user?.apellidos || ''}`.trim(),
        firmante_cargo: form.getFieldValue('firmante_cargo') || plantillaActiva?.firmante_cargo || 'JEFE DE RECURSOS HUMANOS',
      });
      if (plantillaActiva?.firmante_firma_url && !firmanteFirmaUrl) {
        setFirmanteFirmaUrl(plantillaActiva.firmante_firma_url);
        form.setFieldsValue({ firmante_firma_url: plantillaActiva.firmante_firma_url });
      }
    }
  }, [textoInterpoladoGenerado, open, plantillaActiva]);

  const handleFinish = async (values: any) => {
    const colab = personalList.find((p) => p.id === values.personal_id);
    const colabInfo = {
      nombre: colab ? `${colab.nombres} ${colab.apellidos}` : 'Colaborador',
      documento: `${colab?.tipo_documento || 'DNI'} Nº ${colab?.numero_documento || 'S/N'}`,
      cargo: colab?.cargo || 'Colaborador',
      sueldo: colab?.sueldo_base || null,
      fecha_ingreso: colab?.fecha_ingreso || null,
      fecha_cese: colab?.fecha_cese || null,
    };

    const payload = {
      personal_id: values.personal_id,
      tipo_documento: values.tipo_documento,
      destinatario: values.destinatario || 'A quien corresponda',
      incluir_remuneracion: values.incluir_remuneracion ?? true,
      observaciones: values.observaciones || null,
      contenido_personalizado: values.contenido_personalizado || textoInterpoladoGenerado,
      firmante_nombre: values.firmante_nombre || plantillaActiva?.firmante_nombre || null,
      firmante_cargo: values.firmante_cargo || plantillaActiva?.firmante_cargo || null,
      firmante_firma_url: firmanteFirmaUrl || plantillaActiva?.firmante_firma_url || null,
      plantilla_id: plantillaActiva?.id || undefined,
    };

    await onSubmit(payload, colabInfo);
  };

  const restaurarTexto = () => {
    form.setFieldsValue({ contenido_personalizado: textoInterpoladoGenerado });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a',
            fontSize: 16,
          }}>
            <FileTextOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Emitir Documento / Certificado Laboral
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Generación dinámica vinculada a las plantillas de RRHH
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Emitir Documento"
      cancelText="Cancelar"
      width={780}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 14 }}>
        <Row gutter={16}>
          {/* Colaborador */}
          <Col xs={24} sm={14}>
            <Form.Item
              name="personal_id"
              label={
                <span style={{ fontWeight: 600 }}>
                  <UserOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                  Colaborador
                </span>
              }
              rules={[{ required: true, message: 'Seleccione un colaborador' }]}
            >
              <Select
                showSearch
                placeholder="Buscar por colaborador..."
                optionFilterProp="label"
                onChange={(val) => setSelectedColabId(val)}
                options={personalList.map((p) => ({
                  label: `${p.apellidos}, ${p.nombres} — ${p.cargo || 'Sin cargo'} (${p.tipo_documento || 'DNI'}: ${p.numero_documento || 'S/N'})`,
                  value: p.id,
                }))}
              />
            </Form.Item>
          </Col>

          {/* Tipo de Documento */}
          <Col xs={24} sm={10}>
            <Form.Item
              name="tipo_documento"
              label={<span style={{ fontWeight: 600 }}>Tipo de Documento</span>}
              rules={[{ required: true, message: 'Seleccione el tipo' }]}
            >
              <Select
                onChange={(val) => setSelectedTipo(val)}
                options={[
                  { label: '📄 Constancia de Trabajo (Activo)', value: 'CONSTANCIA_TRABAJO' },
                  { label: '📜 Certificado Laboral (Histórico/Cese)', value: 'CERTIFICADO_LABORAL' },
                  { label: '✉️ Carta de Presentación', value: 'CARTA_PRESENTACION' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {plantillaActiva && (
          <div style={{
            margin: '0 0 14px',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>
                Plantilla: {plantillaActiva.nombre}
              </Tag>
              <span style={{ color: '#64748b' }}>
                Título: <strong>{plantillaActiva.titulo_documento}</strong>
              </span>
            </div>
            <span style={{ color: '#0d9488', fontSize: 11, fontWeight: 500 }}>
              ✓ Hereda logotipo & RUC de Parámetros del Sistema
            </span>
          </div>
        )}

        <Row gutter={16}>
          {/* Destinatario */}
          <Col xs={24} sm={14}>
            <Form.Item name="destinatario" label="Dirigido a / Destinatario">
              <Input
                placeholder="Ej: A quien corresponda / Entidad Financiera / Universidad..."
                onChange={(e) => setDestinatario(e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Remuneración */}
          <Col xs={24} sm={10}>
            <Form.Item
              name="incluir_remuneracion"
              valuePropName="checked"
              style={{ marginTop: 28 }}
            >
              <Checkbox onChange={(e) => setIncluirRemuneracion(e.target.checked)}>
                Consignar sueldo mensual
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>

        {/* Contenido Dinámico / Personalizado */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
            Cuerpo del Documento (Editable para esta emisión)
          </span>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={restaurarTexto}
            style={{ padding: 0, fontSize: 12 }}
          >
            Restaurar borrador de plantilla
          </Button>
        </div>

        <Form.Item
          name="contenido_personalizado"
          rules={[{ required: true, message: 'El cuerpo del documento no puede estar vacío' }]}
        >
          <Input.TextArea
            rows={5}
            placeholder="Redacte o ajuste el contenido del documento antes de emitir..."
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 8,
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="firmante_nombre"
              label="Nombre del Firmante"
              tooltip="Nombre y apellidos del responsable que firma el documento"
            >
              <Input placeholder="Ej: Dr. Roberto Gómez" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="firmante_cargo"
              label="Cargo del Firmante"
              tooltip="Cargo institucional del firmante"
            >
              <Input placeholder="Ej: Jefe de Recursos Humanos" />
            </Form.Item>
          </Col>

        </Row>

        <Form.Item name="observaciones" label="Observaciones internas / Cláusula adicional (Opcional)">
          <Input.TextArea rows={2} placeholder="Detalles o anotaciones particulares para el legajo..." />
        </Form.Item>

        <Alert
          showIcon
          type="info"
          message={
            <span style={{ fontSize: 12 }}>
              Al hacer clic en <strong>"Emitir Documento"</strong>, se congelará el contenido con un código oficial de emisión correlativo y quedará listo para su visualización e impresión en formato A4 con membrete institucional.
            </span>
          }
          style={{ borderRadius: 8 }}
        />
      </Form>
    </Modal>
  );
};
