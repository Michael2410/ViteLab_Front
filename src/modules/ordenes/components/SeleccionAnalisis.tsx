import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Input,
  Button,
  Modal,
  Empty,
  Spin,
  InputNumber,
} from 'antd';
import {
  ExperimentOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useBuscarAnalisis } from '../hooks';
import { obtenerPreciosAnalisis } from '../api';
import { useAuthStore } from '../../auth/hooks';
import type { AnalisisSeleccionado, Analisis, MuestraSimple } from '../types';

const { Text } = Typography;

export interface AnalisisConMuestras extends Analisis {
  muestras_ids?: number[];
  muestras_nombres?: string[];
  precio?: number;
}

interface SeleccionAnalisisProps {
  analisisSeleccionados: AnalisisSeleccionado[];
  onAnalisisChange: (analisis: AnalisisSeleccionado[]) => void;
  convenioId?: number;
  analisisIniciales?: AnalisisConMuestras[];
}

export const SeleccionAnalisis: React.FC<SeleccionAnalisisProps> = ({
  analisisSeleccionados,
  onAnalisisChange,
  convenioId,
  analisisIniciales,
}) => {
  const { hasPermission, user } = useAuthStore();
  const isSuperAdmin = user?.rol_nombre === 'SUPER_ADMIN' || user?.rol_id === 1;
  const canEditPrice = isSuperAdmin || hasPermission('orders.edit_price');

  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [analisisAgregados, setAnalisisAgregados] = useState<AnalisisConMuestras[]>(
    analisisIniciales || []
  );

  useEffect(() => {
    if (analisisIniciales && analisisIniciales.length > 0 && analisisAgregados.length === 0) {
      setAnalisisAgregados(analisisIniciales);
    }
  }, [analisisIniciales]);
  const [muestraModalVisible, setMuestraModalVisible] = useState(false);
  const [analisisParaAgregar, setAnalisisParaAgregar] = useState<Analisis | null>(null);
  const [muestrasSeleccionadas, setMuestrasSeleccionadas] = useState<number[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const shouldSearch = debouncedBusqueda.trim().length >= 2;
  const { data: resultadosBusqueda, isLoading: loadingBusqueda } = useBuscarAnalisis(debouncedBusqueda, shouldSearch);

  // Cerrar dropdown al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Obtener muestras disponibles de los componentes del análisis seleccionado
  const muestrasDisponibles = useMemo(() => {
    if (!analisisParaAgregar?.componentes) return [];
    
    const muestrasMap = new Map<number, MuestraSimple>();
    analisisParaAgregar.componentes.forEach((componente) => {
      if (componente.muestras && componente.muestras.length > 0) {
        componente.muestras.forEach((muestra) => {
          if (!muestrasMap.has(muestra.id)) {
            muestrasMap.set(muestra.id, muestra);
          }
        });
      }
    });
    
    return Array.from(muestrasMap.values());
  }, [analisisParaAgregar]);

  // Debounce manual
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [busqueda]);

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusqueda(val);
    if (val.trim().length >= 2) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  const handleAgregarAnalisis = (analisis: Analisis) => {
    // Verificar si ya está agregado
    if (analisisSeleccionados.some((a) => a.id === analisis.id)) {
      return;
    }

    // Extraer muestras disponibles de sus componentes
    const muestrasMap = new Map<number, MuestraSimple>();
    analisis.componentes?.forEach((componente) => {
      componente.muestras?.forEach((muestra) => {
        if (!muestrasMap.has(muestra.id)) {
          muestrasMap.set(muestra.id, muestra);
        }
      });
    });
    const muestras = Array.from(muestrasMap.values());

    // Preseleccionar por defecto todas las muestras disponibles (habitualmente 1)
    if (muestras.length > 0) {
      setMuestrasSeleccionadas(muestras.map((m) => m.id));
    } else {
      setMuestrasSeleccionadas([]);
    }

    // Abrir modal para confirmar muestras
    setAnalisisParaAgregar(analisis);
    setMuestraModalVisible(true);
  };

  const handleConfirmarMuestras = async () => {
    if (!analisisParaAgregar) return;

    // Obtener precio del análisis según el tarifario
    let precio = 0;
    try {
      const precios = await obtenerPreciosAnalisis([analisisParaAgregar.id], convenioId);
      if (precios.length > 0) {
        precio = precios[0].precio;
      }
    } catch (error) {
      console.error('Error al obtener precio:', error);
    }

    const nuevoAnalisis: AnalisisSeleccionado = {
      id: analisisParaAgregar.id,
      muestras_ids: muestrasSeleccionadas.length > 0 ? muestrasSeleccionadas : undefined,
    };

    const analisisConMuestras: AnalisisConMuestras = {
      ...analisisParaAgregar,
      muestras_ids: muestrasSeleccionadas.length > 0 ? muestrasSeleccionadas : undefined,
      muestras_nombres: muestrasSeleccionadas.length > 0 
        ? muestrasSeleccionadas.map(id => 
            muestrasDisponibles.find(m => m.id === id)?.nombre || ''
          ).filter(Boolean)
        : undefined,
      precio,
    };

    setAnalisisAgregados([...analisisAgregados, analisisConMuestras]);
    onAnalisisChange([...analisisSeleccionados, nuevoAnalisis]);

    setMuestraModalVisible(false);
    setAnalisisParaAgregar(null);
    setMuestrasSeleccionadas([]);
  };

  const handlePriceChange = (analisisId: number, nuevoPrecio: number | null) => {
    const precioNumerico = nuevoPrecio !== null && nuevoPrecio !== undefined ? nuevoPrecio : 0;
    setAnalisisAgregados((prev) =>
      prev.map((item) =>
        item.id === analisisId ? { ...item, precio: precioNumerico } : item
      )
    );
    onAnalisisChange(
      analisisSeleccionados.map((item) =>
        item.id === analisisId ? { ...item, precio: precioNumerico } : item
      )
    );
  };

  const handleEliminarAnalisis = (analisisId: number) => {
    setAnalisisAgregados(analisisAgregados.filter((a) => a.id !== analisisId));
    onAnalisisChange(analisisSeleccionados.filter((a) => a.id !== analisisId));
  };

  // Columnas para análisis seleccionados
  const columnasSeleccionados: ColumnsType<AnalisisConMuestras> = [
    {
      title: 'Análisis',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string) => (
        <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
          {nombre}
        </Text>
      ),
    },
    {
      title: 'Tipos de Muestra',
      key: 'muestras_nombres',
      width: 240,
      render: (_, record: AnalisisConMuestras) =>
        record.muestras_nombres && record.muestras_nombres.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {record.muestras_nombres.map((nombre, idx) => (
              <Tag key={idx} color="blue" style={{ borderRadius: 4, margin: 0, fontSize: 11 }}>
                {nombre}
              </Tag>
            ))}
          </Space>
        ) : (
          <Tag style={{ borderRadius: 4, margin: 0, fontSize: 11, color: '#94a3b8' }}>
            Sin especificar
          </Tag>
        ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      width: canEditPrice ? 140 : 120,
      align: 'right',
      render: (precio: number, record: AnalisisConMuestras) =>
        canEditPrice ? (
          <InputNumber
            min={0}
            precision={2}
            prefix="S/ "
            value={precio}
            onChange={(val) => handlePriceChange(record.id, val)}
            size="small"
            style={{ width: 115, fontWeight: 600 }}
          />
        ) : (
          <Text strong style={{ color: '#1677ff', fontSize: 13 }}>
            S/ {(precio || 0).toFixed(2)}
          </Text>
        ),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 70,
      align: 'center',
      render: (_, record: AnalisisConMuestras) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined style={{ fontSize: 15 }} />}
          onClick={() => handleEliminarAnalisis(record.id)}
          style={{ borderRadius: 4 }}
        />
      ),
    },
  ];

  // Calcular total
  const totalPrecios = analisisAgregados.reduce((sum, a) => sum + (a.precio || 0), 0);

  return (
    <div style={{ width: '100%' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Buscador con Menú Desplegable Flotante (Dropdown Pop-up) */}
        <div ref={searchContainerRef} style={{ position: 'relative', width: '100%', zIndex: 100 }}>
          <Input
            placeholder="Buscar análisis por nombre o sinonimia (ej. Glucosa, Hemograma)..."
            prefix={<SearchOutlined style={{ color: '#1677ff', fontSize: 16 }} />}
            value={busqueda}
            onChange={handleBusquedaChange}
            onFocus={() => {
              if (busqueda.trim().length >= 2) setIsDropdownOpen(true);
            }}
            size="large"
            allowClear
            style={{ borderRadius: 8, height: 44, fontSize: 14 }}
          />

          {/* Menú Desplegable Flotante */}
          {isDropdownOpen && debouncedBusqueda.trim().length >= 2 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 1050,
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                boxShadow: '0 14px 28px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
                maxHeight: 340,
                overflowY: 'auto',
                padding: '4px 0',
              }}
            >
              {/* Encabezado del Pop-up */}
              <div
                style={{
                  padding: '6px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#f8fafc',
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: '#64748b',
                  }}
                >
                  {loadingBusqueda
                    ? 'Buscando...'
                    : `${resultadosBusqueda?.length || 0} resultados encontrados`}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, color: '#94a3b8' }}>
                  Esc para cerrar
                </Text>
              </div>

              {/* Lista o estados */}
              {loadingBusqueda ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                    Buscando análisis...
                  </Text>
                </div>
              ) : !resultadosBusqueda || resultadosBusqueda.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      No se encontraron análisis para "<strong>{debouncedBusqueda}</strong>"
                    </span>
                  }
                  style={{ margin: '16px 0' }}
                />
              ) : (
                resultadosBusqueda.map((analisis) => {
                  const yaAgregado = analisisSeleccionados.some((a) => a.id === analisis.id);
                  return (
                    <div
                      key={analisis.id}
                      onClick={() => {
                        if (!yaAgregado) {
                          handleAgregarAnalisis(analisis);
                          setIsDropdownOpen(false);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        cursor: yaAgregado ? 'default' : 'pointer',
                        backgroundColor: yaAgregado ? '#f8fafc' : '#ffffff',
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!yaAgregado) e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!yaAgregado) e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 13, color: yaAgregado ? '#64748b' : '#0f172a' }}>
                            {analisis.nombre}
                          </Text>
                        </div>
                        {analisis.sinonimia && analisis.sinonimia.length > 0 && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            <span style={{ color: '#94a3b8' }}>Sinonimias: </span>
                            {analisis.sinonimia.join(', ')}
                          </div>
                        )}
                        {analisis.componentes && analisis.componentes.length > 0 && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            Componentes: {analisis.componentes.map((c) => c.nombre).join(', ')}
                          </div>
                        )}
                      </div>

                      <div>
                        {yaAgregado ? (
                          <Tag
                            color="success"
                            icon={<CheckOutlined />}
                            style={{ borderRadius: 6, margin: 0, padding: '2px 8px', fontSize: 12 }}
                          >
                            Agregado
                          </Tag>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            style={{ borderRadius: 6, fontWeight: 500 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgregarAnalisis(analisis);
                              setIsDropdownOpen(false);
                            }}
                          >
                            Agregar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Tabla de exámenes de la orden */}
        <Card
          size="small"
          style={{ borderRadius: 8, overflow: 'hidden' }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            tableLayout="fixed"
            columns={columnasSeleccionados}
            dataSource={analisisAgregados}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{
              emptyText: (
                <Empty
                  description="Busque y agregue análisis usando el campo de arriba"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            summary={() => (
              analisisAgregados.length > 0 ? (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ backgroundColor: '#f8fafc' }}>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong style={{ fontSize: 13, letterSpacing: '0.3px', paddingLeft: 8 }}>TOTAL</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ color: '#1677ff', fontSize: 14 }}>
                        S/ {totalPrecios.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              ) : null
            )}
          />
        </Card>
      </Space>

      {/* Modal para seleccionar muestras - Diseño directo y limpio */}
      <Modal
        title={
          <Space align="center" size="small">
            <ExperimentOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Tipo de Muestra Requerido</span>
          </Space>
        }
        open={muestraModalVisible}
        onCancel={() => {
          setMuestraModalVisible(false);
          setAnalisisParaAgregar(null);
          setMuestrasSeleccionadas([]);
        }}
        onOk={handleConfirmarMuestras}
        okText="Confirmar y Agregar"
        cancelText="Cancelar"
        width={420}
        destroyOnClose
      >
        {analisisParaAgregar && (
          <div style={{ paddingTop: 6 }}>
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Examen Seleccionado
              </Text>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {analisisParaAgregar.nombre}
              </div>
            </div>

            {muestrasDisponibles.length > 0 ? (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Seleccione el tipo de muestra aplicable:
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {muestrasDisponibles.map((m) => {
                    const isSelected = muestrasSeleccionadas.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isSelected) {
                            setMuestrasSeleccionadas(muestrasSeleccionadas.filter((id) => id !== m.id));
                          } else {
                            setMuestrasSeleccionadas([...muestrasSeleccionadas, m.id]);
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 20,
                          border: isSelected ? '1.5px solid #1677ff' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          userSelect: 'none',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 6px rgba(22, 119, 255, 0.15)' : 'none',
                        }}
                      >
                        {isSelected && <CheckOutlined style={{ fontSize: 12, color: '#1677ff' }} />}
                        {m.nombre}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Este examen no requiere selección de tipo de muestra. Se agregará directamente a la orden.
              </Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
