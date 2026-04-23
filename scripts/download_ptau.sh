#!/bin/bash
set -uo pipefail

# Download/generate all ptau files needed for circom bug testing.
#
# Usage: scripts/download_ptau.sh [--small-only]
#
# --small-only  Only generate pot12/14/16 (skip large Hermez downloads)

SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")
PTAU_DIR="$ROOT_DIR/misc/circom"

SMALL_ONLY=false
[ "${1:-}" = "--small-only" ] && SMALL_ONLY=true

mkdir -p "$PTAU_DIR"

if ! command -v snarkjs &> /dev/null; then
    echo "snarkjs is not installed. Please run: npm install -g snarkjs"
    exit 1
fi

echo "=== Generating small ptau files (pot12, pot14, pot16) ==="

for size in 12 14 16; do
    PTAU_FILE="$PTAU_DIR/bn128_pot${size}_0001.ptau"
    if [ -f "$PTAU_FILE" ]; then
        echo "  pot${size}: already exists"
        continue
    fi
    echo -n "  pot${size}: generating... "
    PTAU_INIT="$PTAU_DIR/bn128_pot${size}_0000.ptau"
    snarkjs powersoftau new bn128 "$size" "$PTAU_INIT" -v 2>&1 > /dev/null
    echo "zkbugs" | snarkjs powersoftau contribute "$PTAU_INIT" "$PTAU_FILE" --name="zkbugs" -v 2>&1 > /dev/null
    echo "done"
done

if $SMALL_ONLY; then
    echo ""
    echo "=== Done (small only) ==="
    echo "For full test coverage, also download large ptau files:"
    echo "  ./scripts/download_ptau.sh"
    exit 0
fi

echo ""
echo "=== Downloading large ptau files from Hermez ceremony ==="

for size in 18 20 22; do
    PTAU_FILE="$PTAU_DIR/powersOfTau28_hez_final_${size}.ptau"
    if [ -f "$PTAU_FILE" ]; then
        echo "  pot${size}: already exists"
        continue
    fi
    echo "  pot${size}: downloading from Hermez ceremony..."
    curl -L -o "$PTAU_FILE" \
        "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_${size}.ptau"
    echo "  pot${size}: done"
done

echo ""
echo "=== Done ==="
echo "All ptau files are in $PTAU_DIR"
