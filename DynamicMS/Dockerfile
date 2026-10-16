# DynamicMS — production image (editor side and customer side use the same image; the
# docker-compose file of each side sets its mode). Build from the DynamicMS folder:
#   docker build -t dynamicms:2026.10 .
# NODE_IMAGE can point to a registry mirror (for example mirror.gcr.io/library/node:22-bookworm-slim).
ARG NODE_IMAGE=node:22-bookworm-slim

# ---- 1. Web client (React, built once into static files)
FROM ${NODE_IMAGE} AS web
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

# ---- 2. Server dependencies (production only)
FROM ${NODE_IMAGE} AS deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- 3. Runtime
FROM ${NODE_IMAGE}
ENV NODE_ENV=production \
    APP_MODE=production \
    PORT=4000 \
    DB_FILE=/data/db/dynamicms.db \
    STORAGE_DIR=/data/storage \
    BACKUP_DIR=/data/backups \
    LICENCE_FILE=/data/licence/licence.lic
WORKDIR /app
COPY --from=deps /app/server/node_modules server/node_modules
COPY server/package.json server/
COPY server/src server/src
COPY server/seed server/seed
# Validation rules shared by the server and the web client.
COPY web/package.json web/package.json
COPY web/src/lib/multientry.js web/src/lib/multientry.js
COPY --from=web /app/web/dist web/dist
RUN mkdir -p /data/db /data/storage /data/backups /data/licence && chown -R node:node /data
USER node
VOLUME ["/data"]
EXPOSE 4000
# The first start of a seeded database takes about a minute.
HEALTHCHECK --interval=30s --timeout=5s --start-period=240s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
WORKDIR /app/server
CMD ["node", "--disable-warning=ExperimentalWarning", "src/index.js"]
