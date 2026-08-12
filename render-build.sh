#!/bin/sh
set -e
echo "=== Render Build Script ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "NODE_OPTIONS: $NODE_OPTIONS"
echo "PWD: $(pwd)"
echo "LS: $(ls -la)"
npm install
NODE_OPTIONS="--max-old-space-size=512" npx vite build
echo "=== Build Complete ==="
