import os
import subprocess
import re
from pathlib import Path

def clean_ansi_codes(text):
    # Remove ANSI escape codes
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

def run_picus_for_bug(bug_dir):
    # Get the absolute path to the project root directory
    project_root = Path(__file__).resolve().parents[2]
    
    # Get the absolute path to the circuit file
    circuit_path = Path(bug_dir) / "circuits" / "circuit.circom"
    
    # Ensure the circuit file exists
    if not circuit_path.exists():
        return None

    # Calculate the relative path from project root to the circuit file
    relative_circuit_path = circuit_path.relative_to(project_root)
    
    # Construct the path as it will appear inside the Docker container
    docker_circuit_path = f"/Picus/zkbugs/{relative_circuit_path}"
    container_name = f"picus_{os.path.basename(bug_dir)}"  # Unique container name based on bug directory

    cmd = [
        "docker", "run", "--rm", "--name", container_name,
        "-v", f"{project_root.absolute()}:/Picus/zkbugs/",
        "veridise/picus:v1.0.3",
        "./run-picus", docker_circuit_path
    ]

    print(f"Running Picus for: {bug_dir}")  # Debug print

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=100)
        output = result.stdout + result.stderr
        if result.returncode != 0:
            output = f"Warning: Picus exited with status {result.returncode}\n\n" + output
        # Attempt to remove the container explicitly, even though --rm should handle it
        subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)
        return clean_ansi_codes(output)  # Clean the output before returning
    except subprocess.TimeoutExpired:
        subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)
        return f"Error: Picus execution timed out after 100 seconds for {bug_dir}"
    except Exception as e:
        subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)
        return f"Error running Picus for {bug_dir}: {str(e)}"

def write_results_to_markdown(results):
    output_file = Path(__file__).resolve().parent / "picus_results.md"
    with open(output_file, "w") as f:
        f.write("# Picus Analysis Results\n\n")
        for bug_path, output in results.items():
            # Extract the relative path from the dataset directory for a cleaner title
            relative_bug_path = Path(bug_path).relative_to(Path(__file__).resolve().parents[2] / "dataset")
            f.write(f"## {relative_bug_path}\n\n")
            f.write("```\n")
            f.write(output + "\n")
            f.write("```\n\n")

def main():
    dataset_dir = Path(__file__).resolve().parents[2] / "dataset"
    results = {}

    for bug_dir in dataset_dir.rglob("*"):
        if bug_dir.is_dir():
            output = run_picus_for_bug(str(bug_dir))
            if output:
                # Store the full path as a string
                results[str(bug_dir)] = output

    write_results_to_markdown(results)
    print("Picus results have been written to picus_results.md in the tools/picus/ directory")

if __name__ == "__main__":
    main()
