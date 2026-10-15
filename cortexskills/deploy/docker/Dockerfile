# CortexSkills — runtime image (Linux, amd64 or arm64).
# Contents: Node.js 22 runtime, the application server, the built web client and the vendor public key that
# verifies licence files. No licence, no secret, no data and no build tool are part of the image: the licence file,
# the settings (.env) and the database live outside the image, in the data volume and the compose files.
#
# Build (in the folder of this file):   docker build -t cortexskills:1.15.0 .
# Run: see docker-compose.yml and INSTALL.txt.

ARG BASE_IMAGE=node:22-bookworm-slim
FROM ${BASE_IMAGE}

ENV NODE_ENV=production \
    DEPLOYMENT_MODE=onprem \
    PORT=4000 \
    DATA_DIR=/data \
    TRUST_PROXY=uniquelocal \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app/server

# Server dependencies first (cached layer), production dependencies only.
COPY app/server/package.json app/server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Application: server and built web client.
COPY app/server/ ./
COPY app/web/dist/ /app/web/dist/

# Vendor public key (verification only — the private key never leaves the vendor). Fixed, read-only location.
COPY vendor-public.pem /app/server/tools/keys/vendor-public.pem
COPY entrypoint.sh /usr/local/bin/cortexskills-start
COPY cortexskills-admin /usr/local/bin/cortexskills-admin

RUN set -eu; \
    rm -f tools/sign-licence.js tools/keys/vendor-private.pem .env; \
    rm -rf test data; \
    grep -q "BEGIN PUBLIC KEY" tools/keys/vendor-public.pem || { echo "vendor-public.pem is not a public key"; exit 1; }; \
    node i18n/build.js >/dev/null; \
    chmod 0755 /usr/local/bin/cortexskills-start /usr/local/bin/cortexskills-admin; \
    chown -R root:root /app; chmod -R a-w /app; \
    mkdir -p /data && chown node:node /data

USER node
VOLUME ["/data"]
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["cortexskills-start"]
