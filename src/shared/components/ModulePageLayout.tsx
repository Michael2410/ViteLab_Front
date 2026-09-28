import React, { type ReactNode } from 'react';
export { BrandCreateButton, type BrandCreateButtonProps } from './BrandCreateButton';

export const brandButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
  border: 'none',
  borderRadius: 8,
  height: 38,
  fontWeight: 600,
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
  padding: '0 18px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export const brandControlStyle: React.CSSProperties = {
  borderRadius: 12,
  height: 32,
};

export const brandSearchStyle: React.CSSProperties = {
  ...brandControlStyle,
  borderColor: '#cbd5e1',
};

export interface ModulePageLayoutProps {
  /** Título principal de la sección (ej. "Muestras Biológicas") */
  title: ReactNode;
  /** Subtítulo descriptivo */
  subtitle?: ReactNode;
  /** Botón de acción principal o botones a la derecha del encabezado (ej. "Nueva Muestra") */
  actionButton?: ReactNode;
  /** Elementos adicionales en la cabecera (alertas, tags o tabs secundarios) */
  extraHeader?: ReactNode;
  /** Fila de estadísticas o KPIs (opcional, como en Personal o Reportes) */
  stats?: ReactNode;
  /** Barra de herramientas de filtros / buscador (opcional) */
  filters?: ReactNode;
  /** Si debe encapsular el `children` en una tarjeta (por defecto false: tabla libre y limpia) */
  wrapInTableCard?: boolean;
  /** Padding interno de la tarjeta de tabla (opcional) */
  cardPadding?: string | number;
  /** Contenido principal (típicamente <Table ... />) */
  children: ReactNode;
  /** Estilos adicionales para el contenedor principal */
  style?: React.CSSProperties;
}

/**
 * Componente de maquetación estándar para todas las vistas de gestión, catálogos y listados de ViteLab.
 * Garantiza armonía estética, proporciones milimétricas, espaciados idénticos y diseño premium.
 */
export const ModulePageLayout: React.FC<ModulePageLayoutProps> = ({
  title,
  subtitle,
  actionButton,
  extraHeader,
  stats,
  filters,
  wrapInTableCard = false,
  cardPadding = '16px 20px 20px 20px',
  children,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        width: '100%',
        ...style,
      }}
    >
      {/* 1. Encabezado en canvas libre: Título + Subtítulo + Botón de Acción Principal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#64748b',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actionButton && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {actionButton}
          </div>
        )}
      </div>

      {/* 2. Extra header (alertas, badges, etc.) */}
      {extraHeader && <div>{extraHeader}</div>}

      {/* 3. Estadísticas / KPIs (Opcional) */}
      {stats && <div>{stats}</div>}

      {/* 4. Barra de Filtros / Herramientas (Opcional) */}
      {filters && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
          }}
        >
          {filters}
        </div>
      )}

      {/* 5. Contenido Principal (Tabla libre por defecto) */}
      {wrapInTableCard ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: cardPadding,
            overflow: 'hidden',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          {children}
        </div>
      ) : (
        <div style={{ width: '100%' }}>{children}</div>
      )}
    </div>
  );
};

export default ModulePageLayout;

