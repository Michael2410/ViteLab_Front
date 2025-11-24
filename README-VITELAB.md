# ViteLab - Frontend

Sistema de Laboratorio Clínico (LIMS) - Frontend

## 🚀 Tecnologías

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Ant Design** - UI Components
- **React Router** - Routing
- **React Query** (@tanstack/react-query) - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client con interceptores JWT
- **PDFMake** - Generación de reportes PDF

## 📁 Estructura del Proyecto

```
src/
├── modules/              # Módulos funcionales
│   ├── auth/            # Autenticación
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   └── types.ts
│   ├── orders/          # Órdenes de atención
│   ├── results/         # Seguimiento de resultados
│   ├── catalogs/        # Catálogos
│   ├── tariffs/         # Tarifarios
│   └── settings/        # Configuración
├── shared/              # Código compartido
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── App.tsx
└── main.tsx
```

## 🔧 Instalación

```bash
npm install
```

## 🏃 Desarrollo

```bash
npm run dev
```

El frontend correrá en: http://localhost:5173

## 🔑 Usuario de Prueba

- **Usuario:** admin
- **Contraseña:** admin123

## 🌐 Variables de Entorno

Crear archivo `.env`:

```
VITE_API_URL=http://localhost:3000/api
```

## 📦 Build para Producción

```bash
npm run build
npm run preview
```

## 🎨 Características

- ✅ Autenticación con JWT (Access + Refresh Token)
- ✅ Interceptores automáticos para renovar tokens
- ✅ Sistema de permisos granular
- ✅ Rutas protegidas
- ✅ Diseño responsivo
- ✅ Gestión de estado con React Query
- ✅ Generación de PDFs
