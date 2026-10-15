# CortexSkills @VERSION@ — image d'exécution (Linux x86-64 ou arm64).
# Contenu : Node.js 22, l'exécutable CortexSkills (code minifié, sans source), l'interface web compilée et la clé
# publique de l'éditeur (elle vérifie la licence, elle ne peut pas en créer). Pas de licence, de secret ni de données :
# ils restent hors de l'image (fichier .env, dossier licence/, volume de données).
#   docker compose build      (voir LISEZMOI.txt et le Guide d'installation)
ARG BASE_IMAGE=node:22-bookworm-slim
FROM ${BASE_IMAGE}

ENV NODE_ENV=production \
    DEPLOYMENT_MODE=onprem \
    COMMERCIAL_INFO=@COMMERCIAL@ \
    PORT=4000 \
    DATA_DIR=/data \
    TRUST_PROXY=uniquelocal \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app/server
COPY runtime/server/package.json runtime/server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY runtime/server/ ./
COPY runtime/web/dist/ /app/web/dist/
COPY vendor-public.pem /app/server/tools/keys/vendor-public.pem
COPY docker/entrypoint.sh /usr/local/bin/cortexskills-start
COPY docker/cortexskills-admin /usr/local/bin/cortexskills-admin
RUN set -eu; \
    grep -q "BEGIN PUBLIC KEY" tools/keys/vendor-public.pem || { echo "vendor-public.pem n'est pas une clé publique"; exit 1; }; \
    chmod 0755 /usr/local/bin/cortexskills-start /usr/local/bin/cortexskills-admin; \
    chown -R root:root /app; chmod -R a-w /app; mkdir -p /data && chown node:node /data

USER node
VOLUME ["/data"]
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["cortexskills-start"]
