#!/bin/bash

# Creator Mode Development Launcher
echo "🚀 Starting Creator Mode Development Environment..."

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -9 -f "nest|node.*apps/backend" || true
pkill -9 -f "electron" || true

# Start backend
echo "🔧 Starting backend server..."
cd /Users/onalime/CreatorMode/apps/backend
POLICY_PATH=/Users/onalime/CreatorMode/policy/policy.json PORT=3001 npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start desktop app
echo "🖥️  Starting desktop app..."
cd /Users/onalime/CreatorMode/apps/desktop
npm run dev &
DESKTOP_PID=$!

echo "✅ Creator Mode Development Environment started!"
echo "   Backend: http://localhost:3001"
echo "   Desktop: Running in Electron"
echo ""
echo "Press Ctrl+C to stop both processes"

# Wait for user to stop
wait
