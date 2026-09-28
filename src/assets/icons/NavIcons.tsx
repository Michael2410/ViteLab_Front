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
    {/* Deslizador 1 */}
    <path d="M4 6h10" />
    <path d="M18 6h2" />
    <circle cx="16" cy="6" r="2" />

    {/* Deslizador 2 */}
    <path d="M4 12h3" />
    <path d="M11 12h9" />
    <circle cx="9" cy="12" r="2" />

    {/* Deslizador 3 */}
    <path d="M4 18h11" />
    <path d="M19 18h1" />
    <circle cx="17" cy="18" r="2" />
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

// ─── 15. Cuentas de Usuario — Persona con check de verificación ─────────────
export const IconCuentaUsuario = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <circle cx="11" cy="8" r="3.4" />
    <path d="M4.8 20v-1.3A5.7 5.7 0 0 1 10.5 13h1" />
    <circle cx="17" cy="17" r="4" strokeWidth={1.2} />
    <path d="M15.2 17.1l1.2 1.2 2.3-2.5" strokeWidth={1.8} />
  </svg>
);

// ─── 16. Roles & Permisos — Escudo con ojo de llave ─────────────────────────
export const IconRolesPermisos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    <circle cx="12" cy="10.3" r="1.7" />
    <path d="M12 12v2.6" strokeWidth={1.8} />
  </svg>
);

// ─── 17. Sedes & Sucursales — Pin de ubicación con edificio ─────────────────
export const IconSedesSucursales = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M12 21s7-7.4 7-12A7 7 0 0 0 5 9c0 4.6 7 12 7 12z" />
    <rect x="9.3" y="6.3" width="5.4" height="5.2" rx="0.6" />
    <line x1="10.8" y1="8" x2="10.8" y2="9.2" />
    <line x1="13.2" y1="8" x2="13.2" y2="9.2" />
  </svg>
);

// ─── 19. Directorio de Personal — Libreta de contactos ──────────────────────
export const IconDirectorioPersonal = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="4" y="3" width="15" height="18" rx="2" />
    <line x1="18" y1="3" x2="18" y2="21" opacity={0.4} />
    <path d="M3 7.5h2M3 12h2M3 16.5h2" />
    <circle cx="10.7" cy="9.3" r="2" />
    <path d="M7.7 15.4c0-1.7 1.4-2.6 3-2.6s3 .9 3 2.6" />
  </svg>
);

// ─── 20. Contratos & Alertas — Documento con campana ────────────────────────
export const IconContratosAlertas = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    {/* Estructura del archivo */}
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    
    {/* Línea de texto general */}
    <line x1="10" y1="11" x2="15" y2="11" />
    
    {/* Dos líneas de firma paralelas (personalización) */}
    <line x1="9" y1="15" x2="15" y2="15" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

// ─── 21. Control de Vacaciones — Calendario con sol ─────────────────────────
export const IconControlVacaciones = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <circle cx="12" cy="15.2" r="2.1" />
    <line x1="12" y1="11.8" x2="12" y2="12.6" />
    <line x1="12" y1="17.8" x2="12" y2="18.6" />
    <line x1="9" y1="15.2" x2="9.8" y2="15.2" />
    <line x1="14.2" y1="15.2" x2="15" y2="15.2" />
  </svg>
);

// ─── 22. Asistencia & Faltas — Reloj con check ──────────────────────────────
export const IconAsistenciaFaltas = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <circle cx="11" cy="12" r="8" />
    <path d="M11 7.5v4.8l3 2" />
    <circle cx="18" cy="18" r="4" strokeWidth={1.2} />
    <path d="M16.3 18.1l1.1 1.1 2-2.2" strokeWidth={1.8} />
  </svg>
);

// ─── 23. Documentos & Constancias — Documento con sello ─────────────────────
export const IconDocumentosConstancias = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    {/* Hoja con pliegue */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />

    {/* Líneas de texto */}
    <line x1="8" y1="9" x2="11" y2="9" />
    <line x1="8" y1="13" x2="11" y2="13" />

    {/* Sello de constancia/certificación (Medalla integrada) */}
    <circle cx="15.5" cy="15.5" r="2.5" />
    <path d="m14 17.5-1 3.5 2.5-1.2 2.5 1.2-1-3.5" />
  </svg>
);

// ─── 24. Productos — Caja de producto ───────────────────────────────────────
export const IconProductos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M4 8l3.5-4h9L20 8" />
    <rect x="4" y="8" width="16" height="12.5" rx="1" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="12" y1="8" x2="12" y2="20.5" opacity={0.5} />
  </svg>
);

// ─── 25. Stock & Kardex — Estantes con niveles ──────────────────────────────
export const IconStockKardex = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="4" y="3.5" width="16" height="4.5" rx="1" />
    <rect x="4" y="9.8" width="16" height="4.5" rx="1" opacity={0.65} />
    <rect x="4" y="16" width="10" height="4.5" rx="1" opacity={0.4} />
  </svg>
);

// ─── 26. Ingresos — Flecha entrando a la caja ────────────────────────────────
export const IconIngresos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M12 2.5v10.5" />
    <path d="M8 9.5l4 4 4-4" />
    <path d="M4 13.5v6.3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6.3" />
  </svg>
);

// ─── 27. Despachos — Flecha saliendo de la caja ─────────────────────────────
export const IconDespachos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M12 21.5V11" />
    <path d="M8 14.5l4-4 4 4" />
    <path d="M4 10.5V4.2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6.3" />
  </svg>
);

// ─── 28. Mi Custodia & Consumos — Escudo con caja ───────────────────────────
export const IconCustodia = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    <rect x="9.2" y="9.6" width="5.6" height="4.6" rx="0.5" />
    <path d="M9.2 9.6l2.8-1.6 2.8 1.6" />
  </svg>
);

// ─── 29. Pedidos Internos — Portapapeles con flecha de envío ────────────────
export const IconPedidosInternos = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <rect x="8.5" y="2.2" width="7" height="3" rx="1" />
    <line x1="8.3" y1="11" x2="12.5" y2="11" />
    <path d="M13.8 13.3l2.2 2.2-2.2 2.2" />
    <line x1="8.3" y1="15.5" x2="13" y2="15.5" opacity={0.5} />
  </svg>
);

// ─── 30. Transferencias — Flechas opuestas de intercambio ───────────────────
export const IconTransferencias = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M4 8h13.5" />
    <path d="M14.2 4.3L18 8l-3.8 3.7" />
    <path d="M20 16H6.5" />
    <path d="M9.8 12.3L6 16l3.8 3.7" />
  </svg>
);

// ─── 31. Ajustes & Bajas — Caja con signo menos ─────────────────────────────
export const IconAjustesBajas = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <path d="M5 9l7-5.2 7 5.2" />
    <rect x="5" y="9" width="14" height="11.5" rx="1.3" />
    <line x1="9" y1="14.8" x2="15" y2="14.8" strokeWidth={2} />
  </svg>
);

// ─── 32. Proveedores — Camión de reparto ────────────────────────────────────
export const IconProveedores = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="2" y="7.5" width="11" height="8.5" rx="1" />
    <path d="M13 10.5h3.7l3.3 3.2v2.3h-7z" />
    <circle cx="6" cy="18.3" r="1.6" />
    <circle cx="16.7" cy="18.3" r="1.6" />
    <line x1="7.6" y1="18.3" x2="15.1" y2="18.3" />
  </svg>
);

// ─── 33. Maestros (Almacén) — Regla de unidades y medidas ───────────────────
export const IconMaestrosAlmacen = (props?: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...baseProps} {...props}>
    <rect x="3" y="9.3" width="18" height="6" rx="1.2" transform="rotate(-8 12 12)" />
    <line x1="6.7" y1="9.7" x2="7.3" y2="12.1" />
    <line x1="10.7" y1="9" x2="11.3" y2="11.4" />
    <line x1="14.7" y1="8.3" x2="15.3" y2="10.7" />
  </svg>
);
