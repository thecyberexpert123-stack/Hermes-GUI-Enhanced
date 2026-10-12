#!/usr/bin/env bash
# ==============================================================================
# HERMES AGENT OS — SERVICES CONTROLLER & DAEMON MANAGER
# Autonomous manager for Next.js Studio (3001), God's Eye Cesium (4173),
# and Hermes Gateway Daemon in WSL2 Kali Linux.
# ==============================================================================

STUDIO_DIR="/home/thecyberexpert/.gemini/antigravity/scratch/studio"
GODSEYE_DIR="/home/thecyberexpert/gods-eye-view"
HERMES_DIR="/home/thecyberexpert/.hermes"
RUN_DIR="${HERMES_DIR}/run"
mkdir -p "${RUN_DIR}"

STUDIO_PID_FILE="${RUN_DIR}/studio.pid"
GODSEYE_PID_FILE="${RUN_DIR}/godseye.pid"
GATEWAY_PID_FILE="${HERMES_DIR}/gateway.pid"

is_port_listening() {
  local port="$1"
  curl -s --max-time 1 -o /dev/null "http://localhost:${port}/" 2>/dev/null
}

start_studio() {
  if is_port_listening 3001; then
    echo "[ONLINE] Next.js Studio is already running on http://localhost:3001"
  else
    echo "[*] Starting Next.js Studio on port 3001..."
    cd "${STUDIO_DIR}"
    if [ -d ".next" ]; then
      PORT=3001 nohup npx next start -p 3001 > "${RUN_DIR}/studio.log" 2>&1 &
    else
      PORT=3001 nohup npm run dev > "${RUN_DIR}/studio.log" 2>&1 &
    fi
    local pid=$!
    disown "${pid}" 2>/dev/null || true
    echo "${pid}" > "${STUDIO_PID_FILE}"
    echo "[+] Next.js Studio started (PID: ${pid})"
  fi
}

start_godseye() {
  if is_port_listening 4173; then
    echo "[ONLINE] God's Eye Cesium Viewer is already running on http://localhost:4173"
  else
    echo "[*] Starting God's Eye Cesium Viewer on port 4173..."
    if [ -d "${GODSEYE_DIR}" ]; then
      cd "${GODSEYE_DIR}"
      nohup npm run dev > "${RUN_DIR}/godseye.log" 2>&1 &
      local pid=$!
      disown "${pid}" 2>/dev/null || true
      echo "${pid}" > "${GODSEYE_PID_FILE}"
      echo "[+] God's Eye Cesium started (PID: ${pid})"
    else
      echo "[-] Warning: God's Eye directory not found at ${GODSEYE_DIR}"
    fi
  fi
}

start_gateway() {
  local gw_running=false
  if [ -f "${GATEWAY_PID_FILE}" ]; then
    local pid=$(grep -o '"pid":\s*[0-9]*' "${GATEWAY_PID_FILE}" | grep -o '[0-9]*' || true)
    if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
      gw_running=true
      echo "[ONLINE] Hermes Gateway Daemon is running (PID: ${pid})"
    fi
  fi

  if [ "${gw_running}" = false ]; then
    local pgrep_pid=$(pgrep -f "hermes_cli.*gateway run" | head -n 1 || true)
    if [ -n "${pgrep_pid}" ]; then
      echo "[ONLINE] Hermes Gateway Daemon active via pgrep (PID: ${pgrep_pid})"
      gw_running=true
    fi
  fi

  if [ "${gw_running}" = false ]; then
    echo "[*] Starting Hermes Gateway Daemon..."
    local pyBin="${HERMES_DIR}/tools/python-3.14.7+20260901-linux-x64/bin/python3"
    local cliBin="${HERMES_DIR}/hermes-agent/hermes_cli/main.py"
    if [ -x "${pyBin}" ] && [ -f "${cliBin}" ]; then
      cd "${HERMES_DIR}"
      nohup "${pyBin}" "${cliBin}" gateway run > "${RUN_DIR}/gateway.log" 2>&1 &
      local pid=$!
      disown "${pid}" 2>/dev/null || true
      echo "[+] Hermes Gateway Daemon initiated."
    else
      echo "[-] Warning: Sandboxed Python or Hermes CLI not found."
    fi
  fi
}

wait_ready() {
  local timeout=${1:-30}
  local elapsed=0
  echo "[*] Waiting for services to become responsive (timeout: ${timeout}s)..."
  while [ ${elapsed} -lt ${timeout} ]; do
    if is_port_listening 3001 && is_port_listening 4173; then
      echo "[+] All services are ready! Studio: http://localhost:3001 | God's Eye: http://localhost:4173"
      # Trigger deep auto-setup
      curl -s -X POST http://localhost:3001/api/system/auto-setup >/dev/null 2>&1 || true
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  echo "[-] Warning: Timeout waiting for all services, continuing anyway..."
}

stop_all() {
  echo "[*] Stopping Hermes Agent OS services..."
  if [ -f "${STUDIO_PID_FILE}" ]; then
    local spid=$(cat "${STUDIO_PID_FILE}" 2>/dev/null || true)
    if [ -n "${spid}" ]; then kill "${spid}" 2>/dev/null || true; fi
    rm -f "${STUDIO_PID_FILE}"
  fi
  fuser -k 3001/tcp 2>/dev/null || true

  if [ -f "${GODSEYE_PID_FILE}" ]; then
    local gpid=$(cat "${GODSEYE_PID_FILE}" 2>/dev/null || true)
    if [ -n "${gpid}" ]; then kill "${gpid}" 2>/dev/null || true; fi
    rm -f "${GODSEYE_PID_FILE}"
  fi
  fuser -k 4173/tcp 2>/dev/null || true

  echo "[+] Services stopped successfully."
}

status_all() {
  echo "=== HERMES AGENT OS SERVICES STATUS ==="
  echo "Studio (port 3001):    $(is_port_listening 3001 && echo "ONLINE (http://localhost:3001)" || echo "OFFLINE")"
  echo "God's Eye (port 4173):  $(is_port_listening 4173 && echo "ONLINE (http://localhost:4173)" || echo "OFFLINE")"
  local gw_status="OFFLINE"
  local pgrep_pid=$(pgrep -f "hermes_cli.*gateway run" | head -n 1 || true)
  if [ -n "${pgrep_pid}" ]; then gw_status="ONLINE (PID: ${pgrep_pid})"; fi
  echo "Hermes Gateway Daemon:  ${gw_status}"
  echo "======================================="
}

case "$1" in
  start)
    start_gateway
    start_godseye
    start_studio
    wait_ready 20
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    sleep 1
    start_gateway
    start_godseye
    start_studio
    wait_ready 20
    ;;
  status)
    status_all
    ;;
  wait)
    wait_ready "${2:-30}"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|wait}"
    exit 1
    ;;
esac
