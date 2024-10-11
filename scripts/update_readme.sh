#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

for path in $(find "$SCRIPT_DIR/../dataset" -type f -name 'zkbugs_config.json' -exec dirname {} \; | sort -u); do
    python3 "$SCRIPT_DIR/generate_readme.py" "$path"
done
