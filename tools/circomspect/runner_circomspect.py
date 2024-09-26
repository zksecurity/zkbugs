import os
import json
import subprocess
import argparse
import re

def run_circomspect(circuit_path):
    result = subprocess.run(['circomspect', circuit_path], capture_output=True, text=True)
    return result.stdout + result.stderr

def find_file(directory, filename):
    for root, dirs, files in os.walk(directory):
        if filename in files:
            return os.path.join(root, filename)
    return None

def process_directory(dir_path, md_file, verbose):
    found_files = False
    for root, dirs, files in os.walk(dir_path):
        config_file = next((f for f in files if f == 'zkbugs_config.json'), None)
        circuits_dir = os.path.join(root, 'circuits')
        
        if config_file and os.path.isdir(circuits_dir):
            found_files = True
            relative_path = os.path.relpath(root, dir_path)
            md_file.write(f"## {relative_path}\n\n")

            # Read the zkbugs_config.json file
            config_path = os.path.join(root, config_file)
            print(f"Debug: Processing config file at {config_path}")
            
            try:
                with open(config_path, 'r') as config_file:
                    config = json.load(config_file)
                    for key in config:
                        short_description = config[key].get('Short Description of the Vulnerability', 'No description available')
                        md_file.write(f"### Short Description of the Vulnerability\n\n{short_description}\n\n")
                        break  # Assuming there's only one key in the config
            except Exception as e:
                print(f"Error reading config file {config_path}: {str(e)}")

            # Process circuit.circom to find include statements
            circuit_path = os.path.join(circuits_dir, 'circuit.circom')
            if os.path.exists(circuit_path):
                print(f"Debug: Processing circuit file at {circuit_path}")
                
                # Read circuit.circom and find include statements
                with open(circuit_path, 'r') as circuit_file:
                    circuit_content = circuit_file.read()
                    include_statements = re.findall(r'include\s*"(.+?)"', circuit_content)
                
                # Process included files
                for include in include_statements:
                    included_file = os.path.basename(include)
                    included_path = find_file(circuits_dir, included_file)
                    if included_path:
                        print(f"Debug: Processing included file at {included_path}")
                        circomspect_output = run_circomspect(included_path)
                        md_file.write(f"### Circomspect Output for {included_file}\n\n```\n")
                        md_file.write(circomspect_output)
                        md_file.write("```\n\n")
                        
                        if verbose:
                            print(f"Circomspect output for {os.path.join(relative_path, 'circuits', included_file)}:")
                            print(circomspect_output)
                            print("-" * 80)
                        else:
                            print(f"Circomspect for {os.path.join(relative_path, 'circuits', included_file)} done. Output was saved to circomspect_results.md")
                    else:
                        print(f"Warning: Included file {included_file} not found in {circuits_dir}")

    if not found_files:
        error_msg = f"No circuit.circom or zkbugs_config.json found in {dir_path}"
        md_file.write(f"## Error\n\n{error_msg}\n\n")
        print(error_msg)

def main(verbose):
    # Get the path to the root directory (three levels up from tools/circomspect/)
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Create a markdown file in the current working directory
    output_file = os.path.join(os.getcwd(), 'circomspect_results.md')
    
    with open(output_file, 'w') as md_file:
        md_file.write("# Circomspect Analysis Results\n\n")

        # Process the dataset directory
        dataset_dir = os.path.join(root_dir, 'dataset')
        process_directory(dataset_dir, md_file, verbose)

    print(f"Analysis complete. Results written to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Circomspect on ZK bug dataset")
    parser.add_argument("-v", "--verbose", action="store_true", help="Print Circomspect output to console")
    args = parser.parse_args()

    main(args.verbose)
