import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Drawer,
  Form,
  Button,
  Row,
  Col,
  Select,
  Input,
  Space,
  Typography,
  App,
  AutoComplete,
  theme,
  Tag,
  Avatar,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  UserOutlined,
  SolutionOutlined,
  ExperimentOutlined,
  RightOutlined,
  LeftOutlined,
  ShopOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  CheckOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../../../auth/hooks';
import { BuscarPaciente } from './BuscarPaciente';
import { SeleccionAnalisis, type AnalisisConMuestras } from './SeleccionAnalisis';
import {
  useOrdenDetalle,
  useActualizarOrden,
  useSedesActivas,
  useTiposClienteActivos,
  useConveniosActivos,
  useMedicos,
} from '../hooks';
import type { UpdateOrdenInput, PacienteFormInput, AnalisisSeleccionado } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EditarOrdenDrawerProps {
  open: boolean;
  ordenId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditarOrdenDrawer: React.FC<EditarOrdenDrawerProps> = ({
  open,
  ordenId,
  onClose,
  onSuccess,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { hasPermission, user } = useAuthStore();
  const isSuperAdmin = user?.rol_nombre === 'SUPER_ADMIN' || user?.rol_id === 1;
  const canUpdate = isSuperAdmin || hasPermission('orders.update');

  const wasOpenRef = useRef(false);

  // --- Estado y Formularios ---
  const [formPaciente] = Form.useForm();
  const [formOrden] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<AnalisisSeleccionado[]>([]);
  const [analisisIniciales, setAnalisisIniciales] = useState<AnalisisConMuestras[]>([]);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<number | null>(null);
  const [convenioId, setConvenioId] = useState<number | undefined>(undefined);
  const [pacienteSummary, setPacienteSummary] = useState<any>(null);
  const [datosCargados, setDatosCargados] = useState(false);

  // --- Queries y Mutaciones ---
  const validId = open && ordenId ? ordenId : 0;
  const { data: orden, isLoading: loadingOrden } = useOrdenDetalle(validId, validId > 0);
  const actualizarOrdenMutation = useActualizarOrden();
  const { data: sedes, isLoading: loadingSedes } = useSedesActivas();
  const { data: tiposCliente, isLoading: loadingTipos } = useTiposClienteActivos();
  const { data: convenios, isLoading: loadingConvenios } = useConveniosActivos();
  const { data: medicosExistentes } = useMedicos();

  // Reset al cerrar o cambiar de orden
  const resetAll = () => {
    formPaciente.resetFields();
    formOrden.resetFields();
    setCurrentStep(0);
    setAnalisisSeleccionados([]);
    setAnalisisIniciales([]);
    setTipoClienteSeleccionado(null);
    setConvenioId(undefined);
    setPacienteSummary(null);
    setDatosCargados(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Cargar datos de la orden a editar
  useEffect(() => {
    if (open && orden && !datosCargados) {
      // 1. Paciente
      if (orden.paciente) {
        const generoVal = orden.paciente.genero || (orden.paciente as any).sexo;
        let apPaterno = orden.paciente.apellido_paterno;
        let apMaterno = orden.paciente.apellido_materno;
        if ((!apPaterno || !apMaterno) && (orden.paciente as any).apellidos) {
          const parts = String((orden.paciente as any).apellidos || '').trim().split(' ');
          if (!apPaterno) apPaterno = parts[0] || '';
          if (!apMaterno) apMaterno = parts.slice(1).join(' ') || '';
        }

        formPaciente.setFieldsValue({
          dni: orden.paciente.dni,
          nombres: orden.paciente.nombres,
          apellido_paterno: apPaterno,
          apellido_materno: apMaterno,
          fecha_nacimiento: orden.paciente.fecha_nacimiento
            ? dayjs(orden.paciente.fecha_nacimiento)
            : undefined,
          genero: generoVal,
          telefono: orden.paciente.telefono || undefined,
          email: orden.paciente.email || undefined,
          direccion: orden.paciente.direccion || undefined,
        });
        setPacienteSummary({
          dni: orden.paciente.dni,
          nombres: orden.paciente.nombres,
          apellido_paterno: apPaterno,
          apellido_materno: apMaterno,
          genero: generoVal,
          telefono: orden.paciente.telefono,
          email: orden.paciente.email,
          direccion: orden.paciente.direccion,
        });
      }

      // 2. Orden
      formOrden.setFieldsValue({
        sede_id: orden.sede_id,
        tipo_cliente_id: orden.tipo_cliente_id,
        convenio_id: orden.convenio_id || undefined,
        medico: orden.medico || undefined,
        nota: orden.nota || undefined,
      });
      setTipoClienteSeleccionado(orden.tipo_cliente_id);
      setConvenioId(orden.convenio_id || undefined);

      // 3. Análisis
      if (orden.analisis && Array.isArray(orden.analisis)) {
        const initialSelected: AnalisisSeleccionado[] = orden.analisis.map((oa) => ({
          id: oa.analisis_id,
          muestras_ids: oa.muestras_ids || [],
          precio: Number(oa.precio),
        }));

        const initialList: AnalisisConMuestras[] = orden.analisis.map((oa) => ({
          id: oa.analisis_id,
          nombre: oa.nombre || oa.analisis?.nombre || `Análisis #${oa.analisis_id}`,
          activo: true,
          precio: Number(oa.precio),
          muestras_ids: oa.muestras_ids || [],
          componentes: oa.analisis?.componentes || [],
        }));

        setAnalisisSeleccionados(initialSelected);
        setAnalisisIniciales(initialList);
      }

      setDatosCargados(true);
    }
  }, [open, orden, datosCargados, formPaciente, formOrden]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      resetAll();
    }
  }, [open]);

  // Médicos
  const medicoOptions = useMemo(() => {
    return (
      medicosExistentes?.map((medico) => ({
        value: medico,
        label: (
          <Space>
            <UserOutlined style={{ color: token.colorTextSecondary }} />
            {medico}
          </Space>
        ),
      })) || []
    );
  }, [medicosExistentes, token]);

  const tipoClienteParticular = tiposCliente?.find(
    (t) => t.nombre.toLowerCase() === 'particular'
  );
  const esParticular = tipoClienteSeleccionado === tipoClienteParticular?.id;

  useEffect(() => {
    if (esParticular) {
      formOrden.setFieldValue('convenio_id', undefined);
      setConvenioId(undefined);
    }
  }, [esParticular, formOrden]);

  const steps = [
    { title: 'Paciente', subTitle: 'Identificación', icon: <UserOutlined /> },
    { title: 'Detalles', subTitle: 'Sede y Tarifario', icon: <SolutionOutlined /> },
    { title: 'Análisis', subTitle: 'Selección y Precios', icon: <ExperimentOutlined /> },
  ];

  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        const pVals = await formPaciente.validateFields();
        setPacienteSummary(pVals);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        await formOrden.validateFields();
        setCurrentStep(2);
      }
    } catch {
      message.error('Por favor complete todos los campos obligatorios del paso actual');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!canUpdate) {
      message.error('No tienes permisos para editar órdenes.');
      return;
    }
    if (!ordenId) return;

    try {
      if (analisisSeleccionados.length === 0) {
        message.error('Debe seleccionar al menos un análisis');
        return;
      }

      const pacienteValues = await formPaciente.validateFields();
      const ordenValues = await formOrden.validateFields();

      const pacienteData: PacienteFormInput = {
        dni: pacienteValues.dni,
        nombres: pacienteValues.nombres,
        apellido_paterno: pacienteValues.apellido_paterno,
        apellido_materno: pacienteValues.apellido_materno,
        fecha_nacimiento: pacienteValues.fecha_nacimiento
          ? dayjs(pacienteValues.fecha_nacimiento).format('YYYY-MM-DD')
          : '',
        genero: pacienteValues.genero,
        telefono: pacienteValues.telefono || undefined,
        email: pacienteValues.email || undefined,
        direccion: pacienteValues.direccion || undefined,
      };

      const updateData: UpdateOrdenInput = {
        paciente: pacienteData,
        sede_id: ordenValues.sede_id,
        tipo_cliente_id: ordenValues.tipo_cliente_id,
        convenio_id: esParticular ? undefined : ordenValues.convenio_id || undefined,
        analisis: analisisSeleccionados,
        nota: ordenValues.nota || undefined,
        medico: ordenValues.medico || undefined,
      };

      await actualizarOrdenMutation.mutateAsync({
        id: ordenId,
        data: updateData,
      });

      message.success(`Orden #${orden?.numero_atencion || ordenId} actualizada exitosamente`);
      resetAll();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Error al actualizar la orden');
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      destroyOnHidden
      width={Math.min(940, typeof window !== 'undefined' ? window.innerWidth * 0.95 : 940)}
      styles={{
        header: {
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        },
        body: {
          padding: '20px 24px',
          background: '#f8fafc',
          overflowY: 'auto',
        },
        footer: {
          padding: '12px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 18,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
              }}
            >
              <EditOutlined />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Editar Orden {orden ? `#${orden.numero_atencion}` : ''}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Modificación de paciente, parámetros administrativos y pruebas
              </div>
            </div>
          </div>
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, padding: '2px 10px', fontSize: 12, marginRight: 24 }}>
            Paso {currentStep + 1} de 3
          </Tag>
        </div>
      }
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <InfoCircleOutlined style={{ color: '#0284c7', marginRight: 6 }} />
              {currentStep === 0 && 'Actualice o consulte los datos del paciente'}
              {currentStep === 1 && 'Sede de atención y tarifario aplicable'}
              {currentStep === 2 && `${analisisSeleccionados.length} análisis seleccionado(s)`}
            </Text>
          </div>

          <Space size="middle">
            <Button onClick={handleClose} style={{ borderRadius: 8, height: 38 }}>
              Cancelar
            </Button>

            {currentStep > 0 && (
              <Button
                onClick={handlePrevStep}
                icon={<LeftOutlined />}
                style={{
                  borderRadius: 8,
                  padding: '0 18px',
                  fontWeight: 600,
                  height: 38,
                }}
              >
                Atrás
              </Button>
            )}

            {currentStep < 2 ? (
              <Button
                type="primary"
                onClick={handleNextStep}
                style={{
                  borderRadius: 8,
                  padding: '0 22px',
                  fontWeight: 600,
                  height: 38,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  borderColor: '#0284c7',
                }}
              >
                Siguiente <RightOutlined />
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={actualizarOrdenMutation.isPending}
                onClick={handleSubmit}
                disabled={analisisSeleccionados.length === 0}
                style={{
                  borderRadius: 8,
                  padding: '0 24px',
                  fontWeight: 600,
                  height: 38,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981',
                }}
              >
                Guardar Cambios
              </Button>
            )}
          </Space>
        </div>
      }
    >
      {loadingOrden ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 350, gap: 12 }}>
          <Spin size="large" />
          <Text type="secondary" style={{ fontSize: 13 }}>Cargando datos de la orden...</Text>
        </div>
      ) : (
        <>
          {/* Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              padding: '12px 18px',
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              width: '100%',
            }}
          >
            {steps.map((step, idx) => {
              const isActive = currentStep === idx;
              const isCompleted = currentStep > idx;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: idx < steps.length - 1 ? 1 : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: isCompleted ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      if (isCompleted) setCurrentStep(idx);
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        transition: 'all 0.25s ease',
                        background: isCompleted
                          ? '#10b981'
                          : isActive
                          ? '#0284c7'
                          : '#f1f5f9',
                        color: isCompleted || isActive ? '#ffffff' : '#64748b',
                        border: isCompleted
                          ? '2px solid #10b981'
                          : isActive
                          ? '2px solid #0284c7'
                          : '1px solid #cbd5e1',
                        boxShadow: isActive ? '0 0 0 3px rgba(2, 132, 199, 0.2)' : 'none',
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? <CheckOutlined style={{ fontSize: 14 }} /> : idx + 1}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: isActive ? '#0f172a' : isCompleted ? '#334155' : '#64748b',
                          lineHeight: 1.2,
                        }}
                      >
                        {step.title}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{step.subTitle}</span>
                    </div>
                  </div>

                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        backgroundColor: '#e2e8f0',
                        margin: '0 14px',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        minWidth: 24,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: isCompleted ? '100%' : '0%',
                          background: '#10b981',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mini-Ficha del Paciente (Visible en Paso 1 y 2) */}
          {currentStep > 0 && (
            <div
              style={{
                background: 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '10px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                boxShadow: '0 1px 4px rgba(16, 185, 129, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                      {pacienteSummary?.nombres || formPaciente.getFieldValue?.('nombres') || ''}{' '}
                      {pacienteSummary?.apellido_paterno || formPaciente.getFieldValue?.('apellido_paterno') || ''}{' '}
                      {pacienteSummary?.apellido_materno || formPaciente.getFieldValue?.('apellido_materno') || ''}
                    </Text>
                    <Tag
                      color="blue"
                      style={{
                        borderRadius: 4,
                        fontWeight: 700,
                        margin: 0,
                        fontSize: 11,
                        padding: '0 6px',
                      }}
                    >
                      DNI: {pacienteSummary?.dni || formPaciente.getFieldValue?.('dni') || ''}
                    </Tag>
                    {(pacienteSummary?.genero || formPaciente.getFieldValue?.('genero')) && (
                      <Tag
                        color="cyan"
                        style={{
                          borderRadius: 4,
                          fontWeight: 600,
                          margin: 0,
                          fontSize: 11,
                          padding: '0 6px',
                        }}
                      >
                        {(pacienteSummary?.genero || formPaciente.getFieldValue?.('genero')) === 'M' ? 'Masculino' : 'Femenino'}
                      </Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {(pacienteSummary?.telefono || formPaciente.getFieldValue?.('telefono')) && `Tel: ${pacienteSummary?.telefono || formPaciente.getFieldValue?.('telefono')}  •  `}
                    {(pacienteSummary?.email || formPaciente.getFieldValue?.('email')) && `Email: ${pacienteSummary?.email || formPaciente.getFieldValue?.('email')}  •  `}
                    {pacienteSummary?.direccion || formPaciente.getFieldValue?.('direccion') || 'Sin dirección registrada'}
                  </div>
                </div>
              </div>

              <Button
                size="small"
                onClick={() => setCurrentStep(0)}
                icon={<EditOutlined />}
                style={{
                  borderRadius: 6,
                  fontWeight: 500,
                  color: '#0284c7',
                  borderColor: '#bae6fd',
                  background: '#ffffff',
                }}
              >
                Modificar Paciente
              </Button>
            </div>
          )}

          {/* Cuerpo */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: '20px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              minHeight: 460,
            }}
          >
            {/* Paso 0: Paciente */}
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
              <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                  Datos del Paciente
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Verifique o rectifique los datos personales del paciente
                </Text>
              </div>
              <BuscarPaciente form={formPaciente} />
            </div>

            {/* Paso 1: Orden */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                  Parámetros de la Orden
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Ajuste la sede, médico, tipo de cliente o convenio de atención
                </Text>
              </div>

              <Form
                form={formOrden}
                layout="vertical"
                size="large"
                requiredMark={false}
                onValuesChange={(changedValues) => {
                  if ('convenio_id' in changedValues) {
                    setConvenioId(changedValues.convenio_id);
                  }
                }}
              >
                <Row gutter={[16, 12]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={
                        <Space size={6}>
                          <ShopOutlined style={{ color: '#0284c7' }} />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Sede de Atención</span>
                        </Space>
                      }
                      name="sede_id"
                      rules={[{ required: true, message: 'Seleccione la sede' }]}
                      style={{ marginBottom: 16 }}
                    >
                      <Select
                        placeholder="Seleccione sede"
                        loading={loadingSedes}
                        style={{ borderRadius: 8 }}
                        options={sedes?.map((s) => ({ label: s.nombre, value: s.id }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={
                        <Space size={6}>
                          <TeamOutlined style={{ color: '#0284c7' }} />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Tipo de Cliente</span>
                        </Space>
                      }
                      name="tipo_cliente_id"
                      rules={[{ required: true, message: 'Seleccione el tipo de cliente' }]}
                      style={{ marginBottom: 16 }}
                    >
                      <Select
                        placeholder="Seleccione tipo"
                        loading={loadingTipos}
                        style={{ borderRadius: 8 }}
                        onChange={(value) => setTipoClienteSeleccionado(value)}
                        options={tiposCliente?.map((t) => ({ label: t.nombre, value: t.id }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={
                        <Space size={6}>
                          <MedicineBoxOutlined style={{ color: '#0284c7' }} />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Médico Referente</span>
                        </Space>
                      }
                      name="medico"
                      style={{ marginBottom: 16 }}
                    >
                      <AutoComplete
                        placeholder="Buscar o escribir nombre del médico..."
                        options={medicoOptions}
                        filterOption={(inputValue, option) =>
                          String(option!.value).toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                      >
                        <Input
                          prefix={<MedicineBoxOutlined style={{ color: '#94a3b8' }} />}
                          style={{ borderRadius: 8 }}
                        />
                      </AutoComplete>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    {!esParticular ? (
                      <Form.Item
                        label={
                          <Space size={6}>
                            <SolutionOutlined style={{ color: '#0284c7' }} />
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>Convenio / Empresa</span>
                          </Space>
                        }
                        name="convenio_id"
                        rules={[{ required: true, message: 'Seleccione el convenio' }]}
                        style={{ marginBottom: 16 }}
                      >
                        <Select
                          showSearch
                          placeholder="Buscar convenio..."
                          loading={loadingConvenios}
                          style={{ borderRadius: 8 }}
                          optionFilterProp="children"
                          onChange={(val) => setConvenioId(val)}
                          options={convenios?.map((c) => ({ label: c.nombre_empresa, value: c.id }))}
                        />
                      </Form.Item>
                    ) : (
                      <Form.Item
                        label={
                          <Space size={6}>
                            <SolutionOutlined style={{ color: '#0284c7' }} />
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>Tarifa Aplicada</span>
                          </Space>
                        }
                        style={{ marginBottom: 16 }}
                      >
                        <div
                          style={{
                            height: 40,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 12px',
                          }}
                        >
                          <Tag
                            color="blue"
                            style={{
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              margin: 0,
                              padding: '2px 10px',
                            }}
                          >
                            TARIFA PARTICULAR
                          </Tag>
                        </div>
                      </Form.Item>
                    )}
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Notas u Observaciones (Opcional)</span>}
                      name="nota"
                      style={{ marginBottom: 6 }}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Indicaciones especiales de la orden..."
                        showCount
                        maxLength={500}
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </div>

            {/* Paso 2: Análisis */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              <div
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                    Selección de Análisis
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {esParticular ? 'Tarifario Particular' : 'Tarifario de Convenio'} aplicado
                  </Text>
                </div>
                <Tag
                  color={analisisSeleccionados.length > 0 ? 'blue' : 'warning'}
                  style={{ fontSize: 13, padding: '3px 12px', borderRadius: 6, fontWeight: 600 }}
                >
                  {analisisSeleccionados.length} seleccionados
                </Tag>
              </div>

              <div style={{ minHeight: 250 }}>
                <SeleccionAnalisis
                  analisisSeleccionados={analisisSeleccionados}
                  onAnalisisChange={setAnalisisSeleccionados}
                  convenioId={esParticular ? undefined : convenioId}
                  analisisIniciales={analisisIniciales}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
};
