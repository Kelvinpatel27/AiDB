#!/usr/bin/env bash
# start-frontend.sh — Quick start script for the frontend
set -e

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "Installing npm packages..."
  npm install
fi

echo "🎨 Starting AI DB Manager frontend on http://localhost:5173"
npm run dev
