#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
SKIP_INSTALL=false
SKIP_BUILD=false
SERVER_PID=""

for arg in "$@"; do
	case "$arg" in
		--skip-install)
			SKIP_INSTALL=true
			;;
		--skip-build)
			SKIP_BUILD=true
			;;
		*)
			echo "Unknown argument: $arg"
			echo "Usage: ./run-app.sh [--skip-install] [--skip-build]"
			exit 1
			;;
	esac
done

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

echo "===== RUNNING BYTEQUEST (PRODUCTION MODE) ====="

if [[ "$SKIP_INSTALL" == false ]]; then
	echo "Installing server dependencies..."
	(cd "$SERVER_DIR" && npm install)

	echo "Installing client dependencies..."
	(cd "$CLIENT_DIR" && npm install)
else
	echo "Skipping dependency install (--skip-install)."
fi

if [[ "$SKIP_BUILD" == false ]]; then
	echo "Building server..."
	(cd "$SERVER_DIR" && npm run build)

	echo "Building client..."
	(cd "$CLIENT_DIR" && npm run build)
else
	echo "Skipping build steps (--skip-build)."
fi

echo "Starting server in production mode..."
(cd "$SERVER_DIR" && npm run start:prod) &
SERVER_PID=$!

echo "Starting client preview server..."
cd "$CLIENT_DIR"
npm run preview -- --host 0.0.0.0 --port 5173