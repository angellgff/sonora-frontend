# CerebroSonora - Frontend

Interfaz web del asistente de voz y texto para el Ecosistema Red Futura.

## 🚀 Tecnologías

- **Next.js 16** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Supabase** - Auth y almacenamiento
- **Pipecat Client** - Conexión WebRTC para voz

## ✨ Características

- ✅ Chat de voz en tiempo real
- ✅ Chat de texto sin necesidad de llamada
- ✅ Subida de imágenes (con preview)
- ✅ Subida de archivos de texto (.txt, .md, .json)
- ✅ Indicador "Pensando..." mientras el bot responde
- ✅ Alertas de error visibles
- ✅ Historial de conversaciones persistente
- ✅ Autenticación con Supabase
- ✅ Modo oscuro

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales
```

## 🔧 Ejecución

### Desarrollo Local

```bash
npm run dev
```

La aplicación estará en [http://localhost:3000](http://localhost:3000)

### Producción

```bash
npm run build
npm start
```

## 🐳 Docker

```bash
# Construir y ejecutar
docker-compose up --build

# Solo construir
docker-compose build

# Ejecutar en background
docker-compose up -d
```

## 🔑 Variables de Entorno

```env
# Conexión con Backend
NEXT_PUBLIC_PIPECAT_URL=http://localhost:7860      # Servidor de voz
PIPECAT_CHAT_URL=http://localhost:7861/api/chat    # API de texto

# Para Docker usar:
# NEXT_PUBLIC_PIPECAT_URL=http://host.docker.internal:7860
# PIPECAT_CHAT_URL=http://host.docker.internal:7861/api/chat

# Supabase (sonoraDB)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...

# Supabase (Tu Guía)
NEXT_PUBLIC_TUGUIA_URL=...
NEXT_PUBLIC_TUGUIA_ANON_KEY=...
```

## 📁 Estructura

```
CerebroSonora/
├── app/
│   ├── home-test/        # Página principal del chat
│   │   ├── page.tsx      # Componente principal
│   │   └── components/   # ChatArea, ChatControls, etc.
│   ├── api/              # API Routes (proxy)
│   │   └── chat/         # Proxy para backend
│   ├── auth/             # Páginas de autenticación
│   └── _helpers/         # Utilidades
├── hooks/
│   ├── usePipecat.tsx    # Hook para conexión de voz
│   ├── useTextChat.ts    # Hook para chat de texto
│   └── useVoiceMessages.tsx # Gestión de mensajes
├── Dockerfile
└── docker-compose.yml
```

## 🎯 Uso

### Chat de Voz
1. Ir a `/home-test`
2. Click en "Llamar"
3. Hablar con el bot

### Chat de Texto (sin llamada)
1. Ir a `/home-test`
2. Escribir mensaje y presionar Enter
3. El indicador "Pensando..." aparece mientras responde

### Subir Archivos
- **Imágenes**: Click en 📎 y seleccionar imagen
- **Archivos de texto**: Click en 📎 y seleccionar .txt/.md/.json
- Se pueden subir con o sin mensaje de texto

## 📝 Notas

- Las imágenes se guardan en Supabase Storage
- El chat de texto funciona sin necesidad de iniciar una llamada
- Los errores se muestran como alertas visibles
