#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <env> <email>"
  echo "  env: dev | preview | prod"
  exit 1
fi

ENV="$1"
case "$ENV" in
  dev)     ENV_FILENAME=".env.local" ;;
  preview) ENV_FILENAME=".env.preview" ;;
  prod)    ENV_FILENAME=".env.prod" ;;
  *)
    echo "Error: unknown env '$ENV'. Use dev, preview, or prod."
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../apps/mockingbird/$ENV_FILENAME"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

SEED_ADMIN_EMAIL="$2" DATABASE_URL="$DATABASE_URL" nx run mockingbird:prisma-seed
