FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables (placeholders for build)
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder
ARG NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=placeholder
ARG NEXT_PUBLIC_TUGUIA_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_TUGUIA_ANON_KEY=placeholder
ARG NEXT_PUBLIC_PIPECAT_URL=http://placeholder:7860
ARG PIPECAT_CHAT_URL=http://host.docker.internal:7861/api/chat
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=$NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_TUGUIA_URL=$NEXT_PUBLIC_TUGUIA_URL
ENV NEXT_PUBLIC_TUGUIA_ANON_KEY=$NEXT_PUBLIC_TUGUIA_ANON_KEY
ENV NEXT_PUBLIC_PIPECAT_URL=$NEXT_PUBLIC_PIPECAT_URL
ENV PIPECAT_CHAT_URL=$PIPECAT_CHAT_URL

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create cache directory with correct permissions
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
