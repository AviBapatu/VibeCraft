#!/usr/bin/env bash

set -e

ROOT_DIR=$(pwd)
PORTS=(4000 5000 5173 5174)

echo "======================================"
echo "🧹 Cleaning up existing processes"
echo "======================================"

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti tcp:$PORT || true)
  if [ -n "$PID" ]; then
    echo "⚠️  Killing PID(s) on port $PORT: $PID"
    kill -9 $PID
  else
    echo "✅ Port $PORT is free"
  fi
done

sleep 1

echo ""
echo "======================================"
echo "🚀 Launching system in 4 terminals"
echo "======================================"

# ---------------- ATTACK BACKEND ----------------
gnome-terminal --title="🧨 Attack Backend (4000)" -- bash -c "
cd $ROOT_DIR/attack-backend || exit;
npm install;
npm start;
exec bash
"

sleep 1

# ---------------- MONITORING BACKEND ----------------
gnome-terminal --title="🧠 Monitoring Backend (5000)" -- bash -c "
cd $ROOT_DIR/monitoring-backend || exit;

if [ ! -d venv ]; then
  python3 -m venv venv;
fi

source venv/bin/activate;
pip install --upgrade pip;
pip install -r requirements.txt;

uvicorn main:app --host 0.0.0.0 --port 5000 --reload;
exec bash
"

sleep 1

# ---------------- MONITORING UI ----------------
gnome-terminal --title="📊 Monitoring UI (5173)" -- bash -c "
cd $ROOT_DIR/monitoring-ui || exit;
npm install;
npm run dev -- --port 5173 --host 0.0.0.0;
exec bash
"

sleep 1

# ---------------- SIMULATOR UI ----------------
gnome-terminal --title="🧪 Simulator UI (5174)" -- bash -c "
cd $ROOT_DIR/simulator-ui || exit;
npm install;
npm run dev -- --port 5174 --host 0.0.0.0;
exec bash
"

echo ""
echo "======================================"
echo "✅ SYSTEM STARTED SUCCESSFULLY"
echo "======================================"
echo ""
echo "🧪 Simulator UI   → http://localhost:5174"
echo "📊 Monitoring UI  → http://localhost:5173"
echo "🧠 Monitoring API → http://localhost:5000/health"
echo "🧨 Attack Backend → http://localhost:4000"
echo ""
echo "If anything fails, the terminal will show it."
echo "======================================"
