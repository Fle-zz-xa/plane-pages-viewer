#!/usr/bin/env bash
# apply-rivetta.sh — past alle Rivetta-features toe op een schone plane-rivetta checkout
# Gebruik: bash apply-rivetta.sh [pad-naar-plane-rivetta]
# Voorbeeld: bash apply-rivetta.sh ~/plane-rivetta
set -euo pipefail

REPO="${1:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCH="$SCRIPT_DIR/rivetta-all.patch"

echo "=== Rivetta deploy script ==="
echo "Repo : $REPO"
echo "Patch: $PATCH"

# Checks
[[ -d "$REPO/.git" ]] || { echo "ERROR: $REPO is geen git repo"; exit 1; }
[[ -f "$PATCH" ]]     || { echo "ERROR: patch niet gevonden op $PATCH"; exit 1; }

cd "$REPO"

# Check dat we op de juiste basis zitten (v1.3.0)
BASE=$(git log --oneline | grep "release: v1.3.0" | head -1 | awk '{print $1}')
[[ -n "$BASE" ]] || { echo "WAARSCHUWING: v1.3.0 commit niet gevonden — patch mogelijk al toegepast of verkeerde repo"; }

# Maak branch aan of switch ernaar
BRANCH="rivetta-features"
if git rev-parse --verify "$BRANCH" &>/dev/null; then
  echo "Branch $BRANCH bestaat al — controleer of patches al zijn toegepast"
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
  echo "Branch $BRANCH aangemaakt"
fi

# Controleer of patch al is toegepast
if git log --oneline | grep -q "feat: Rivetta fase-tracking"; then
  echo "INFO: Rivetta commits lijken al aanwezig. Niets te doen."
  git log --oneline -5
  exit 0
fi

# Toepassen
echo ""
echo "Patch toepassen..."
git am --3way "$PATCH"

echo ""
echo "=== Succesvol toegepast! ==="
git log --oneline -5
echo ""
echo "Volgende stap:"
echo "  git push origin $BRANCH"
echo "  (en deploy vanuit deze branch op test.plane.rivetta.eu)"
