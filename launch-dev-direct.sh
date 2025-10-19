#!/bin/bash

# Creator Mode Development Launcher - Direct Version
echo "🚀 Starting Creator Mode Development Environment..."

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -9 -f "nest|node.*apps/backend" || true
pkill -9 -f "electron" || true

# Start backend in background
echo "🔧 Starting backend server..."
cd /Users/onalime/CreatorMode/apps/backend
POLICY_PATH=/Users/onalime/CreatorMode/policy/policy.json PORT=3001 npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Start desktop app in foreground (this will keep the window open)
echo "🖥️  Starting desktop app..."
cd /Users/onalime/CreatorMode/apps/desktop
npm run dev
