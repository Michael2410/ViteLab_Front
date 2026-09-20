import { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Button,
  Card,
  Row,
  Col,
  Select,
  Input,
  Space,
  Typography,
  message,
  AutoComplete,
  theme,
  Tag,
  Result,
  Avatar,
  Spin,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SolutionOutlined,
  ExperimentOutlined,
  RightOutlined,
  LeftOutlined,
  ShopOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  LockOutlined,
  CheckOutlined,
  EditOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../../auth/hooks';
import { BuscarPaciente } from '../components/BuscarPaciente';
import { SeleccionAnalisis, type AnalisisConMuestras } from '../components/SeleccionAnalisis';
import {
  useOrdenDetalle,
  useActualizarOrden,
  useSedesActivas,
  useTiposClienteActivos,
  useConveniosActivos,
  useMedicos,
} from '../hooks';
import {
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  EstadoOrden,
  type UpdateOrdenInput,
  type PacienteFormInput,
  type AnalisisSeleccionado,
} from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const EditarOrdenPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ordenId = Number(id);
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { hasPermission, user } = useAuthStore();
  const isSuperAdmin = user?.rol_nombre === 'SUPER_ADMIN' || user?.rol_id === 1;
  const canUpdate = isSuperAdmin || hasPermission('orders.update');

  // --- Estado y Formularios ---
  const [formPaciente] = Form.useForm();
  const [formOrden] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<AnalisisSeleccionado[]>([]);
  const [analisisIniciales, setAnalisisIniciales] = useState<AnalisisConMuestras[]>([]);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<number | null>(null);
  const [datosCargados, setDatosCargados] = useState(false);

  // --- Queries y Mutaciones ---
  const { data: orden, isLoading: loadingOrden, isError, error } = useOrdenDetalle(ordenId);
  const actualizarOrdenMutation = useActualizarOrden();
  const { data: sedes, isLoading: loadingSedes } = useSedesActivas();
  const { data: tiposCliente, isLoading: loadingTipos } = useTiposClienteActivos();
  const { data: convenios, isLoading: loadingConvenios } = useConveniosActivos();
  const { data: medicosExistentes } = useMedicos();

  // --- Cargar Datos Iniciales de la Orden ---
  useEffect(() => {
    if (orden && !datosCargados) {
      // 1. Cargar Paciente
      if (orden.paciente) {
        formPaciente.setFieldsValue({
          dni: orden.paciente.dni,
          nombres: orden.paciente.nombres,
          apellido_paterno: orden.paciente.apellido_paterno,
          apellido_materno: orden.paciente.apellido_materno,
          fecha_nacimiento: orden.paciente.fecha_nacimiento
            ? dayjs(orden.paciente.fecha_nacimiento)
            : undefined,
          genero: orden.paciente.genero,
          telefono: orden.paciente.telefono || undefined,
          email: orden.paciente.email || undefined,
          direccion: orden.paciente.direccion || undefined,
        });
      }

      // 2. Cargar Orden
      formOrden.setFieldsValue({
        sede_id: orden.sede_id,
        tipo_cliente_id: orden.tipo_cliente_id,
        convenio_id: orden.convenio_id || undefined,
        medico: orden.medico || undefined,
        nota: orden.nota || undefined,
      });
      setTipoClienteSeleccionado(orden.tipo_cliente_id);

      // 3. Cargar Análisis
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
  }, [orden, datosCargados, formPaciente, formOrden]);

  // --- Lógica Auxiliar ---
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
    }
  }, [esParticular, formOrden]);

  const steps = [
    { title: 'Paciente', subTitle: 'Identificación', icon: <UserOutlined /> },
    { title: 'Detalles', subTitle: 'Sede y Convenio', icon: <SolutionOutlined /> },
    { title: 'Análisis', subTitle: 'Selección y Precios', icon: <ExperimentOutlined /> },
  ];

  // --- Handlers ---
  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        await formPaciente.validateFields();
        setCurrentStep(1);
      } else if (currentStep === 1) {
        await formOrden.validateFields();
        setCurrentStep(2);
      }
    } catch (error) {
      message.error('Por favor complete todos los campos obligatorios');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!canUpdate) {
      message.error('No tienes permisos para editar órdenes.');
      return;
    }

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

      message.success(`Orden ${orden?.numero_atencion || ordenId} actualizada exitosamente`);
      navigate(`/ordenes/${ordenId}`);
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Error al actualizar la orden');
    }
  };

  if (!canUpdate) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para editar órdenes de atención."
        extra={
          <Button type="primary" onClick={() => navigate('/ordenes')} icon={<ArrowLeftOutlined />}>
            Volver al listado
          </Button>
        }
      />
    );
  }

  if (loadingOrden) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Cargando datos de la orden..." />
      </div>
    );
  }

  if (isError || !orden) {
    return (
      <Result
        status="error"
        title="Orden no encontrada"
        subTitle={error?.message || `No se pudo encontrar la orden con ID #${ordenId}`}
        extra={
          <Button type="primary" onClick={() => navigate('/ordenes')} icon={<ArrowLeftOutlined />}>
            Volver al listado
          </Button>
        }
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        padding: '16px 24px 24px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header Compacto con Acciones Rápidas */}
      <div
        style={{
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/ordenes/${ordenId}`)}
            style={{ paddingLeft: 0, color: '#64748b', fontSize: 12, height: 'auto', marginBottom: 2 }}
          >
            Volver al detalle de la orden
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              Editar Orden #{orden.numero_atencion}
            </Title>
            <Tag
              color={ESTADO_ORDEN_COLORS[orden.estado]}
              style={{ borderRadius: 6, fontWeight: 600, padding: '2px 10px', fontSize: 12 }}
            >
              {ESTADO_ORDEN_LABELS[orden.estado] || orden.estado}
            </Tag>
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, padding: '1px 8px', fontSize: 12 }}>
              Paso {currentStep + 1} de 3
            </Tag>
          </div>
        </div>
      </div>

      {/* Alerta si la orden ya tiene muestras o resultados */}
      {orden.estado !== EstadoOrden.REGISTRADA && (
        <Alert
          message="Edición en Estado Avanzado"
          description={`Esta orden se encuentra en estado "${ESTADO_ORDEN_LABELS[orden.estado]}". Las modificaciones respetarán los resultados de los análisis no eliminados. Esta función debe usarse bajo autorización gerencial.`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 14, borderRadius: 8 }}
        />
      )}

      {/* 2. Stepper Esbelto y Compacto */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          padding: '10px 20px',
          background: '#ffffff',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
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
              {/* Círculo numérico y texto del paso */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: isCompleted ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
                onClick={() => {
                  if (isCompleted) setCurrentStep(idx);
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    transition: 'all 0.25s ease',
                    background: isCompleted
                      ? '#10b981'
                      : isActive
                      ? '#1677ff'
                      : '#f1f5f9',
                    color: isCompleted || isActive ? '#ffffff' : '#64748b',
                    border: isCompleted
                      ? '2px solid #10b981'
                      : isActive
                      ? '2px solid #1677ff'
                      : '1px solid #cbd5e1',
                    boxShadow: isActive ? '0 0 0 3px rgba(22, 119, 255, 0.18)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <CheckOutlined style={{ fontSize: 16 }} /> : idx + 1}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: isActive ? '#0f172a' : isCompleted ? '#334155' : '#64748b',
                    }}
                  >
                    {step.title}
                  </span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>• {step.subTitle}</span>
                  {isCompleted && (
                    <Tag
                      color="success"
                      style={{ borderRadius: 10, fontSize: 10, padding: '0 5px', margin: 0, lineHeight: '16px' }}
                    >
                      Listo
                    </Tag>
                  )}
                  {isActive && (
                    <Tag
                      color="blue"
                      style={{ borderRadius: 10, fontSize: 10, padding: '0 5px', margin: 0, lineHeight: '16px' }}
                    >
                      En curso
                    </Tag>
                  )}
                </div>
              </div>

              {/* Línea conectora */}
              {idx < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    backgroundColor: '#e2e8f0',
                    margin: '0 18px',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: 30,
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

      {/* 3. Tarjeta del Formulario */}
      <Card
        bordered={true}
        className="wizard-card"
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          width: '100%',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Contenido con Altura Mínima Consistente */}
        <div style={{ padding: '20px 24px 18px 24px', minHeight: 520, boxSizing: 'border-box' }}>
          {/* Mini-Ficha del Paciente (Visible en Paso 1 y Paso 2) */}
          {currentStep > 0 && (
            <div
              style={{
                background: 'linear-gradient(90deg, #f0fdf4 0%, #f8fafc 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '8px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                      {formPaciente.getFieldValue('nombres')} {formPaciente.getFieldValue('apellido_paterno') || ''}{' '}
                      {formPaciente.getFieldValue('apellido_materno') || ''}
                    </Text>
                    <Tag color="blue" style={{ borderRadius: 4, fontWeight: 700, margin: 0, fontSize: 11, padding: '0 5px' }}>
                      DNI: {formPaciente.getFieldValue('dni')}
                    </Tag>
                    {formPaciente.getFieldValue('genero') && (
                      <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600, margin: 0, fontSize: 11, padding: '0 5px' }}>
                        {formPaciente.getFieldValue('genero') === 'M' ? 'Masculino' : 'Femenino'}
                      </Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                    {formPaciente.getFieldValue('telefono') && `Tel: ${formPaciente.getFieldValue('telefono')}  •  `}
                    {formPaciente.getFieldValue('email') && `Email: ${formPaciente.getFieldValue('email')}  •  `}
                    {formPaciente.getFieldValue('direccion') || 'Sin dirección registrada'}
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
                  color: '#1677ff',
                  borderColor: '#bfdbfe',
                  background: '#ffffff',
                }}
              >
                Modificar Paciente
              </Button>
            </div>
          )}

          {/* Step 0: Paciente */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                Datos de Identificación del Paciente
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Edite los datos del paciente o consulte otro DNI si requiere reemplazarlo
              </Text>
            </div>
            <BuscarPaciente form={formPaciente} />
          </div>

          {/* Step 1: Datos Administrativos */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                Datos de la Orden
              </Title>
            </div>

            <Form form={formOrden} layout="vertical" size="large" requiredMark={false}>
              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space size={6}>
                        <ShopOutlined style={{ color: '#1677ff' }} />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Sede de Atención</span>
                      </Space>
                    }
                    name="sede_id"
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 14 }}
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
                        <TeamOutlined style={{ color: '#1677ff' }} />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Tipo de Cliente</span>
                      </Space>
                    }
                    name="tipo_cliente_id"
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 14 }}
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
                        <MedicineBoxOutlined style={{ color: '#1677ff' }} />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Médico Referente</span>
                      </Space>
                    }
                    name="medico"
                    style={{ marginBottom: 14 }}
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
                          <SolutionOutlined style={{ color: '#1677ff' }} />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Convenio / Empresa</span>
                        </Space>
                      }
                      name="convenio_id"
                      rules={[{ required: true, message: 'Requerido' }]}
                      style={{ marginBottom: 14 }}
                    >
                      <Select
                        showSearch
                        placeholder="Buscar convenio..."
                        loading={loadingConvenios}
                        style={{ borderRadius: 8 }}
                        optionFilterProp="children"
                        options={convenios?.map((c) => ({ label: c.nombre_empresa, value: c.id }))}
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      label={
                        <Space size={6}>
                          <SolutionOutlined style={{ color: '#1677ff' }} />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Tarifa Aplicada</span>
                        </Space>
                      }
                      style={{ marginBottom: 14 }}
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
                    style={{ marginBottom: 4 }}
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

          {/* Step 2: Análisis */}
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
                  Selección de Análisis y Precios
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {esParticular ? 'Tarifario Particular' : 'Tarifario de Convenio'} aplicado. Puede modificar análisis o ajustar precios si cuenta con permiso.
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
                convenioId={esParticular ? undefined : formOrden.getFieldValue('convenio_id')}
                analisisIniciales={analisisIniciales}
              />
            </div>
          </div>
        </div>

        {/* Footer de Acciones Sticky */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 30,
            padding: '12px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Mensaje Contextual de Paso */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {currentStep === 0 && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 6 }} />
                Paso 1 de 3 • Verifique o actualice los datos del paciente
              </Text>
            )}
            {currentStep === 1 && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 6 }} />
                Paso 2 de 3 • Verifique la sede de atención y tarifario
              </Text>
            )}
            {currentStep === 2 && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 6 }} />
                Paso 3 de 3 • Revise los exámenes y precios antes de guardar
              </Text>
            )}
          </div>

          {/* Botones de Navegación */}
          <Space size="middle">
            {currentStep > 0 && (
              <Button
                size="middle"
                onClick={handlePrevStep}
                icon={<LeftOutlined />}
                style={{
                  borderRadius: 6,
                  padding: '0 20px',
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
                size="middle"
                onClick={handleNextStep}
                style={{
                  borderRadius: 6,
                  padding: '0 28px',
                  fontWeight: 600,
                  height: 38,
                  backgroundColor: '#1677ff',
                  boxShadow: '0 2px 10px rgba(22, 119, 255, 0.3)',
                }}
              >
                Siguiente <RightOutlined />
              </Button>
            ) : (
              <Button
                type="primary"
                size="middle"
                icon={<SaveOutlined />}
                loading={actualizarOrdenMutation.isPending}
                onClick={handleSubmit}
                disabled={analisisSeleccionados.length === 0}
                style={{
                  borderRadius: 6,
                  padding: '0 28px',
                  fontWeight: 600,
                  height: 38,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                }}
              >
                Guardar Cambios
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};
