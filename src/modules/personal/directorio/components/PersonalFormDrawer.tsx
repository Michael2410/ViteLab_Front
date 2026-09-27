import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tabs,
  Upload,
  message,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  UploadOutlined,
  DeleteOutlined,
  IdcardOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import type { Personal } from '../../types';
import {
  useCargos,
  useAreasPersonal,
  useTiposContrato,
} from '../../hooks';
import { uploadFile } from '../../../../shared/utils/apiClient';
import { useConsultarDni } from '../../../laboratorio/ordenes/hooks';

interface PersonalFormDrawerProps {
  open: boolean;
  personal: Personal | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const PersonalFormDrawer: React.FC<PersonalFormDrawerProps> = ({
  open,
  personal,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [uploadingFirma, setUploadingFirma] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const consultarDniMutation = useConsultarDni();

  // Cargar catálogos dinámicos
  const { data: catalogoCargos = [], isLoading: loadingCargos } = useCargos();
  const { data: catalogoAreas = [], isLoading: loadingAreas } = useAreasPersonal();
  const { data: catalogoTiposContrato = [], isLoading: loadingContratos } = useTiposContrato();

  // Opciones dinámicas de cargos
  const cargoOptions = React.useMemo(() => {
    return catalogoCargos
      .filter((c) => c.activo || c.id === personal?.cargo_id || c.nombre === personal?.cargo)
      .map((c) => ({
        label: c.nombre,
        value: c.id,
        nombre: c.nombre,
      }));
  }, [catalogoCargos, personal]);

  // Opciones dinámicas de áreas
  const areaOptions = React.useMemo(() => {
    return catalogoAreas
      .filter((a) => a.activo || a.id === personal?.area_id || a.nombre === personal?.area)
      .map((a) => ({
        label: a.nombre,
        value: a.id,
        nombre: a.nombre,
      }));
  }, [catalogoAreas, personal]);

  // Opciones dinámicas de tipos de contrato
  const contratoOptions = React.useMemo(() => {
    return catalogoTiposContrato
      .filter((t) => t.activo || t.id === personal?.tipo_contrato_id || t.nombre === personal?.tipo_contrato)
      .map((t) => ({
        label: t.nombre,
        value: t.id,
        nombre: t.nombre,
      }));
  }, [catalogoTiposContrato, personal]);

  // Cargar datos en edición
  useEffect(() => {
    if (open) {
      if (personal) {
        const cargoId = personal.cargo_id ?? catalogoCargos.find((c) => c.nombre.toLowerCase() === personal.cargo?.toLowerCase())?.id;
        const areaId = personal.area_id ?? catalogoAreas.find((a) => a.nombre.toLowerCase() === personal.area?.toLowerCase())?.id;
        const contratoId = personal.tipo_contrato_id ?? catalogoTiposContrato.find((t) => t.nombre.toLowerCase() === personal.tipo_contrato?.toLowerCase())?.id;

        form.setFieldsValue({
          tipo_documento: personal.tipo_documento || 'DNI',
          numero_documento: personal.numero_documento,
          nombres: personal.nombres,
          apellidos: personal.apellidos,
          cargo_id: cargoId,
          area_id: areaId,
          email: personal.email,
          telefono: personal.telefono,
          direccion: personal.direccion,
          fecha_nacimiento: personal.fecha_nacimiento ? dayjs(personal.fecha_nacimiento) : null,
          fecha_ingreso: personal.fecha_ingreso ? dayjs(personal.fecha_ingreso) : null,
          tipo_contrato_id: contratoId,
          sueldo_base: personal.sueldo_base,
          colegiatura: personal.colegiatura,
          activo: personal.activo,
        });

        setFirmaUrl(personal.firma_url);
        if (personal.firma_url) {
          setFileList([
            {
              uid: '-1',
              name: 'firma_digital.png',
              status: 'done',
              url: personal.firma_url,
            },
          ]);
        } else {
          setFileList([]);
        }
      } else {
        const defaultArea = catalogoAreas.find((a) => a.nombre.toLowerCase().includes('laboratorio'))?.id || catalogoAreas[0]?.id;
        const defaultContrato = catalogoTiposContrato[0]?.id;

        form.resetFields();
        form.setFieldsValue({
          tipo_documento: 'DNI',
          area_id: defaultArea,
          tipo_contrato_id: defaultContrato,
          activo: true,
        });
        setFirmaUrl(null);
        setFileList([]);
      }
      setActiveTab('1');
    }
  }, [open, personal, form, catalogoCargos, catalogoAreas, catalogoTiposContrato]);

  // Consulta RENIEC vía hook existente
  const handleConsultarDni = async () => {
    const numDoc = form.getFieldValue('numero_documento');
    const tipoDoc = form.getFieldValue('tipo_documento');

    if (!numDoc || tipoDoc !== 'DNI') {
      message.warning('Ingrese un número de DNI válido para consultar en RENIEC');
      return;
    }

    try {
      const res = await consultarDniMutation.mutateAsync(numDoc);
      const dniData = (res as any)?.data || (res as any);
      if (dniData) {
        const nombres = dniData.nombres || '';
        const apePaterno = dniData.apellidoPaterno || dniData.apellido_paterno || '';
        const apeMaterno = dniData.apellidoMaterno || dniData.apellido_materno || '';
        form.setFieldsValue({
          nombres,
          apellidos: `${apePaterno} ${apeMaterno}`.trim(),
        });
        message.success('Datos obtenidos de RENIEC correctamente');
      }
    } catch {
      message.error('No se pudo consultar el DNI en RENIEC');
    }
  };

  // Subir firma digital
  const handleUploadFirma = async (file: File) => {
    try {
      setUploadingFirma(true);
      const res = await uploadFile(file, 'firmas');
      if (res && res.url) {
        setFirmaUrl(res.url);
        setFileList([
          {
            uid: file.name,
            name: file.name,
            status: 'done',
            url: res.url,
          },
        ]);
        message.success('Firma digital cargada correctamente');
      }
    } catch (err) {
      console.error(err);
      message.error('Error al subir imagen de firma');
    } finally {
      setUploadingFirma(false);
    }
    return false; // Prevent automatic antd upload
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const selectedCargo = catalogoCargos.find((c) => c.id === values.cargo_id);
      const selectedArea = catalogoAreas.find((a) => a.id === values.area_id);
      const selectedContrato = catalogoTiposContrato.find((t) => t.id === values.tipo_contrato_id);

      const payload: any = {
        ...values,
        cargo_id: values.cargo_id || null,
        cargo: selectedCargo ? selectedCargo.nombre : null,
        area_id: values.area_id || null,
        area: selectedArea ? selectedArea.nombre : 'Laboratorio',
        tipo_contrato_id: values.tipo_contrato_id || null,
        tipo_contrato: selectedContrato ? selectedContrato.nombre : null,
        firma_url: firmaUrl,
        fecha_nacimiento: values.fecha_nacimiento ? values.fecha_nacimiento.format('YYYY-MM-DD') : null,
        fecha_ingreso: values.fecha_ingreso ? values.fecha_ingreso.format('YYYY-MM-DD') : null,
      };

      await onSubmit(payload);
    } catch (err: any) {
      if (err?.errorFields && err.errorFields.length > 0) {
        const firstField = err.errorFields[0].name[0];
        if (['tipo_documento', 'numero_documento', 'nombres', 'apellidos'].includes(firstField)) {
          setActiveTab('1');
        } else {
          setActiveTab('2');
        }
      }
      console.error('Error de validación:', err);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 18,
            }}
          >
            <IdcardOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {personal ? `Editar Colaborador: ${personal.nombres}` : 'Nuevo Colaborador'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {personal ? `Ficha #${personal.id} • ${personal.cargo || 'Sin cargo'}` : 'Ficha de registro de talento humano'}
            </div>
          </div>
        </div>
      }
      placement="right"
      width={680}
      onClose={onClose}
      open={open}
      styles={{
        body: { padding: '16px 24px', backgroundColor: '#f8fafc' },
        footer: {
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 24px',
        },
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Cancelar
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              color: '#ffffff',
            }}
          >
            {personal ? 'Guardar Cambios' : 'Registrar Colaborador'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: (
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <IdcardOutlined /> Datos Personales
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                    <Form.Item
                      name="tipo_documento"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Tipo Doc.</span>}
                    >
                      <Select style={{ width: '100%' }}>
                        <Select.Option value="DNI">DNI</Select.Option>
                        <Select.Option value="Carnet Extranjería">Carnet Extranjería</Select.Option>
                        <Select.Option value="Pasaporte">Pasaporte</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="numero_documento"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>N° Documento</span>}
                    >
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="Número de documento"
                          maxLength={20}
                          style={{ borderRadius: '8px 0 0 8px' }}
                        />
                        <Button
                          icon={<SearchOutlined />}
                          onClick={handleConsultarDni}
                          loading={consultarDniMutation.isPending}
                          style={{
                            borderRadius: '0 8px 8px 0',
                            backgroundColor: '#eff6ff',
                            borderColor: '#bfdbfe',
                            color: '#2563eb',
                            fontWeight: 600,
                          }}
                        >
                          Reniec
                        </Button>
                      </Space.Compact>
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                      name="nombres"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Nombres *</span>}
                      rules={[{ required: true, message: 'Ingrese nombres' }]}
                    >
                      <Input placeholder="Ej. Juan Carlos" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                      name="apellidos"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Apellidos *</span>}
                      rules={[{ required: true, message: 'Ingrese apellidos' }]}
                    >
                      <Input placeholder="Ej. Pérez Gómez" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                      name="fecha_nacimiento"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Fecha de Nacimiento</span>}
                    >
                      <DatePicker
                        placeholder="DD/MM/AAAA"
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="telefono"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Teléfono Móvil</span>}
                    >
                      <Input placeholder="999 888 777" maxLength={20} style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="email"
                    label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Correo Electrónico Personal</span>}
                    rules={[{ type: 'email', message: 'Email inválido' }]}
                  >
                    <Input placeholder="correo@ejemplo.com" style={{ borderRadius: 8 }} />
                  </Form.Item>

                  <Form.Item
                    name="direccion"
                    label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Dirección Domiciliaria</span>}
                  >
                    <Input.TextArea rows={2} placeholder="Av. Principal 123, Urb. Los Álamos" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </div>
              ),
            },
            {
              key: '2',
              label: (
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <BankOutlined /> Datos Laborales
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  {personal?.fecha_cese && (
                    <Alert
                      type="error"
                      showIcon
                      style={{
                        borderRadius: 10,
                        marginBottom: 18,
                        backgroundColor: '#fff1f2',
                        borderColor: '#fecdd3',
                      }}
                      message={
                        <span style={{ fontWeight: 700, color: '#9f1239' }}>
                          Colaborador en Condición de Cese / Baja
                        </span>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#881337', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div>
                            <strong>Fecha de Cese:</strong> {dayjs(personal.fecha_cese).format('DD/MM/YYYY')}
                          </div>
                          {personal.motivo_cese && (
                            <div>
                              <strong>Motivo registrado:</strong> {personal.motivo_cese}
                            </div>
                          )}
                          {personal.observaciones_cese && (
                            <div>
                              <strong>Observaciones:</strong> {personal.observaciones_cese}
                            </div>
                          )}
                        </div>
                      }
                    />
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                      name="cargo_id"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Cargo / Puesto</span>}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Seleccione cargo"
                        loading={loadingCargos}
                        options={cargoOptions}
                        optionFilterProp="label"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="area_id"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Área de Trabajo</span>}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Seleccione área"
                        loading={loadingAreas}
                        options={areaOptions}
                        optionFilterProp="label"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                      name="tipo_contrato_id"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Tipo de Contrato</span>}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Seleccionar contrato"
                        loading={loadingContratos}
                        options={contratoOptions}
                        optionFilterProp="label"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="sueldo_base"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Sueldo Base Mensual</span>}
                    >
                      <InputNumber
                        min={0}
                        prefix="S/. "
                        style={{ width: '100%', borderRadius: 8 }}
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                      name="colegiatura"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>N° Colegiatura (CMP/CBP/CTMP)</span>}
                    >
                      <Input placeholder="Ej. CBP 12345" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                      name="fecha_ingreso"
                      label={<span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>Fecha de Ingreso</span>}
                    >
                      <DatePicker
                        placeholder="Fecha de ingreso"
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </div>

                  {/* Firma Digital */}
                  <div style={{
                    marginTop: 12,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                      Firma Digital / Rúbrica
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
                      Utilizada para estampación automática en resultados validados por este colaborador.
                    </div>

                    {firmaUrl && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        marginBottom: 12,
                      }}>
                        <img
                          src={firmaUrl}
                          alt="Firma"
                          style={{ maxHeight: 44, maxWidth: 140, objectFit: 'contain', backgroundColor: '#ffffff', padding: 4, borderRadius: 4 }}
                        />
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setFirmaUrl(null);
                            setFileList([]);
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}

                    <Upload
                      beforeUpload={handleUploadFirma}
                      fileList={fileList}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploadingFirma}
                        style={{ borderRadius: 8 }}
                      >
                        {firmaUrl ? 'Reemplazar Firma Digital' : 'Subir Imagen de Firma (PNG/JPG)'}
                      </Button>
                    </Upload>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Drawer>
  );
};
