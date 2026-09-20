import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, DatePicker, Select, Spin, message, Tag, Space, Typography } from 'antd';
import type { FormInstance } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useConsultarDni, useBuscarPacientePorDni } from '../hooks';

const { Text } = Typography;

interface BuscarPacienteProps {
  form: FormInstance;
}

export const BuscarPaciente: React.FC<BuscarPacienteProps> = ({ form }) => {
  const [edad, setEdad] = useState<number | null>(null);
  const [pacienteOrigen, setPacienteOrigen] = useState<'LOCAL' | 'RENIEC' | null>(null);
  
  const consultarDniMutation = useConsultarDni();
  const buscarPacienteMutation = useBuscarPacientePorDni();

  // Calcular edad cuando cambie la fecha de nacimiento
  const fechaNacimiento = Form.useWatch('fecha_nacimiento', form);
  
  useEffect(() => {
    if (fechaNacimiento) {
      const fechaNac = dayjs(fechaNacimiento);
      const hoy = dayjs();
      const edadCalculada = hoy.diff(fechaNac, 'year');
      setEdad(edadCalculada >= 0 ? edadCalculada : null);
    } else {
      setEdad(null);
    }
  }, [fechaNacimiento]);

  const handleBuscarDni = async () => {
    const dniValue = form.getFieldValue('dni');
    
    if (!dniValue || dniValue.length !== 8) {
      form.setFields([
        {
          name: 'dni',
          errors: ['El DNI debe tener 8 dígitos'],
        },
      ]);
      return;
    }

    try {
      // 1. PRIMERO: Buscar en la base de datos local
      console.log('🔍 Buscando paciente en BD local:', dniValue);
      const pacienteBD = await buscarPacienteMutation.mutateAsync(dniValue);
      
      if (pacienteBD) {
        console.log('✅ Paciente encontrado en BD:', pacienteBD);
        message.success('Paciente registrado encontrado en el sistema');
        setPacienteOrigen('LOCAL');
        
        // Convertir fecha a dayjs
        let fechaNac = undefined;
        if (pacienteBD.fecha_nacimiento) {
          fechaNac = dayjs(pacienteBD.fecha_nacimiento);
        }

        form.setFieldsValue({
          dni: pacienteBD.dni,
          nombres: pacienteBD.nombres,
          apellido_paterno: pacienteBD.apellido_paterno,
          apellido_materno: pacienteBD.apellido_materno,
          fecha_nacimiento: fechaNac,
          genero: pacienteBD.genero,
          telefono: pacienteBD.telefono || undefined,
          email: pacienteBD.email || undefined,
          direccion: pacienteBD.direccion || undefined,
        });
        return;
      }

      // 2. SEGUNDO: Si no está en BD, consultar API externa
      console.log('🔍 Paciente no encontrado en BD, consultando API externa...');
      const resultado = await consultarDniMutation.mutateAsync(dniValue);
      
      console.log('✅ Resultado API:', resultado);

      if (resultado.success && resultado.data) {
        const data = resultado.data;
        message.info('Paciente nuevo - datos obtenidos de RENIEC');
        setPacienteOrigen('RENIEC');
        
        // Convertir fecha de DD/MM/YYYY a formato dayjs
        let fechaNac = undefined;
        if (data.fechaNacimiento) {
          const [dia, mes, anio] = data.fechaNacimiento.split('/');
          if (dia && mes && anio) {
            fechaNac = dayjs(`${anio}-${mes}-${dia}`);
          }
        }

        form.setFieldsValue({
          dni: data.dni,
          nombres: data.nombres,
          apellido_paterno: data.apellidoPaterno,
          apellido_materno: data.apellidoMaterno,
          fecha_nacimiento: fechaNac,
          genero: 'M',
        });
      } else {
        setPacienteOrigen(null);
        message.warning('No se encontraron datos en RENIEC. Complete los datos manualmente.');
      }
    } catch (error) {
      console.error('❌ Error al buscar:', error);
      setPacienteOrigen(null);
      message.error('Error al buscar paciente');
    }
  };

  const isLoading = consultarDniMutation.isPending || buscarPacienteMutation.isPending;

  return (
    <div style={{ position: 'relative' }}>
      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark={false}
        initialValues={{
          genero: 'M',
        }}
        style={{ marginBottom: 0 }}
      >
        {/* FILA 1: IDENTIDAD (DNI, NOMBRES, APELLIDOS) */}
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={
                <Space size={6}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>DNI</span>
                  {pacienteOrigen === 'LOCAL' && (
                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ borderRadius: 4, margin: 0, fontSize: 11, padding: '0 6px' }}>
                      En Sistema
                    </Tag>
                  )}
                  {pacienteOrigen === 'RENIEC' && (
                    <Tag color="blue" icon={<CheckCircleOutlined />} style={{ borderRadius: 4, margin: 0, fontSize: 11, padding: '0 6px' }}>
                      RENIEC
                    </Tag>
                  )}
                </Space>
              }
              name="dni"
              rules={[
                { required: true, message: 'Requerido' },
                { len: 8, message: '8 dígitos' },
                { pattern: /^\d+$/, message: 'Solo números' },
              ]}
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="8 dígitos"
                maxLength={8}
                prefix={<IdcardOutlined style={{ color: '#1677ff' }} />}
                style={{ borderRadius: 8 }}
                onChange={() => setPacienteOrigen(null)}
                suffix={
                  <Button
                    type="primary"
                    size="small"
                    onClick={handleBuscarDni}
                    loading={isLoading}
                    icon={<SearchOutlined />}
                    style={{
                      borderRadius: 6,
                      fontWeight: 600,
                      backgroundColor: '#1677ff',
                      padding: '0 10px',
                    }}
                  >
                    Buscar
                  </Button>
                }
                onPressEnter={(e) => {
                  e.preventDefault();
                  handleBuscarDni();
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Nombres</span>}
              name="nombres"
              rules={[{ required: true, message: 'Requerido' }]}
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="Nombres completos"
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Apellido Paterno</span>}
              name="apellido_paterno"
              rules={[{ required: true, message: 'Requerido' }]}
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="Primer apellido"
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Apellido Materno</span>}
              name="apellido_materno"
              rules={[{ required: true, message: 'Requerido' }]}
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="Segundo apellido"
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* FILA 2: DEMOGRAFÍA Y CONTACTO */}
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Fecha de Nacimiento</span>}
              name="fecha_nacimiento"
              rules={[{ required: true, message: 'Requerido' }]}
              style={{ marginBottom: 14 }}
            >
              <DatePicker
                style={{ width: '100%', borderRadius: 8 }}
                format="DD/MM/YYYY"
                placeholder="DD/MM/AAAA"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Edad</span>}
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
                  gap: 8,
                }}
              >
                <FieldTimeOutlined style={{ color: '#94a3b8' }} />
                {edad !== null ? (
                  <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 6, fontWeight: 700, margin: 0 }}>
                    {edad} {edad === 1 ? 'año' : 'años'}
                  </Tag>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Cálculo automático
                  </Text>
                )}
              </div>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: '#1e293b' }}>Género</span>}
              name="genero"
              rules={[{ required: true, message: 'Requerido' }]}
              style={{ marginBottom: 14 }}
            >
              <Select placeholder="Seleccione" style={{ borderRadius: 8 }}>
                <Select.Option value="M">Masculino</Select.Option>
                <Select.Option value="F">Femenino</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  Teléfono <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(Opcional)</span>
                </span>
              }
              name="telefono"
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="Ej: 999 888 777"
                maxLength={15}
                prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* FILA 3: EMAIL Y DIRECCIÓN */}
        <Row gutter={[16, 14]}>
          <Col xs={24} md={9}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  Correo Electrónico <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(Opcional)</span>
                </span>
              }
              name="email"
              rules={[{ type: 'email', message: 'Email inválido' }]}
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="correo@ejemplo.com"
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={15}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  Dirección de Domicilio <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(Opcional)</span>
                </span>
              }
              name="direccion"
              style={{ marginBottom: 14 }}
            >
              <Input
                placeholder="Av, Calle, N° o Urbanización"
                prefix={<EnvironmentOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Panel Informativo de Identidad y Origen de Datos */}
        <div
          style={{
            marginTop: 8,
            padding: '12px 18px',
            background: pacienteOrigen === 'LOCAL'
              ? 'linear-gradient(90deg, #f0fdf4 0%, #f8fafc 100%)'
              : pacienteOrigen === 'RENIEC'
              ? 'linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)'
              : '#f8fafc',
            border: pacienteOrigen === 'LOCAL'
              ? '1px solid #bbf7d0'
              : pacienteOrigen === 'RENIEC'
              ? '1px solid #bfdbfe'
              : '1px solid #e2e8f0',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            transition: 'all 0.3s ease',
          }}
        >
          <Space size={10} style={{ flex: 1, minWidth: 260 }}>
            <InfoCircleOutlined
              style={{
                color: pacienteOrigen === 'LOCAL' ? '#10b981' : '#1677ff',
                fontSize: 16,
                flexShrink: 0,
              }}
            />
            <div>
              <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                {pacienteOrigen === 'LOCAL'
                  ? 'Paciente registrado en la base de datos del laboratorio'
                  : pacienteOrigen === 'RENIEC'
                  ? 'Datos obtenidos automáticamente desde RENIEC'
                  : 'Consulta Rápida de Identidad'}
              </Text>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {pacienteOrigen
                  ? 'Puede verificar o actualizar el teléfono, correo electrónico o dirección si el paciente lo requiere.'
                  : 'Ingrese los 8 dígitos del DNI y presione "Buscar" o la tecla Enter para autocompletar la ficha.'}
              </div>
            </div>
          </Space>

          {pacienteOrigen && (
            <Tag
              color={pacienteOrigen === 'LOCAL' ? 'success' : 'processing'}
              icon={<CheckCircleOutlined />}
              style={{
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {pacienteOrigen === 'LOCAL' ? 'Paciente Frecuente' : 'Nuevo Paciente (RENIEC)'}
            </Tag>
          )}
        </div>
      </Form>

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            zIndex: 10,
            gap: 12,
          }}
        >
          <Spin size="large" />
          <Text strong style={{ color: '#1677ff', fontSize: 14 }}>
            Consultando datos de identidad...
          </Text>
        </div>
      )}
    </div>
  );
};
