import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Typography, Space, Result } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined, SettingOutlined, LockOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { useOrdenConResultados } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { useMarcarOrdenComoImpresa } from '../../ordenes/hooks';
import { useConfiguracion } from '../../sistema/hooks';
import { PrintPreferencesModal, defaultPrintPreferences } from '../components';
import type { PrintPreferences } from '../components';
import type { ComponenteConResultado } from '../types';
import './ResultadosVistaPreviaPage.css';

const { Title } = Typography;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  // Si ya es una URL completa, devolverla tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Si es solo un path, construir la URL completa
  return `${API_URL.replace('/api', '')}${path}`;
};

// Calcular edad a partir de fecha de nacimiento
const calcularEdad = (fechaNacimiento: string | null | undefined): string => {
  if (!fechaNacimiento) return '-';
  const hoy = dayjs();
  const nacimiento = dayjs(fechaNacimiento);
  const años = hoy.diff(nacimiento, 'year');
  return `${años} a.`;
};

export const ResultadosVistaPreviaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ordenId = parseInt(id || '0', 10);
  const printRef = useRef<HTMLDivElement>(null);
  const { hasPermission } = useAuthStore();

  // Estado para preferencias de impresión
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [printPreferences, setPrintPreferences] = useState<PrintPreferences>(() => {
    const saved = localStorage.getItem('printPreferences');
    return saved ? JSON.parse(saved) : defaultPrintPreferences;
  });

  const { data: orden, isLoading, error } = useOrdenConResultados(ordenId, ordenId > 0 && hasPermission('results.read'));
  const { data: configuracion } = useConfiguracion();
  const marcarImpresaMutation = useMarcarOrdenComoImpresa();

  // Guardar preferencias en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('printPreferences', JSON.stringify(printPreferences));
  }, [printPreferences]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Resultados_${orden?.numero_atencion || 'orden'}`,
    onAfterPrint: async () => {
      // Marcar la orden como impresa después de imprimir
      if (ordenId > 0 && orden?.estado === 'APROBADA') {
        try {
          await marcarImpresaMutation.mutateAsync(ordenId);
        } catch (err) {
          console.error('Error al marcar orden como impresa:', err);
        }
      }
    },
  });

  const handleSavePreferences = (prefs: PrintPreferences) => {
    setPrintPreferences(prefs);
    setPreferencesModalOpen(false);
  };

  if (!hasPermission('results.read')) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para ver la vista previa de resultados."
        extra={
          <Button type="primary" onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
            Volver
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Cargando resultados..." />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="error-container">
        <Title level={4}>Error al cargar los resultados</Title>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  // Verificar si hay resultados
  const tieneResultados = orden.analisis.some(a => 
    a.componentes.some(c => c.tiene_resultado)
  );

  // URLs de imágenes
  const logoEmpresaUrl = getImageUrl(configuracion?.logo_principal);
  const logoConvenioUrl = getImageUrl(orden.convenio_logo_url);
  const firmaDirectorUrl = getImageUrl(configuracion?.logo_secundario);
  const firmaTecnologoUrl = getImageUrl(orden.aprobado_por_firma_url);

  // Construir dirección del pie de página
  const buildFooterAddress = () => {
    const parts: string[] = [];
    if (printPreferences.mostrarDireccionEmpresa && configuracion?.empresa_direccion) {
      parts.push(configuracion.empresa_direccion);
    }
    if (printPreferences.mostrarDireccionConvenio && orden.convenio_direccion) {
      parts.push(orden.convenio_direccion);
    }
    return parts.join(' / ');
  };

  // Componente Header que se repetirá en cada página
  const HeaderContent = () => (
    <>
      {/* Encabezado con logos */}
      <div className="header-logos">
        <div className="logo-left">
          {printPreferences.mostrarLogoEmpresa && (
            logoEmpresaUrl ? (
              <img src={logoEmpresaUrl} alt="Logo Empresa" className="header-logo-img" />
            ) : (
              <>
                <div className="lab-name">{configuracion?.empresa_nombre || 'LABORATORIO DE ANÁLISIS CLÍNICOS'}</div>
                <div className="lab-brand">{configuracion?.empresa_razon_social || 'VITELAB'}</div>
              </>
            )
          )}
        </div>
        <div className="logo-right">
          {printPreferences.mostrarLogoConvenio && (
            logoConvenioUrl ? (
              <img src={logoConvenioUrl} alt="Logo Convenio" className="header-logo-img convenio-logo" />
            ) : orden.convenio_nombre ? (
              <div className="empresa-name">{orden.convenio_nombre}</div>
            ) : null
          )}
        </div>
      </div>

      {/* Información del paciente y orden */}
      <div className="info-section">
        <table className="info-table">
          <tbody>
            <tr>
              <td className="label">Paciente</td>
              <td className="value paciente-nombre">
                {orden.paciente_apellidos}, {orden.paciente_nombres}
              </td>
              <td className="label">Ingresado:</td>
              <td>{dayjs(orden.fecha_registro).format('DD/MM/YYYY hh:mm a.')}</td>
            </tr>
            <tr>
              <td className="label">Sexo</td>
              <td className="value">
                {orden.paciente_genero === 'M' ? 'MASCULINO' : orden.paciente_genero === 'F' ? 'FEMENINO' : '-'}
                <span className="edad-label">Edad</span>
                <span className="edad-value">{calcularEdad(orden.paciente_fecha_nacimiento || null)}</span>
              </td>
              <td className="label">Reportado el</td>
              <td>{dayjs().format('DD/MM/YYYY hh:mm a.')}</td>
            </tr>
            <tr>
              <td className="label">Cliente</td>
              <td className="value">{orden.convenio_nombre || orden.tipo_cliente_nombre || '-'}</td>
              <td className="label">Id Atención</td>
              <td>{orden.numero_atencion}</td>
            </tr>
            <tr>
              <td className="label">Medico</td>
              <td className="value">{orden.medico || '-'}</td>
              <td className="label">Sede</td>
              <td className="value">{orden.sede_nombre || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Encabezado de resultados */}
      <div className="resultados-header">
        <div className="col analisis">ANALISIS</div>
        <div className="col resultado">RESULTADO</div>
        <div className="col unidad">UNID</div>
        <div className="col rango">RANGO REFERENCIAL</div>
        <div className="col metodo">METODO</div>
      </div>
    </>
  );

  // Componente Footer que se repetirá en cada página
  const FooterContent = () => (
    <div className="footer-section">
      <div className="footer-divider"></div>
      <div className="firmas">
        {printPreferences.mostrarFirmaTecnologo && (
          <div className="firma-item">
            {firmaTecnologoUrl ? (
              <img src={firmaTecnologoUrl} alt="Firma Tecnólogo" className="firma-img" />
            ) : (
              <div className="firma-linea"></div>
            )}
            <div className="firma-cargo">Tecnólogo Médico</div>
          </div>
        )}
        {printPreferences.mostrarFirmaDirector && (
          <div className="firma-item">
            {firmaDirectorUrl ? (
              <img src={firmaDirectorUrl} alt="Firma Director" className="firma-img" />
            ) : (
              <div className="firma-linea"></div>
            )}
            <div className="firma-cargo">Director Técnico</div>
          </div>
        )}
      </div>
      
      {/* Dirección en pie de página */}
      <div className="footer-address">
        {buildFooterAddress()}
      </div>
    </div>
  );

  return (
    <div className="resultados-vista-previa">
      {/* Barra de acciones */}
      <div className="acciones-bar">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setPreferencesModalOpen(true)}
          >
            Preferencias
          </Button>
          {hasPermission('results.print') && (
            <Button 
              type="primary" 
              icon={<PrinterOutlined />}
              onClick={() => handlePrint()}
              disabled={!tieneResultados}
            >
              Imprimir Resultados
            </Button>
          )}
        </Space>
      </div>

      {/* Contenido imprimible - Estructura de tabla para header/footer en cada página */}
      <div ref={printRef} className="print-container">
        <table className="print-table">
          {/* Header que se repite en cada página */}
          <thead>
            <tr>
              <th>
                <HeaderContent />
              </th>
            </tr>
          </thead>

          {/* Footer que se repite en cada página */}
          <tfoot>
            <tr>
              <td>
                <FooterContent />
              </td>
            </tr>
          </tfoot>

          {/* Contenido de resultados */}
          <tbody>
            <tr>
              <td className="print-body-content">
                {/* Resultados por análisis */}
                {orden.analisis.map((analisis) => (
                  <div key={analisis.orden_analisis_id} className="analisis-group">
                    {/* Nombre del análisis */}
                    <div className="analisis-nombre">{analisis.analisis_nombre}</div>
                    
                    {/* Componentes del análisis */}
                    {analisis.componentes
                      .filter((c: ComponenteConResultado) => c.tiene_resultado)
                      .map((componente: ComponenteConResultado) => (
                        <div key={componente.componente_id} className="componente-row">
                          <div className="col analisis componente-nombre">
                            {componente.componente_nombre}
                          </div>
                          <div className="col resultado">
                            {componente.resultado_valor || '-'}
                          </div>
                          <div className="col unidad">
                            {componente.unidad_medida || '-'}
                          </div>
                          <div className="col rango">
                            {componente.valores_referenciales && componente.valores_referenciales.length > 0
                              ? componente.valores_referenciales.map((val, idx) => (
                                  <div key={idx}>{val}</div>
                                ))
                              : '-'}
                          </div>
                          <div className="col metodo">
                            {componente.metodo_nombre || '-'}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}

                {/* Mensaje si no hay resultados */}
                {!tieneResultados && (
                  <div className="no-resultados">
                    <p>Esta orden aún no tiene resultados registrados.</p>
                  </div>
                )}

                {/* Interpretación IA - Solo si está aprobada y tiene interpretación */}
                {printPreferences.mostrarInterpretacionIA && 
                 orden.interpretacion_ia && 
                 (orden.estado === 'APROBADA' || orden.estado === 'IMPRESO') && (
                  <div className="interpretacion-ia-section">
                    <div className="interpretacion-ia-header">
                      <span className="interpretacion-ia-icon">🤖</span>
                      <span className="interpretacion-ia-title">Interpretación de Resultados</span>
                    </div>
                    <div className="interpretacion-ia-content">
                      {orden.interpretacion_ia}
                    </div>
                    <div className="interpretacion-ia-disclaimer">
                      * Esta interpretación ha sido generada por inteligencia artificial y debe ser evaluada por su médico tratante.
                    </div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal de preferencias de impresión */}
      <PrintPreferencesModal
        open={preferencesModalOpen}
        preferences={printPreferences}
        onSave={handleSavePreferences}
        onCancel={() => setPreferencesModalOpen(false)}
      />
    </div>
  );
};
