# ViteLab Frontend - Sistema de Laboratorio Clínico (LIMS)

Interfaz de usuario moderna, reactiva y elegante desarrollada con React 19, TypeScript, Vite y Ant Design para la gestión operativa y administrativa de laboratorios clínicos.

---

## Tecnologías

- **Core:** React 19 + TypeScript + Vite
- **UI & Componentes:** Ant Design (AntD) 5 + `@ant-design/icons`
- **Routing:** React Router DOM 7 (SPA)
- **Estado Global:** Zustand
- **Peticiones HTTP & Caché:** TanStack React Query + Axios
- **WebSockets (Cliente):** Socket.io Client (notificaciones en tiempo real y estado de WhatsApp)
- **Exportación:** HTML2Canvas + jsPDF para reportes y órdenes

---

## Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura la URL de la API:

```bash
cp .env.example .env
```

---

## Métodos de Despliegue

### 1. Despliegue Local (Desarrollo / Producción)

#### Prerrequisitos:
- Node.js 20+ y npm instalados.
- Backend de ViteLab en ejecución o accesible mediante `VITE_API_URL`.

#### Pasos:
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
npm run dev

# 3. Compilar bundle de producción optimizado
npm run build

# 4. Previsualizar el bundle de producción localmente
npm run preview
```
* **Acceso en desarrollo:** `http://localhost:5173`

---

### 2. Despliegue con Docker (Contenedor Individual con Nginx)

El frontend cuenta con un `Dockerfile` multi-stage que compila los activos estáticos y los sirve con un servidor web **Nginx Alpine** de alto rendimiento.

#### Pasos:
```bash
# 1. Construir la imagen Docker
docker build -t vitelab-front .

# 2. Ejecutar el contenedor
docker run -d \
  --name vitelab-front \
  -p 8080:80 \
  --restart unless-stopped \
  vitelab-front
```
* **Acceso a la aplicación:** `http://localhost:8080`

---

### 3. Despliegue con Docker Compose (Stack Completo)

Desde la raíz del repositorio general (`ViteLab`), el archivo `docker-compose.yml` inicia conjuntamente el Frontend y el Backend en la misma red interna:

```bash
# 1. Construir y encender los contenedores
docker compose up -d --build

# 2. Consultar logs del frontend en tiempo real
docker compose logs -f frontend

# 3. Detener y remover los contenedores
docker compose down
```
* **Frontend:** `http://localhost:8080`
* **Backend:** `http://localhost:3000`

---

### 4. Despliegue en Entornos Gratuitos (Demo en la Nube: Vercel)

Vercel es la plataforma ideal y 100% gratuita para desplegar este frontend gracias a su red CDN global y certificados SSL automáticos.

#### Prerrequisitos:
- El proyecto ya incluye el archivo `vercel.json` configurado para manejar el enrutamiento SPA de React Router y evitar errores 404 al recargar páginas:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

#### Pasos en Vercel:
1. Inicia sesión en [Vercel Dashboard](https://vercel.com).
2. Haz clic en **Add New... > Project** e importa el repositorio `ViteLab_Front`.
3. En la configuración del proyecto:
   - **Framework Preset:** `Vite` (detectado automáticamente).
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. En la sección **Environment Variables**, añade:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://vitelab-api.onrender.com/api` (la URL pública de tu backend desplegado en Render).
   - **Entornos:** Selecciona `Production` y `Preview`.
5. Haz clic en **Deploy**.

> Vercel compilará la app en segundos y te otorgará un enlace público HTTPS (ej. `https://vitelab-front.vercel.app`).
