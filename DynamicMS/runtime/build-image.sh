#!/usr/bin/env bash
# Builds the protected runtime image of one edition and exports it as a compressed archive.
#   ./build-image.sh customer|editor [NODE_IMAGE]
# Output: dist/Docker_Runtime_<Edition>_Linux_DynamicMS_2026.10_Image.tar.gz and its SHA-256.
set -euo pipefail
EDITION="${1:?customer or editor}"
NODE_IMAGE="${2:-node:22-bookworm-slim}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TAG="dynamicms-${EDITION}:2026.10"
NAME="Docker_Runtime_${EDITION^}_Linux_DynamicMS_2026.10_Image"
cd "$HERE"
node build.mjs "$EDITION"
cp Dockerfile.runtime boot.cjs "out/$EDITION/"
docker build --build-arg EDITION="$EDITION" --build-arg NODE_IMAGE="$NODE_IMAGE" ${DOCKER_BUILD_EXTRA:-} -f "out/$EDITION/Dockerfile.runtime" -t "$TAG" "out/$EDITION"
mkdir -p dist
docker save "$TAG" | gzip -9 > "dist/$NAME.tar.gz"
( cd dist && sha256sum "$NAME.tar.gz" > "$NAME.tar.gz.sha256" )
echo "Image $TAG -> runtime/dist/$NAME.tar.gz"
