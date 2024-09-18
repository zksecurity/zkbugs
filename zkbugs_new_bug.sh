#!/bin/bash

# List of supported DSLs
supported_dsls=("circom" "halo2" "gnark" "cairo" "leo")

# Function to check if a value is in an array
contains_element () {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

# Check if correct number of arguments is provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <dsl> <project> <bug_name>"
    exit 1
fi

dsl=$1
project=$2
bug_name=$3

# Check if DSL is supported
if ! contains_element "$dsl" "${supported_dsls[@]}"; then
    echo "Error: Unsupported DSL. Supported DSLs are: ${supported_dsls[*]}"
    exit 1
fi

# Check if project name is in the correct format
if [[ ! $project =~ ^[^_]+_[^_]+$ ]]; then
    echo "Error: Project name should be in the format <organizationname>_<repo>"
    exit 1
fi

# Check if bug name is in the correct format
if [[ ! $bug_name =~ ^[^_]+_[^_]+.*$ ]]; then
    echo "Error: Bug name should be in the format <bug-hunter>_<description>"
    exit 1
fi

# Create directories
base_dir="dataset/$dsl/$project/$bug_name"
mkdir -p "$base_dir/circuits"
echo "Created new bug directory: $base_dir"

# Copy template files
template_dir="template"
cp "$template_dir/circuits/circuit.circom" "$base_dir/circuits/"
cp $template_dir/*.sage $base_dir
cp $template_dir/*.json $base_dir
cp $template_dir/*.sh $base_dir
echo "Copied template files to $base_dir"

echo ""

# Print final message
echo "Setup complete. Next steps:"
echo "1. Update zkbugs_config.json"
echo "2. Add code inside circuits/circuit.circom"
echo "3. Call the implementation circuit from circuit.circom"
echo "4. Implement a sage script to output the exploit in detect.sage"
echo "5. Fill in input.json"
echo "6. Generate a valid witness first, then modify it to exploitable_witness.json"

echo ""

# Command to create README.md
echo "To create README.md, run the following command:"
echo "python3 scripts/generate_readme.py $base_dir"