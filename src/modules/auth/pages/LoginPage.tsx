import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Input, Button, message, ConfigProvider, theme, Modal, Typography, Space } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined,
  QrcodeOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  BankOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { authApi } from '../api';
import { useAuthStore } from '../hooks';
import type { LoginRequest, Login2FARequired, LoginTenantRequired, LoginPasswordChangeRequired } from '../types';
import viteLogo from '../../../assets/logo/logo.png';

type LoginStep = 'credentials' | 'verify_2fa' | 'setup_2fa' | 'select_tenant' | 'change_password';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();
  const [changePasswordForm] = Form.useForm();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [twoFactorData, setTwoFactorData] = useState<Login2FARequired | null>(null);
  const [tenantSelectionData, setTenantSelectionData] = useState<LoginTenantRequired | null>(null);
  const [passwordChangeData, setPasswordChangeData] = useState<LoginPasswordChangeRequired | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken && isAuthenticated) clearAuth();
  }, [isAuthenticated]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,

    onSuccess: (response) => {
      if (response.success) {
        const data = response.data;
        if ('requires2FA' in data && data.requires2FA) {
          setTwoFactorData(data);
          setOtpCode('');
          if (data.setupNeeded) {
            setStep('setup_2fa');
            message.info('Vincule su aplicación autenticadora para continuar');
          } else {
            setStep('verify_2fa');
          }
        } else if ('requiresPasswordChange' in data && data.requiresPasswordChange) {
          setPasswordChangeData(data as any);
          setStep('change_password');
          message.info('Por seguridad, debes establecer tu nueva contraseña personal.');
        } else if ('requiresTenantSelection' in data && data.requiresTenantSelection) {
          setTenantSelectionData(data);
          setStep('select_tenant');
          message.info('Seleccione el laboratorio al que desea ingresar');
        } else if ('user' in data) {
          const { user, accessToken, refreshToken, activeTenant } = data;
          setAuth(user, accessToken, refreshToken, activeTenant);
          message.success(`¡Bienvenido, ${user.nombres}!`);
          navigate('/portal');
        }
      } else {
        const msg = response.message || 'Usuario o contraseña incorrectos';
        setErrorMessage(msg);
        setErrorModalOpen(true);
      }
    },

    onError: (err: any) => {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Usuario o contraseña incorrectos';

      setErrorMessage(backendMessage);
      setErrorModalOpen(true);
    },
  });

  const selectTenantMutation = useMutation({
    mutationFn: (tenantId: string) =>
      authApi.selectTenant({
        tempToken: tenantSelectionData?.tempToken || '',
        tenantId,
      }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken, activeTenant } = response.data;
        setAuth(user, accessToken, refreshToken, activeTenant);
        message.success(`¡Bienvenido a ${activeTenant?.name || 'ViteLab'}!`);
        navigate('/portal');
      } else {
        setErrorMessage(response.message || 'Error al seleccionar laboratorio');
        setErrorModalOpen(true);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al seleccionar laboratorio';
      setErrorMessage(msg);
      setErrorModalOpen(true);
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: authApi.verify2FA,
    onSuccess: (response) => {
      if (response.success) {
        if ('requiresPasswordChange' in (response.data as any) && (response.data as any).requiresPasswordChange) {
          setPasswordChangeData(response.data as any);
          setStep('change_password');
          message.info('Por seguridad, debes establecer tu nueva contraseña personal.');
        } else if ('requiresTenantSelection' in (response.data as any) && (response.data as any).requiresTenantSelection) {
          setTenantSelectionData(response.data as any);
          setStep('select_tenant');
          message.info('Seleccione el laboratorio al que desea ingresar');
        } else {
          const { user, accessToken, refreshToken, activeTenant } = response.data as any;
          setAuth(user, accessToken, refreshToken, activeTenant);
          message.success(`¡Bienvenido, ${user.nombres}!`);
          navigate('/portal');
        }
      } else {
        setErrorMessage(response.message || 'Código incorrecto o expirado');
        setErrorModalOpen(true);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Código incorrecto o expirado';
      setErrorMessage(msg);
      setErrorModalOpen(true);
    },
  });

  const confirmSetupMutation = useMutation({
    mutationFn: authApi.confirm2FASetup,
    onSuccess: (response) => {
      if (response.success) {
        const { user, accessToken, refreshToken, backupCodes } = response.data;
        setAuth(user, accessToken, refreshToken);
        message.success('¡Doble factor configurado exitosamente!');
        if (backupCodes && backupCodes.length > 0) {
          setSavedBackupCodes(backupCodes);
          setBackupModalOpen(true);
        } else {
          navigate('/portal');
        }
      } else {
        setErrorMessage(response.message || 'Código incorrecto');
        setErrorModalOpen(true);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Código incorrecto';
      setErrorMessage(msg);
      setErrorModalOpen(true);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: { newPassword: string }) =>
      authApi.changeInitialPassword({
        tempToken: passwordChangeData?.tempToken || '',
        newPassword: values.newPassword,
      }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const data = response.data;
        if ('requires2FA' in data && data.requires2FA) {
          setTwoFactorData(data);
          setOtpCode('');
          if (data.setupNeeded) {
            setStep('setup_2fa');
            message.success('¡Contraseña actualizada! Vincula tu aplicación autenticadora para continuar.');
          } else {
            setStep('verify_2fa');
            message.success('¡Contraseña actualizada! Ingresa tu código de autenticación.');
          }
        } else if ('requiresTenantSelection' in data && data.requiresTenantSelection) {
          setTenantSelectionData(data);
          setStep('select_tenant');
          message.success('¡Contraseña actualizada exitosamente! Selecciona tu laboratorio.');
        } else if ('user' in data) {
          const { user, accessToken, refreshToken, activeTenant } = data;
          setAuth(user, accessToken, refreshToken, activeTenant);
          message.success(`¡Contraseña actualizada exitosamente! Bienvenido, ${user?.nombres || ''}.`);
          navigate('/portal');
        }
      } else {
        setErrorMessage(response.message || 'Error al actualizar la contraseña');
        setErrorModalOpen(true);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al actualizar la contraseña';
      setErrorMessage(msg);
      setErrorModalOpen(true);
    },
  });

  const handleSubmit = (values: LoginRequest) => {
    loginMutation.mutate(values);
  };

  if (isAuthenticated && localStorage.getItem('accessToken')) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0284c7',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          colorTextPlaceholder: '#94a3b8',
          borderRadius: 12,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
      }}
    >
      <style>{`
        /* Contenedor tipo Input con Título e Ícono embebido en Efecto Glass Transparente */
        .vitelab-embedded-input {
          background: rgba(255, 255, 255, 0.24);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.75);
          border-radius: 14px;
          padding: 8px 14px 6px 14px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: text;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.5);
        }
        .vitelab-embedded-input:hover {
          border-color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.36);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
        }
        .vitelab-embedded-input:focus-within {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.25), 0 4px 14px rgba(14, 165, 233, 0.15) !important;
          background: rgba(255, 255, 255, 0.45) !important;
        }
        .vitelab-embedded-input:focus-within .vitelab-input-label {
          color: #0284c7 !important;
        }
        
        /* Eliminar bordes, fondos y sombras internas de Ant Design */
        .vitelab-embedded-input .ant-input,
        .vitelab-embedded-input .ant-input-affix-wrapper,
        .vitelab-embedded-input input {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          padding: 0 !important;
          color: #0f172a !important;
          font-weight: 600 !important;
          font-size: 14.5px !important;
        }
        .vitelab-embedded-input .ant-input::placeholder,
        .vitelab-embedded-input input::placeholder {
          color: #475569 !important;
          font-weight: 500 !important;
        }
        .vitelab-embedded-input .ant-input-affix-wrapper:focus,
        .vitelab-embedded-input .ant-input-affix-wrapper-focused {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }
        
        /* Evitar que autofill altere los estilos claros */
        .vitelab-embedded-input input:-webkit-autofill,
        .vitelab-embedded-input input:-webkit-autofill:hover, 
        .vitelab-embedded-input input:-webkit-autofill:focus, 
        .vitelab-embedded-input input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.45) inset !important;
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        /* Icono de visibilidad de contraseña (el ojo) */
        .vitelab-embedded-input .ant-input-password-icon {
          color: #334155 !important;
          transition: color 0.2s;
        }
        .vitelab-embedded-input .ant-input-password-icon:hover {
          color: #0284c7 !important;
        }

        /* Botón Iniciar Sesión con gradiente Azul-Menta */
        .vitelab-btn-submit {
          height: 48px !important;
          font-size: 14px !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 0.8px !important;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #059669 100%) !important;
          border: none !important;
          color: #ffffff !important;
          box-shadow: 0 8px 24px -3px rgba(2, 132, 199, 0.45) !important;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .vitelab-btn-submit:hover {
          background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #10b981 100%) !important;
          box-shadow: 0 10px 26px -3px rgba(2, 132, 199, 0.55) !important;
          transform: translateY(-1.5px) !important;
          color: #ffffff !important;
        }
        .vitelab-btn-submit:active {
          transform: translateY(0.5px) !important;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4) !important;
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
          backgroundColor: '#0f172a',
          /* Imagen nítida de laboratorio clínico de fondo */
          backgroundImage: 'url("/login-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Tarjeta Glassmorphic Transparente con Fondo Difuminado y Contorno Grueso */}
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.12) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '2.5px solid rgba(255, 255, 255, 0.75)',
            boxShadow: `
              0 25px 50px -10px rgba(0, 0, 0, 0.16),
              0 10px 20px -5px rgba(2, 132, 199, 0.10),
              inset 0 1px 2px rgba(255, 255, 255, 0.8),
              inset 0 -1px 2px rgba(255, 255, 255, 0.2)
            `,
            padding: '40px 38px 34px 38px',
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
              marginBottom: 24,
            }}
          >
            {/* Contenedor del Logo con gradiente Azul y Verde Menta */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 22px -3px rgba(2, 132, 199, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                flexShrink: 0,
              }}
            >
              <img src={viteLogo} alt="ViteLab" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>

            <div
              style={{
                borderLeft: '1.5px solid #e2e8f0',
                paddingLeft: 14,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '0.4px',
                  lineHeight: 1.1,
                }}
              >
                ViteLab
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0284c7',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}
              >
                Clinical LIMS
              </div>
            </div>
          </div>

          {/* Badge Informativo Sutil Menta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                backgroundColor: 'rgba(236, 253, 245, 0.82)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(167, 243, 208, 0.95)',
                color: '#059669',
                padding: '4px 14px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              <span>
                {step === 'credentials' && 'Portal de Acceso Clínico'}
                {step === 'verify_2fa' && 'Verificación de Identidad (2FA)'}
                {step === 'setup_2fa' && 'Vinculación Inicial de Seguridad'}
              </span>
            </div>
          </div>

          {/* VISTA 1: INGRESO DE CREDENCIALES */}
          {step === 'credentials' && (
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
                    className="vitelab-input-label"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#1e293b',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      marginBottom: 2,
                      userSelect: 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <UserOutlined style={{ fontSize: 11.5 }} />
                    <span>Correo o Usuario</span>
                  </div>
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Ingrese su correo electrónico o usuario' }]}
                    style={{ margin: 0 }}
                  >
                    <Input
                      placeholder="ej. admin@vitelab.com o admin"
                      bordered={false}
                      style={{
                        height: 26,
                        color: '#0f172a',
                      }}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Campo Contraseña con Título e Ícono adentro */}
              <div style={{ marginBottom: 10 }}>
                <div className="vitelab-embedded-input">
                  <div
                    className="vitelab-input-label"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#1e293b',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      marginBottom: 2,
                      userSelect: 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <LockOutlined style={{ fontSize: 11.5 }} />
                    <span>Contraseña</span>
                  </div>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Ingrese su contraseña' }]}
                    style={{ margin: 0 }}
                  >
                    <Input.Password
                      placeholder="••••••••••••"
                      bordered={false}
                      style={{
                        height: 26,
                        color: '#0f172a',
                      }}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 22 }}></div>

              {/* Botón Iniciar Sesión con gradiente Azul-Menta */}
              <Button
                type="primary"
                htmlType="submit"
                loading={loginMutation.isPending}
                block
                className="vitelab-btn-submit"
              >
                CONTINUAR
              </Button>
            </Form>
          )}

          {/* VISTA 2: VERIFICACIÓN 2FA HABITUAL */}
          {step === 'verify_2fa' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                  fontSize: 24,
                  marginBottom: 10,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                Código de Autenticación
              </h3>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.4 }}>
                Ingresa el código dinámico de 6 dígitos que muestra tu app (Google o Microsoft Authenticator) o un código de respaldo.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
                <Input.OTP
                  length={6}
                  size="large"
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    if (val.length === 6 && twoFactorData?.tempToken) {
                      verify2FAMutation.mutate({ tempToken: twoFactorData.tempToken, code: val });
                    }
                  }}
                  autoFocus
                />
              </div>

              <Button
                type="primary"
                block
                className="vitelab-btn-submit"
                loading={verify2FAMutation.isPending}
                disabled={otpCode.length < 6}
                onClick={() => {
                  if (twoFactorData?.tempToken) {
                    verify2FAMutation.mutate({ tempToken: twoFactorData.tempToken, code: otpCode });
                  }
                }}
                style={{ marginBottom: 12 }}
              >
                VERIFICAR Y ACCEDER
              </Button>

              <Button
                type="link"
                onClick={() => {
                  setStep('credentials');
                  setOtpCode('');
                  setTwoFactorData(null);
                }}
                style={{ color: '#64748b', fontSize: 12.5 }}
              >
                ← Volver al inicio de sesión
              </Button>
            </div>
          )}

          {/* VISTA 3: VINCULACIÓN INICIAL (ONBOARDING) */}
          {step === 'setup_2fa' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f766e',
                    fontSize: 22,
                    marginBottom: 6,
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.15)',
                  }}
                >
                  <QrcodeOutlined />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 3px 0' }}>
                  Vincular Autenticador
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                  Escanea el código QR con <strong>Google Authenticator</strong> o <strong>Microsoft Authenticator</strong>:
                </p>
              </div>

              {/* Contenedor QR y Clave Manual */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  borderRadius: 14,
                  border: '1.5px solid #e2e8f0',
                  padding: 12,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  marginBottom: 14,
                }}
              >
                {twoFactorData?.qrCodeDataUrl && (
                  <img
                    src={twoFactorData.qrCodeDataUrl}
                    alt="Código QR de Vinculación 2FA"
                    style={{ width: 160, height: 160, borderRadius: 8, display: 'block' }}
                  />
                )}

                {twoFactorData?.manualKey && (
                  <div style={{ marginTop: 8, textAlign: 'center', width: '100%' }}>
                    <span style={{ fontSize: 10.5, color: '#64748b', display: 'block' }}>
                      ¿No puedes escanear el QR? Usa esta clave manual:
                    </span>
                    <Typography.Text
                      copyable={{ text: twoFactorData.manualKey }}
                      code
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: '#0f172a',
                        display: 'inline-block',
                        marginTop: 2,
                      }}
                    >
                      {twoFactorData.manualKey}
                    </Typography.Text>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Ingresa el código de 6 dígitos que muestra tu app:
                </span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Input.OTP
                    length={6}
                    size="middle"
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val);
                      if (val.length === 6 && twoFactorData?.tempToken) {
                        confirmSetupMutation.mutate({ tempToken: twoFactorData.tempToken, code: val });
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="primary"
                block
                className="vitelab-btn-submit"
                loading={confirmSetupMutation.isPending}
                disabled={otpCode.length < 6}
                onClick={() => {
                  if (twoFactorData?.tempToken) {
                    confirmSetupMutation.mutate({ tempToken: twoFactorData.tempToken, code: otpCode });
                  }
                }}
                style={{ marginBottom: 10 }}
              >
                CONFIRMAR Y ACTIVAR
              </Button>

              <div style={{ textAlign: 'center' }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setStep('credentials');
                    setOtpCode('');
                    setTwoFactorData(null);
                  }}
                  style={{ color: '#64748b', fontSize: 12 }}
                >
                  ← Cancelar y volver
                </Button>
              </div>
            </div>
          )}

          {/* VISTA 4: SELECCIÓN DE TENANT / LABORATORIO */}
          {step === 'select_tenant' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    fontSize: 24,
                    marginBottom: 10,
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
                  }}
                >
                  <MedicineBoxOutlined />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Selecciona tu Laboratorio
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Tienes membresías activas en múltiples laboratorios. Elige la sede para iniciar sesión:
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  maxHeight: 240,
                  overflowY: 'auto',
                  marginBottom: 20,
                  paddingRight: 4,
                }}
              >
                {tenantSelectionData?.tenants.map((t) => {
                  const isSelected = selectedTenantId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTenantId(t.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: isSelected
                          ? '2px solid #0284c7'
                          : '1.5px solid rgba(226, 232, 240, 0.9)',
                        backgroundColor: isSelected
                          ? 'rgba(2, 132, 199, 0.08)'
                          : 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(6px)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSelected
                          ? '0 4px 12px rgba(2, 132, 199, 0.15)'
                          : '0 2px 4px rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: isSelected
                              ? 'linear-gradient(135deg, #0284c7 0%, #059669 100%)'
                              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? '#ffffff' : '#64748b',
                            fontSize: 16,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <BankOutlined />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: isSelected ? '#0284c7' : '#0f172a',
                            }}
                          >
                            {t.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {t.role && (
                              <>
                                <span style={{ fontWeight: 600, color: '#059669' }}>{t.role}</span>
                                {' • '}
                              </>
                            )}
                            <span>{t.slug}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircleOutlined style={{ color: '#0284c7', fontSize: 18 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                type="primary"
                block
                className="vitelab-btn-submit"
                loading={selectTenantMutation.isPending}
                disabled={!selectedTenantId}
                onClick={() => {
                  if (selectedTenantId) {
                    selectTenantMutation.mutate(selectedTenantId);
                  }
                }}
                style={{ marginBottom: 10 }}
              >
                INGRESAR AL LABORATORIO
              </Button>

              <div style={{ textAlign: 'center' }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setStep('credentials');
                    setTenantSelectionData(null);
                    setSelectedTenantId(null);
                  }}
                  style={{ color: '#64748b', fontSize: 12 }}
                >
                  ← Iniciar sesión con otra cuenta
                </Button>
              </div>
            </div>
          )}

          {/* VISTA 5: CAMBIO OBLIGATORIO DE CONTRASEÑA */}
          {step === 'change_password' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                    fontSize: 24,
                    marginBottom: 10,
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
                  }}
                >
                  <LockOutlined />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Crea tu Nueva Contraseña
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  {passwordChangeData?.email
                    ? `Hola, ${passwordChangeData.email}. Por seguridad debes reemplazar tu contraseña provisional por una personal.`
                    : 'Por seguridad de tu cuenta clínica, debes establecer una nueva contraseña personal para continuar.'}
                </p>
              </div>

              <Form
                form={changePasswordForm}
                layout="vertical"
                onFinish={(values) => {
                  changePasswordMutation.mutate({ newPassword: values.newPassword });
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: 5,
                    }}
                  >
                    NUEVA CONTRASEÑA
                  </label>
                  <Form.Item
                    name="newPassword"
                    rules={[
                      { required: true, message: 'Ingresa la nueva contraseña' },
                      { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.Password
                      placeholder="Mínimo 6 caracteres"
                      prefix={<LockOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: 5,
                    }}
                  >
                    CONFIRMAR NUEVA CONTRASEÑA
                  </label>
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Confirma la nueva contraseña' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Las contraseñas no coinciden'));
                        },
                      }),
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.Password
                      placeholder="Repite tu nueva contraseña"
                      prefix={<SafetyCertificateOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="vitelab-btn-submit"
                  loading={changePasswordMutation.isPending}
                  style={{ marginBottom: 12 }}
                >
                  ESTABLECER CONTRASEÑA Y CONTINUAR
                </Button>

                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setStep('credentials');
                      setPasswordChangeData(null);
                      changePasswordForm.resetFields();
                    }}
                    style={{ color: '#64748b', fontSize: 12 }}
                  >
                    ← Cancelar e iniciar con otra cuenta
                  </Button>
                </div>
              </Form>
            </div>
          )}


          {/* Mensaje de Soporte / Seguridad */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1.5px solid rgba(255, 255, 255, 0.75)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: '#475569',
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              <SafetyCertificateOutlined style={{ color: '#059669', fontSize: 12.5 }} />
              <span>Conexión segura cifrada TLS 256-bit</span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: '#64748b',
                lineHeight: 1.45,
              }}
            >
              En caso de requerir asistencia técnica o recuperación de credenciales, comuníquese con el Administrador.
            </p>
          </div>
        </div>

        {/* PIE DE PÁGINA CENTRADO */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            color: '#64748b',
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: 0.3,
            textAlign: 'center',
            zIndex: 2,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)',
          }}
        >
          © {new Date().getFullYear()} ViteLab Systems — Plataforma LIMS Profesional
        </div>
      </div>

      {/* Popup Modal de Error */}
      <Modal
        open={errorModalOpen}
        onCancel={() => setErrorModalOpen(false)}
        footer={null}
        centered
        width={380}
        destroyOnHidden
        styles={{
          content: {
            borderRadius: 20,
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              fontSize: 28,
            }}
          >
            <CloseCircleOutlined />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            {errorMessage || 'Credenciales incorrectas'}
          </div>
          <Button
            type="primary"
            onClick={() => setErrorModalOpen(false)}
            style={{ marginTop: 8, borderRadius: 8 }}
          >
            Entendido
          </Button>
        </div>
      </Modal>

      {/* Modal de Códigos de Respaldo */}
      <Modal
        open={backupModalOpen}
        onCancel={() => {
          setBackupModalOpen(false);
          navigate('/portal');
        }}
        footer={null}
        centered
        width={440}
        destroyOnHidden
        styles={{
          content: {
            borderRadius: 20,
            padding: '24px',
            textAlign: 'center',
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              fontSize: 26,
            }}
          >
            <CheckCircleOutlined />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            ¡Doble Factor Activado!
          </h3>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Guarda estos códigos de recuperación en un lugar seguro. Puedes usar cada uno una sola vez si pierdes acceso a tu aplicación autenticadora.
          </p>

          <div
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px 16px',
              marginTop: 6,
            }}
          >
            {savedBackupCodes.map((code, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1e293b',
                  letterSpacing: 1,
                }}
              >
                {code}
              </span>
            ))}
          </div>

          <Space style={{ width: '100%', marginTop: 8 }} direction="vertical">
            <Button
              block
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(savedBackupCodes.join('\n'));
                message.success('Códigos copiados al portapapeles');
              }}
            >
              Copiar Códigos
            </Button>
            <Button
              type="primary"
              block
              className="vitelab-btn-submit"
              onClick={() => {
                setBackupModalOpen(false);
                navigate('/portal');
              }}
            >
              CONTINUAR AL PORTAL
            </Button>
          </Space>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
