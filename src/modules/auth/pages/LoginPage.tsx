import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Checkbox, theme } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '../api';
import { useAuthStore } from '../hooks';
import type { LoginRequest } from '../types';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken && isAuthenticated) clearAuth();
  }, [isAuthenticated]);

const loginMutation = useMutation({
  mutationFn: authApi.login,

  onSuccess: (response) => {
    if (response.success) {
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      message.success(`¡Bienvenido, ${user.nombres}!`);
      navigate("/dashboard");
    } else {
      // Cuando el backend responde 200 pero success=false
      message.error(response.message || "Credenciales incorrectas");
    }
  },

  onError: (err: any) => {
    const backendMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Usuario o contraseña incorrectos";

    message.error(backendMessage);
  },
});



  const handleSubmit = (values: LoginRequest) => loginMutation.mutate(values);

  if (isAuthenticated && localStorage.getItem('accessToken')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,

        /* Fondo más profesional, premium tipo "hospital moderno" */
        background: `
          radial-gradient(circle at 30% 20%, rgba(0,150,255,0.18), transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(0,220,180,0.15), transparent 50%),
          linear-gradient(145deg, #0f172a 0%, #1e293b 100%)
        `,
      }}
    >
      <Card
        bordered={false}
        style={{
          width: '100%',
          maxWidth: 430,
          padding: 0,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)',

          /* Sombra premium tipo "material elevation" */
          boxShadow: '0 18px 45px rgba(0,0,0,0.25)',
        }}
        bodyStyle={{ padding: 42 }}
      >
        {/* ENCABEZADO */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 70,
              height: 70,
              margin: '0 auto 18px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #4ea4ff 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(0,120,255,0.25)',
            }}
          >
            <ExperimentOutlined style={{ fontSize: 36, color: 'white' }} />
          </div>

          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            ViteLab LIMS
          </Title>

          <Text type="secondary" style={{ fontSize: 15 }}>
            Sistema de Gestión de Laboratorio Clínico
          </Text>
        </div>

        {/* FORMULARIO */}
        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          initialValues={{ remember: true }}
        >
          <Form.Item
            label={<Text strong>Usuario</Text>}
            name="username"
            rules={[{ required: true, message: 'Ingrese su usuario o correo' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Usuario o correo"
              style={{ borderRadius: 10, padding: '10px 12px' }}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Contraseña</Text>}
            name="password"
            rules={[{ required: true, message: 'Ingrese su contraseña' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Contraseña"
              style={{ borderRadius: 10, padding: '10px 12px' }}
            />
          </Form.Item>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loginMutation.isPending}
            block
            style={{
              height: 50,
              fontSize: 16,
              borderRadius: 10,
              fontWeight: 600,
              letterSpacing: 0.3,
              marginTop: 10,
              boxShadow: `0 8px 20px ${token.colorPrimary}40`,
            }}
          >
            Iniciar Sesión
          </Button>
        </Form>
      </Card>

      {/* FOOTER */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          color: 'rgba(255,255,255,0.45)',
          fontSize: 13,
          letterSpacing: 0.4,
        }}
      >
        © {new Date().getFullYear()} ViteLab Systems — Plataforma LIMS Profesional
      </div>
    </div>
  );
}
