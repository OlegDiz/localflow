#!/bin/bash

# Kill background processes when script exits
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

echo "🚀 Starting LocalFlow..."

# Check and Start Ollama
if command -v ollama &> /dev/null; then
  echo "🦙 Starting Ollama..."
  ollama serve > /dev/null 2>&1 &
  OLLAMA_PID=$!
else
  echo "⚠️  Ollama not found. Please start it manually if needed."
fi

# Check and Start LM Studio (assuming it's in PATH or standard location, or just a placeholder message as it's often an AppImage)
# Since LM Studio is usually a GUI AppImage, it's hard to auto-start headlessly. We'll try a common alias or skip.
# For now, let's assume if 'lm-studio' or 'lmstudio' exists we run it.
if command -v lm-studio &> /dev/null; then
  echo "🤖 Starting LM Studio..."
  lm-studio server start > /dev/null 2>&1 &
  LMSTUDIO_PID=$!
elif command -v lmstudio &> /dev/null; then
  echo "🤖 Starting LM Studio..."
  lmstudio server start > /dev/null 2>&1 &
  LMSTUDIO_PID=$!
else
 echo "ℹ️  LM Studio CLI not found. (If you use the GUI, start the server manually)."
fi

# Start Backend
echo "📦 Starting Backend Server (Port 8000)..."
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for services..."
sleep 2

# Start Frontend
echo "✨ Starting Frontend (Port 3000)..."
npm run dev &
FRONTEND_PID=$!

echo "✅ App is running!"
echo "➡️  Frontend: http://localhost:3000"
echo "➡️  Backend:  http://localhost:8000"
if [ ! -z "$OLLAMA_PID" ]; then echo "➡️  Ollama:   http://localhost:11434"; fi
echo ""
echo "Press CTRL+C to stop everything."

wait
