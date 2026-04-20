#!/bin/bash
set -euo pipefail

# Update the zkbugs-website public dataset from this repo.
#
# Usage: scripts/update_zkbugs_website.sh <path-to-zkbugs-website>

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path-to-zkbugs-website>" >&2
    exit 1
fi

SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")
WEBSITE_DIR=$(realpath "$1")

if [ ! -d "$WEBSITE_DIR" ]; then
    echo "Error: $WEBSITE_DIR does not exist" >&2
    exit 1
fi

DATASET_OUT="$WEBSITE_DIR/public/dataset"
REPORTS_OUT="$DATASET_OUT/reports"

mkdir -p "$REPORTS_OUT"

cd "$ROOT_DIR"

python3 scripts/create_dataset_json.py dataset/ "$DATASET_OUT/bugs.json"

cp reports/reports.json "$DATASET_OUT/reports.json"

cp reports/documents/*.pdf "$REPORTS_OUT/"

echo "Updated $DATASET_OUT"
