#!/usr/bin/env bash
# start-backend.sh — Quick start script for the backend
set -e

cd "$(dirname "$0")/backend"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
pip install -r requirements.txt -q

# Load .env if it exists
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Starting AI DB Manager backend on http://localhost:8000"
echo "📖 API docs: http://localhost:8000/docs"
uvicorn main:app --reload --port 8000
