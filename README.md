# Sonora Frontend

Frontend Next.js para el asistente de voz Sonora. Desplegado en Coolify.

## Ecosistema Sonora

Este frontend es parte de un sistema de 3 repositorios:

| Repositorio | Descripción | Despliegue |
|-------------|-------------|------------|
| **sonora-frontend** (este) | Frontend Next.js | Coolify |
| [sonora-test](https://github.com/Lifimastar/sonora-test) | Bot de voz Pipecat | Pipecat Cloud |
| [sonora-chat](https://github.com/Lifimastar/sonora-chat) | API de chat | Coolify |

**Flujo:** Usuario → sonora-frontend → Pipecat Cloud → sonora-test → Supabase

## Tecnologías

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** TailwindCSS
- **Estado:** React Hooks
- **Voz:** @pipecat-ai/client-js + @pipecat-ai/daily-transport
- **DB:** Supabase

## Estructura Importante

```
sonora-frontend/
├── app/
│   ├── api/
│   │   └── voice/
│   │       └── start/route.ts    # Inicia sesión con Pipecat Cloud
│   ├── home-test/
│   │   └── page.tsx              # Página principal de voz
│   └── _helpers/                 # Funciones auxiliares
├── hooks/
│   ├── usePipecatCloud.tsx       # ✅ USAR EN PRODUCCIÓN (DailyTransport)
│   ├── usePipecat.tsx            # ⚠️ SOLO DESARROLLO LOCAL (SmallWebRTC)
│   ├── useVoiceMessages.tsx      # Manejo de transcripciones
│   └── useMessages.tsx           # Manejo de mensajes
├── components/                   # Componentes UI
└── .env                          # Variables de entorno
```

## Configuración

### Variables de Entorno (.env)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx

# Tu Guía (otro proyecto)
NEXT_PUBLIC_TUGUIA_URL=https://xxx.supabase.co
NEXT_PUBLIC_TUGUIA_ANON_KEY=xxx

# Pipecat Cloud (PRODUCCIÓN)
PIPECAT_CLOUD_API_KEY=pk_xxx          # API key pública
PIPECAT_AGENT_NAME=sonora-voice       # Nombre del agente

# URLs
NEXT_PUBLIC_PIPECAT_URL=http://localhost:7860  # Solo desarrollo local
PIPECAT_CHAT_URL=http://host.docker.internal:7861/api/chat
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm run dev  # Puerto 3001
```

## Flujo de Conexión de Voz

```
1. Usuario → Clic "Iniciar llamada"
                    │
2. page.tsx → usePipecatCloud.connect(conversationId, userId)
                    │
3. Hook → fetch("/api/voice/start")
                    │
4. API Route → POST https://api.pipecat.daily.co/v1/public/sonora-voice/start
                    │
5. Retorna → { dailyRoom, dailyToken, sessionId }
                    │
6. Hook → DailyTransport.connect({ url: dailyRoom, token: dailyToken })
                    │
7. Callback → onBotConnected se ejecuta
                    │
8. Hook → sendClientMessage("action", { action: "set_conversation_id", ... })
                    │
9. Bot → Recibe conversation_id y saluda
```

## Hooks de Voz

### usePipecatCloud.tsx (✅ PRODUCCIÓN)

```typescript
const {
  connect,           // Conectar al bot
  disconnect,        // Desconectar
  sendTextMessage,   // Enviar mensaje de texto
  isConnected,       // Estado de conexión
  isBotSpeaking,     // Bot está hablando
  error,             // Error actual
} = usePipecatCloud(callbacks);
```

**Callbacks disponibles:**
- `onUserTranscript` - Cuando el usuario habla
- `onBotTranscript` - Cuando el bot responde
- `onBotStartedSpeaking` - Bot comenzó a hablar
- `onBotStoppedSpeaking` - Bot dejó de hablar

### usePipecat.tsx (⚠️ SOLO LOCAL)

Hook antiguo que usa `SmallWebRTCTransport`. Solo funciona cuando el bot corre localmente en `localhost:7860`.

## API Routes

### /api/voice/start

Inicia una sesión con Pipecat Cloud.

**Request:** POST
```json
{
  "conversationId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "url": "https://xxx.daily.co/roomId",
  "token": "jwt...",
  "sessionId": "uuid"
}
```

## Despliegue

### Coolify (Producción)

1. Push a `main` → Auto-redeploy
2. Variables de entorno configuradas en Coolify (Runtime)
3. Dockerfile multi-stage para producción

### Variables en Coolify

| Variable | Buildtime | Runtime |
|----------|-----------|---------|
| PIPECAT_CLOUD_API_KEY | ❌ | ✅ |
| PIPECAT_AGENT_NAME | ❌ | ✅ |
| NEXT_PUBLIC_* | ✅ | ✅ |

## Problemas Comunes

| Problema | Solución |
|----------|----------|
| `npm ERESOLVE` | Usar `--legacy-peer-deps` |
| `zod/v4 not found` | Agregar `zod: "^3.25.64"` a package.json |
| `401 Unauthorized` | Verificar/regenerar PIPECAT_CLOUD_API_KEY |
| Bot no saluda | Verificar onBotConnected se ejecuta |

## Notas de Desarrollo

- El hook `usePipecatCloud` tiene un delay de 2.5s antes de enviar `conversation_id`
- El callback `onBotConnected` se usa en lugar de `onBotReady`
- Los campos de Pipecat Cloud son `dailyRoom` y `dailyToken` (no `room_url` y `token`)
