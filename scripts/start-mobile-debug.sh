#!/bin/bash
# Launch Metro in experimental debugger mode, open Chrome tabs, and run the Android app without spawning another packager.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
METRO_PORT="${METRO_PORT:-8081}"
ANDROID_CMD="${ANDROID_CMD:-yarn --cwd apps/mobile android --no-packager}"
CHROME_APP="${CHROME_APP:-Google Chrome}"

function cleanup {
  if [[ -n "${METRO_PID:-}" ]]; then
    if ps -p "${METRO_PID}" > /dev/null 2>&1; then
      echo "\n🛑 Stopping Metro (PID ${METRO_PID})..."
      kill "${METRO_PID}" || true
      wait "${METRO_PID}" 2>/dev/null || true
    fi
  fi
}
trap cleanup EXIT

cd "${ROOT_DIR}"

echo "🔌 Ensuring port ${METRO_PORT} is free..."
if lsof -ti:"${METRO_PORT}" >/dev/null 2>&1; then
  lsof -ti:"${METRO_PORT}" | xargs kill -9
  sleep 1
fi

echo "🚀 Starting Metro (experimental debugger)..."
yarn --cwd apps/mobile start --experimental-debugger --port "${METRO_PORT}" &
METRO_PID=$!

# Wait for Metro to be reachable
ATTEMPTS=0
until curl -sf "http://localhost:${METRO_PORT}/status" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if (( ATTEMPTS >= 30 )); then
    echo "❌ Metro did not start within 30 seconds."
    exit 1
  fi
  sleep 1
done

echo "✅ Metro is up on port ${METRO_PORT}."

if command -v open >/dev/null 2>&1; then
  echo "🌐 Opening Chrome debugger tabs..."
  open -a "${CHROME_APP}" "http://localhost:${METRO_PORT}/debugger-ui" >/dev/null 2>&1 || true
  open -a "${CHROME_APP}" "chrome://inspect/#devices" >/dev/null 2>&1 || true
else
  echo "ℹ️  Please open http://localhost:${METRO_PORT}/debugger-ui and chrome://inspect/#devices manually."
fi

echo "📱 Installing Android app without starting another packager..."
# shellcheck disable=SC2086
${ANDROID_CMD}

echo "\n✅ Metro debugger is running (PID ${METRO_PID})."
echo "👉 Press 'j' in the Metro terminal or use the emulator dev menu to attach if needed."
echo "👉 When finished, press Ctrl+C here to stop Metro."

wait "${METRO_PID}"
