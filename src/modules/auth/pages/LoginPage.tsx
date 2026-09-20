import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Input, Button, message, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '../api';
import { useAuthStore } from '../hooks';
import type { LoginRequest } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();

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
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorBgContainer: 'transparent',
          colorBorder: 'transparent',
          colorText: '#f8fafc',
          colorTextPlaceholder: '#94a3b8',
          borderRadius: 10,
        },
      }}
    >
      <style>{`
        /* Contenedor tipo Input con Título e Ícono embebido (exacto a la referencia FCS) */
        .vitelab-embedded-input {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 10px;
          padding: 8px 14px 6px 14px;
          transition: all 0.25s ease;
          cursor: text;
        }
        .vitelab-embedded-input:hover {
          border-color: rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.1);
        }
        .vitelab-embedded-input:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 14px rgba(59, 130, 246, 0.35) !important;
          background: rgba(255, 255, 255, 0.11) !important;
        }
        
        /* Eliminar bordes, fondos y sombras internas de Ant Design para que no haya doble cuadro */
        .vitelab-embedded-input .ant-input,
        .vitelab-embedded-input .ant-input-affix-wrapper,
        .vitelab-embedded-input input {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          padding: 0 !important;
          color: #ffffff !important;
          font-size: 14px !important;
        }
        .vitelab-embedded-input .ant-input-affix-wrapper:focus,
        .vitelab-embedded-input .ant-input-affix-wrapper-focused {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }
        
        /* Evitar que autofill ponga blanco el texto o el fondo */
        .vitelab-embedded-input input:-webkit-autofill,
        .vitelab-embedded-input input:-webkit-autofill:hover, 
        .vitelab-embedded-input input:-webkit-autofill:focus, 
        .vitelab-embedded-input input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0b1526 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        /* Icono de visibilidad de contraseña (el ojo) */
        .vitelab-embedded-input .ant-input-password-icon {
          color: #94a3b8 !important;
          transition: color 0.2s;
        }
        .vitelab-embedded-input .ant-input-password-icon:hover {
          color: #ffffff !important;
        }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#040914',
          /* Imagen fotográfica de fondo de laboratorio con iluminación cinematográfica */
          backgroundImage: `
            radial-gradient(circle at 50% 10%, rgba(14, 165, 233, 0.2) 0%, transparent 55%),
            linear-gradient(to bottom, rgba(4, 9, 20, 0.45) 0%, rgba(4, 9, 20, 0.72) 100%),
            url("/login-bg.jpg")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Tarjeta Transparente con Difuminado Sutil */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 20,
            background: 'rgba(15, 23, 42, 0.28)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: `
              0 20px 50px rgba(0, 0, 0, 0.5),
              inset 0 1px 1px rgba(255, 255, 255, 0.2)
            `,
            padding: '38px 34px 30px 34px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* ENCABEZADO Y LOGO HORIZONTAL */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              marginBottom: 30,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(14, 165, 233, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0,
              }}
            >
              <ExperimentOutlined style={{ fontSize: 26, color: '#ffffff' }} />
            </div>

            <div
              style={{
                borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                paddingLeft: 14,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                  lineHeight: 1.1,
                }}
              >
                ViteLab
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#38bdf8',
                  letterSpacing: '1.6px',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}
              >
                Clinical LIMS
              </div>
            </div>
          </div>

          {/* FORMULARIO */}
          <Form
            form={form}
            name="login"
            layout="vertical"
            requiredMark={false}
            onFinish={handleSubmit}
            size="large"
          >
            {/* Campo Usuario con Título e Ícono adentro */}
            <div style={{ marginBottom: 16 }}>
              <div className="vitelab-embedded-input">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#94a3b8',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    marginBottom: 2,
                    userSelect: 'none',
                  }}
                >
                  <UserOutlined style={{ fontSize: 11 }} />
                  <span>Usuario</span>
                </div>
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Ingrese su usuario o correo' }]}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="Usuario"
                    bordered={false}
                    style={{
                      height: 26,
                      color: '#ffffff',
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Campo Contraseña con Título e Ícono adentro */}
            <div style={{ marginBottom: 8 }}>
              <div className="vitelab-embedded-input">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#94a3b8',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    marginBottom: 2,
                    userSelect: 'none',
                  }}
                >
                  <LockOutlined style={{ fontSize: 11 }} />
                  <span>Contraseña</span>
                </div>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Ingrese su contraseña' }]}
                  style={{ margin: 0 }}
                >
                  <Input.Password
                    placeholder="Contraseña"
                    bordered={false}
                    style={{
                      height: 26,
                      color: '#ffffff',
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Enlace Olvidó su contraseña */}
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <span
                style={{
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                Forgot Password?
              </span>
            </div>

            {/* Botón Iniciar Sesión */}
            <Button
              type="primary"
              htmlType="submit"
              loading={loginMutation.isPending}
              block
              style={{
                height: 48,
                fontSize: 14,
                borderRadius: 10,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                background: '#2563eb',
                border: 'none',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              INICIAR SESIÓN
            </Button>
          </Form>

          {/* Mensaje de Soporte */}
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              marginBottom: 0,
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            En caso que no pueda acceder, comuníquese con el Administrador.
          </p>
        </div>

        {/* PIE DE PÁGINA CENTRADO */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: 13,
            letterSpacing: 0.4,
            textAlign: 'center',
            zIndex: 2,
          }}
        >
          © {new Date().getFullYear()} ViteLab Systems — Plataforma LIMS Profesional
        </div>
      </div>
    </ConfigProvider>
  );
}
