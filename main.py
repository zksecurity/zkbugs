import argparse
import os
import subprocess
import json
from pathlib import Path
import random
import string

# Example commands:
# python3 main.py single circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards --verbose
# python3 main.py dsl circom
# python main.py all

def run_command(command, verbose=False, cwd=None):
    result = subprocess.run(command, shell=True, capture_output=not verbose, text=True, cwd=cwd)
    if verbose:
        print(result.stdout)
        print(result.stderr)
    return result.returncode == 0

def get_bug_paths(dataset_dir):
    bug_paths = []
    for root, dirs, files in os.walk(dataset_dir):
        if 'zkbugs_config.json' in files:
            bug_paths.append(root)
    return bug_paths

def install_dependencies(bug_path, verbose):
    print(f"Installing dependencies for {os.path.basename(bug_path)}...")
    return run_command("npm install ffjavascript", verbose, cwd=bug_path)

def generate_random_string(length=10):
    """Generate a random string of fixed length"""
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

def reproduce_bug(bug_path, verbose):
    exploit_script = 'zkbugs_exploit.sh'
    if not os.path.exists(os.path.join(bug_path, exploit_script)):
        print(f"Error: {exploit_script} not found in {bug_path}")
        return False

    if not install_dependencies(bug_path, verbose):
        print(f"Failed to install dependencies for {os.path.basename(bug_path)}")
        return False

    if not verbose:
        print(f"Reproducing bug {os.path.basename(bug_path)}")
    
    # Generate a random string for entropy
    random_entropy = generate_random_string()
    
    # Use 'echo' to provide the random string as input
    command = f"echo '{random_entropy}' | bash {exploit_script}"
    return run_command(command, verbose, cwd=bug_path)

def main():
    parser = argparse.ArgumentParser(description="ZKBugs Reproduction Tool")
    parser.add_argument("mode", choices=["single", "dsl", "all"], help="Mode of operation")
    parser.add_argument("input", nargs="?", help="Bug ID or DSL input")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    args = parser.parse_args()

    dataset_dir = "dataset"
    bug_paths = get_bug_paths(dataset_dir)

    if args.mode == "single":
        if not args.input:
            print("Error: Bug ID is required for single mode")
            return
        print(f"Input: Bug ID {args.input}")
        target_bugs = [path for path in bug_paths if args.input in path]
        if len(target_bugs) == 0:
            print(f"Error: No bug found with ID {args.input}")
            return
        if len(target_bugs) > 1:
            print(f"Error: Multiple bugs found with ID {args.input}. Please provide a more specific ID.")
            for bug in target_bugs:
                print(f"- {bug}")
            return
    elif args.mode == "dsl":
        valid_dsl_inputs = ["circom", "gnark", "halo2", "cairo", "leo"]
        if not args.input or args.input not in valid_dsl_inputs:
            print(f"Error: DSL input must be one of {', '.join(valid_dsl_inputs)}")
            return
        print(f"Input: DSL {args.input}")
        dsl_path = os.path.join(dataset_dir, args.input)
        target_bugs = [path for path in bug_paths if path.startswith(dsl_path)]
    elif args.mode == "all":
        print("Input: All bugs")
        target_bugs = bug_paths
    else:
        print("Error: Invalid mode")
        return

    print("Bugs to reproduce:")
    for bug in target_bugs:
        print(f"- {bug}")

    successful_reproductions = 0
    for bug in target_bugs:
        if reproduce_bug(bug, args.verbose):
            successful_reproductions += 1

    print(f"\nSuccessfully reproduced {successful_reproductions} out of {len(target_bugs)} bugs")

if __name__ == "__main__":
    main()
