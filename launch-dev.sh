#!/bin/bash

# Unscroller Development Launcher
echo "🚀 Starting Unscroller Development Environment..."

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -9 -f "nest|node.*apps/backend" || true
pkill -9 -f "electron" || true

# Start backend
echo "🔧 Starting backend server..."
cd /Users/onalime/Unscroller/apps/backend
POLICY_PATH=/Users/onalime/Unscroller/policy/policy.json PORT=3001 npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start desktop app
echo "🖥️  Starting desktop app..."
cd /Users/onalime/Unscroller/apps/desktop
npm run dev &
DESKTOP_PID=$!

echo "✅ Unscroller Development Environment started!"
echo "   Backend: http://localhost:3001"
echo "   Desktop: Running in Electron"
echo ""
echo "Press Ctrl+C to stop both processes"

# Wait for user to stop
wait
