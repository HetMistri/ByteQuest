#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
SKIP_INSTALL=false
SERVER_PID=""

if [[ "${1:-}" == "--skip-install" ]]; then
	SKIP_INSTALL=true
fi

cleanup() {
	if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
		echo "Stopping server (PID: $SERVER_PID)..."
		kill "$SERVER_PID" 2>/dev/null || true
	fi
}

trap cleanup EXIT INT TERM

if ! command -v npm >/dev/null 2>&1; then
	echo "Error: npm is not installed or not in PATH."
	exit 1
fi

echo "===== RUNNING BYTEQUEST (DEV MODE) ====="

if [[ "$SKIP_INSTALL" == false ]]; then
	echo "Installing server dependencies..."
	(cd "$SERVER_DIR" && npm install)

	echo "Installing client dependencies..."
	(cd "$CLIENT_DIR" && npm install)
else
	echo "Skipping dependency install (--skip-install)."
fi

echo "Starting server in watch mode..."
(cd "$SERVER_DIR" && npm run start:dev) &
SERVER_PID=$!

echo "Starting client dev server..."
cd "$CLIENT_DIR"
npm run dev
