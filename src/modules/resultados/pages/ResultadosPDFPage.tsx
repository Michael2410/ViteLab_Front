/**
 * Página especial para generación de PDF via Puppeteer
 * Esta página acepta el token via query parameter para autenticación
 * Solo debe ser usada por el backend para generar PDFs
 * 
 * IMPORTANTE: Usa la misma estructura que ResultadosVistaPreviaPage
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Spin, Result } from 'antd';
import dayjs from 'dayjs';
import { useConfiguracion } from '../../sistema/hooks';
import type { OrdenConResultados, ComponenteConResultado } from '../types';
import { defaultPrintPreferences } from '../components';
import type { PrintPreferences } from '../components';
import './ResultadosVistaPreviaPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL.replace('/api', '')}${path}`;
};

const calcularEdad = (fechaNacimiento: string | null | undefined): string => {
  if (!fechaNacimiento) return '-';
  const hoy = dayjs();
  const nacimiento = dayjs(fechaNacimiento);
  const años = hoy.diff(nacimiento, 'year');
  return `${años} a.`;
};

export const ResultadosPDFPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const ordenId = parseInt(id || '0', 10);
  
  const [orden, setOrden] = useState<OrdenConResultados | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: configuracion } = useConfiguracion();

  // Cargar preferencias de impresión (usar las por defecto para PDF)
  const printPreferences: PrintPreferences = defaultPrintPreferences;

  // Cargar datos directamente con el token
  useEffect(() => {
    const fetchOrden = async () => {
      if (!token || !ordenId) {
        setError('Token o ID de orden no proporcionado');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/resultados/orden/${ordenId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setOrden(result.data);
        } else {
          throw new Error(result.message || 'Error al cargar la orden');
        }
      } catch (err: any) {
        console.error('Error fetching orden:', err);
        setError(err.message || 'Error al cargar los resultados');
      } finally {
        setLoading(false);
      }
    };

    fetchOrden();
  }, [token, ordenId]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Cargando resultados..." />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <Result
        status="error"
        title="Error"
        subTitle={error || 'No se pudieron cargar los resultados'}
      />
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

  // Componente Header que se repetirá en cada página (igual que ResultadosVistaPreviaPage)
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

  // Componente Footer que se repetirá en cada página (igual que ResultadosVistaPreviaPage)
  const FooterContent = () => (
    <div className="footer-section">
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
      {/* Contenido imprimible - Estructura de tabla para header/footer en cada página */}
      <div className="print-container">
        <table className="print-table">
          {/* Header que se repite en cada página */}
          <thead>
            <tr>
              <th>
                <HeaderContent />
              </th>
            </tr>
          </thead>

          {/* Footer espaciador - reserva espacio para el footer fijo */}
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
                {/*{printPreferences.mostrarInterpretacionIA && 
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
                )}*/}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer fijo para impresión - se posiciona al fondo de cada página */}
        <div className="footer-fixed-print">
          <FooterContent />
        </div>
      </div>
    </div>
  );
};

export default ResultadosPDFPage;
