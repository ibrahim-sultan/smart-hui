#!/usr/bin/env bash
set -euo pipefail

echo "== Render build: installing server and client =="
node --version || true
npm --version || true

# Install server deps
cd server
npm ci

# Install client deps and build
cd ../client
npm ci
npm run build

echo "== Render build finished =="
