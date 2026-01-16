# Sonora Frontend

> Interfaz de usuario para el Ecosistema Sonora - Chat de voz y texto con IA

## 🌐 Ecosistema Sonora

Este repositorio es parte del ecosistema Sonora:

| Repo | Descripción | Deploy |
|------|-------------|--------|
| **sonora-frontend** (este) | UI Next.js | Coolify |
| [sonora-test](https://github.com/Lifimastar/sonora-test) | Bot de voz Pipecat | Pipecat Cloud |
| sonora-chat | API de chat texto | Coolify |

---

## 🚀 Desarrollo Local

```bash
npm install
npm run dev
# Abre http://localhost:3001
```

### Variables de entorno (.env)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Pipecat Cloud
PIPECAT_CLOUD_API_KEY=pk_your_api_key_here
PIPECAT_AGENT_NAME=sonora-voice

# Chat API (localhost para local, host.docker.internal para prod)
PIPECAT_CHAT_URL=http://localhost:7861/api/chat

# OpenAI
OPENAI_API_KEY=...
```

---

## 📁 Estructura de Archivos Importantes

```
sonora-frontend/
├── app/
│   ├── home-test/              # Página principal del chat
│   │   ├── page.tsx            # Lógica de envío de mensajes
│   │   └── components/
│   │       ├── ChatControls.tsx # Input y botones
│   │       └── ChatArea.tsx     # Área de mensajes
│   └── api/
│       └── connect/route.ts    # Conecta con Pipecat Cloud
├── hooks/
│   └── usePipecatCloud.tsx     # Hook principal de conexión
└── .env                        # Variables de entorno
```

---

## ⚙️ Hooks Importantes

### `usePipecatCloud.tsx`

Hook que maneja la conexión a Pipecat Cloud via DailyTransport.

**Funciones disponibles:**

| Función | Descripción |
|---------|-------------|
| `connect(conversationId, userId)` | Inicia conexión |
| `disconnect()` | Termina llamada |
| `sendTextMessage(text)` | Envía texto por voz |
| `sendMultimodalMessage(text, imageUrls)` | Envía texto + imágenes |
| `sendFileMessage(text, content, fileName)` | Envía archivo de texto |

---

## 🔄 Deploy

Push a `main` → Coolify despliega automáticamente

```bash
git add .
git commit -m "feat: descripción"
git push origin main
```

---

## 🐛 Troubleshooting

### Error 401 en llamada
- Verificar `PIPECAT_CLOUD_API_KEY` en `.env`

### Chat no conecta
- Verificar `PIPECAT_CHAT_URL` es `localhost:7861` (no `host.docker.internal`)

### Botón enviar deshabilitado
- Verificar que `ChatControls.tsx` considera `selectedTextFile` en la condición
