import type { SVGProps } from 'react';

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: '1em',
  height: '1em',
  style: { verticalAlign: '-0.125em' },
};

// ─── 1. Dashboard — Tacómetro de precisión ───────────────────────────────────
export const IconDashboard = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M4.93 19.07A10 10 0 1 1 19.07 19.07" />
    <path d="M12 12l4-4" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="5" x2="12" y2="7" />
    <line x1="6.5" y1="7.5" x2="8" y2="9" />
    <line x1="17.5" y1="7.5" x2="16" y2="9" />
  </svg>
);

// ─── 2. Órdenes — Documento con checklist y roseta ───────────────────────────
export const IconOrdenes = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z" />
    <rect x="5" y="5" width="14" height="16" rx="2" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="15" y2="14" />
    <line x1="9" y1="18" x2="12" y2="18" />
  </svg>
);

// ─── 3. Resultados — Matraz con ADN y burbujas ───────────────────────────────
export const IconResultados = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M9 2.5h6M9.5 2.5v5l-6 10.7A2 2 0 0 0 5.2 21.5h13.6a2 2 0 0 0 1.7-3.3L14.5 7.5v-5" />
    <path d="M10 6h2M11.5 9h2M13 12h2" opacity={0.7} />
    <path d="M5.5 16c2-1 4.5 1 6.5 0s4 1 6.5 0" strokeWidth={1.3} />
    <path d="M10 14c1.5 1 2.5 1 4 0M10 17.5c1.5-1 2.5-1 4 0" strokeWidth={1.2} />
    <path d="M12 13.5v4.5" strokeDasharray="1 1.2" opacity={0.7} />
    <circle cx="8.5" cy="18" r="0.9" fill="currentColor" />
    <circle cx="15.5" cy="18.5" r="0.7" fill="currentColor" />
    <circle cx="12" cy="10" r="0.8" fill="currentColor" opacity={0.6} />
  </svg>
);

// ─── 4. Aprobaciones — Escudo con doble contorno y check ─────────────────────
export const IconAprobaciones = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M12 3L4 6.5v6c0 5 3.5 8.7 8 9.5 4.5-.8 8-4.5 8-9.5v-6L12 3z" />
    <path d="M9 12.5l2 2 4-4.5" strokeWidth={2.3} />
  </svg>
);

// ─── 5. Catálogos — Gaveta con pestañas y lupa ───────────────────────────────
export const IconCatalogos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M4 8V6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2" />
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <line x1="3" y1="13" x2="21" y2="13" />
    <line x1="10" y1="16.5" x2="14" y2="16.5" />
  </svg>
);

// ─── 6. Usuarios — Equipo jerárquico con insignia "+" ────────────────────────
export const IconUsuarios = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <circle cx="9" cy="6.8" r="3.4" />
    <path d="M7 6.8c0 1.1.9 2 2 2s2-.9 2-2" opacity={0.4} />
    <path d="M2.8 20.5v-2a4.2 4.2 0 0 1 4.2-4.2h4a4.2 4.2 0 0 1 4.2 4.2v2" />
    <path d="M9 14.3v3M7.8 17.3h2.4" opacity={0.6} />
    <circle cx="16.8" cy="7.8" r="2.5" opacity={0.75} />
    <path d="M17.5 14a3.8 3.8 0 0 1 3.7 3.7v2.8" opacity={0.75} />
    <circle cx="19.5" cy="5" r="2.2" strokeWidth={1} />
    <path d="M19.5 3.8v2.4M18.3 5h2.4" strokeWidth={1.3} />
  </svg>
);

// ─── 7. Reportes — Barras + tendencia + pie-chart ────────────────────────────
export const IconReportes = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <line x1="3" y1="21" x2="21" y2="21" />
    <line x1="6" y1="21" x2="6" y2="13" strokeWidth={2.5} />
    <line x1="12" y1="21" x2="12" y2="9" strokeWidth={2.5} />
    <line x1="18" y1="21" x2="18" y2="5" strokeWidth={2.5} />
    <path d="M6 10l5-4 4 3 5-5" strokeWidth={1.8} />
    <polyline points="17 4 20 4 20 7" strokeWidth={1.8} />
  </svg>
);

// ─── 8. Configuración — Doble engranaje industrial ───────────────────────────
export const IconConfiguracion = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M11 2.2h2l.4 1.8a7.7 7.7 0 0 1 1.8.7l1.5-1.1 1.4 1.4-1.1 1.5c.3.6.5 1.2.7 1.8l1.8.4v2l-1.8.4a7.7 7.7 0 0 1-.7 1.8l1.1 1.5-1.4 1.4-1.5-1.1a7.7 7.7 0 0 1-1.8.7l-.4 1.8h-2l-.4-1.8a7.7 7.7 0 0 1-1.8-.7l-1.5 1.1-1.4-1.4 1.1-1.5a7.7 7.7 0 0 1-.7-1.8l-1.8-.4v-2l1.8-.4a7.7 7.7 0 0 1 .7-1.8L4.3 6.4l1.4-1.4 1.5 1.1c.6-.3 1.2-.5 1.8-.7l.4-1.8z" />
    <circle cx="12" cy="11.5" r="4.2" strokeWidth={1.2} />
    <path d="M12 9.8a1.7 1.7 0 0 0-.9 3.1l-.3 1.6h2.4l-.3-1.6A1.7 1.7 0 0 0 12 9.8z" fill="currentColor" fillOpacity={0.2} />
    <circle cx="18" cy="18" r="3.2" strokeWidth={1.2} />
    <circle cx="18" cy="18" r="1.1" fill="currentColor" />
  </svg>
);

// ─── 9. Almacén — Caja cúbica isométrica / Logística ────────────────────────
export const IconAlmacen = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
    <path d="M7.5 4.5l9 5.2" opacity={0.5} strokeDasharray="1 1.5" />
  </svg>
);

// ─── 10. Personal / RRHH — Credencial con avatar y cordón ────────────────────
export const IconPersonal = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M9 2h6v3H9z" />
    <circle cx="12" cy="11" r="2.5" />
    <path d="M8 17.5c0-1.8 1.8-2.8 4-2.8s4 1 4 2.8" />
  </svg>
);

// ─── 11. Apps / Switcher — Matriz 3x3 moderna ────────────────────────────────
export const IconApps = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="4" y="4" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="10" y="4" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="16" y="4" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="4" y="10" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="16" y="10" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="4" y="16" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="10" y="16" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
    <rect x="16" y="16" width="4" height="4" rx="1" fill="currentColor" fillOpacity={0.2} />
  </svg>
);

// ─── 12. Análisis Clínicos — Tubo de ensayo con graduación y reactivo ───────
export const IconAnalisisClinicos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M14.5 2v17.5a2.5 2.5 0 0 1-5 0V2" />
    <path d="M8.5 2h7" />
    <path d="M9.5 12h5" />
    <path d="M9.5 8h3" />
    <path d="M9.5 15h4" />
    <circle cx="12" cy="17.5" r="0.8" fill="currentColor" />
  </svg>
);

// ─── 13. Parámetros del Lab — Sliders técnicos de calibración ────────────────
export const IconParametrosLab = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <circle cx="4" cy="12" r="2" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <circle cx="12" cy="10" r="2" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <circle cx="20" cy="14" r="2" />
  </svg>
);

// ─── 14. Tarifas & Convenios — Esquema comercial y convenios ─────────────────
export const IconTarifasConvenios = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <circle cx="12" cy="12.5" r="2.8" strokeWidth={1.2} />
    <path d="M12 11v3M10.8 11.8h2.4" />
    <line x1="2" y1="10" x2="22" y2="10" strokeDasharray="1.5 1.5" opacity={0.6} />
  </svg>
);

