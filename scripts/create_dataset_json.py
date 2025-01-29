import argparse
import json
import os


def process_json_file(file_path):
    """Reads a zkbugs_config.json file and transforms its structure."""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Convert the key-value structure to a list of JSON entries with "title"
    result = []
    for key, value in data.items():
        if isinstance(value, dict):  # Ensure the value is a dictionary
            value["title"] = key
            result.append(value)

    return result


def collect_json_data(dataset_folder):
    """Recursively collects and processes all zkbugs_config.json files in the dataset folder."""
    results = []

    for root, _, files in os.walk(dataset_folder):
        if "zkbugs_config.json" in files:
            file_path = os.path.join(root, "zkbugs_config.json")
            results.extend(process_json_file(file_path))

    return results


def main():
    parser = argparse.ArgumentParser(description="Process zkbugs_config.json files recursively.")
    parser.add_argument("dataset", type=str, help="Path to the dataset folder.")
    parser.add_argument("output", type=str, help="Path to the output JSON file.")

    args = parser.parse_args()

    # Collect data
    data = collect_json_data(args.dataset)

    # Write to output file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"Processed {len(data)} entries. Output saved to {args.output}")


if __name__ == "__main__":
    main()
