#!/bin/bash
# Wrapper the launchd job runs. Exists so the plist stays trivial and the real
# behaviour is here in the repo, under version control.
#
# launchd starts jobs with almost no environment: no nvm, no Homebrew, no PATH
# to speak of. Node has to be found explicitly or the job fails silently every
# morning, which is the classic way a scheduled task appears to be running and
# is not.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO="$PWD"
LOG_DIR="$HOME/Library/Logs/garden-planner"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/daily-infographics.log"

exec >>"$LOG" 2>&1
echo ""
echo "===== $(date '+%Y-%m-%d %H:%M:%S') ====="

# Find node the way an interactive shell would.
for candidate in \
  "$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1)/bin" \
  /opt/homebrew/bin \
  /usr/local/bin
do
  [ -x "$candidate/node" ] && export PATH="$candidate:$PATH" && break
done

if ! command -v node >/dev/null; then
  echo "FATAL: node not found on PATH"
  exit 1
fi
echo "node $(node --version) at $(command -v node)"

# Publish against the latest main. A rebase keeps the history linear if the
# repo was edited by hand since the last run.
git -C "$REPO" pull --rebase --autostash || echo "WARN: pull failed, continuing with local state"

node scripts/daily-infographics.mjs --count "${COUNT:-2}"
echo "exit: $?"
