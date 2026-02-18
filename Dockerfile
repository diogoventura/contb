# Build stage
FROM node:18-slim AS builder

WORKDIR /build

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Frontend deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Backend build
COPY backend/ ./backend/
RUN cd backend && npx prisma generate && npx tsc

# Frontend build
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Production stage
FROM node:18-slim

RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /build/backend/dist ./dist
COPY --from=builder /build/backend/node_modules ./node_modules
COPY --from=builder /build/backend/prisma ./prisma
COPY --from=builder /build/backend/package.json ./
COPY --from=builder /build/frontend/dist ./public

RUN npx prisma generate

RUN mkdir -p /app/data && chmod -R 777 /app/data

EXPOSE 3002

CMD ["node", "dist/index.js"]
