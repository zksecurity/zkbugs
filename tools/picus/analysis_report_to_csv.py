import re
import csv
from pathlib import Path

def parse_markdown_to_csv(md_path, csv_path):
    try:
        with open(md_path, 'r', encoding='utf-8') as md_file:
            content = md_file.read()
            print("Debug: Markdown file read successfully.")
    except Exception as e:
        print(f"Error reading markdown file: {e}")
        return

    try:
        with open(csv_path, 'w', newline='', encoding='utf-8') as csv_file:
            csv_writer = csv.writer(csv_file)
            csv_writer.writerow(["bug title", "success", "evaluation"])
            print("Debug: CSV headers written successfully.")
            
            # Regex to extract sections and their contents
            sections = re.findall(r'### (.+?)\n\n(.*?)(?=\n#|\n###|$)', content, re.DOTALL)
            success_map = {
                "Category 1. Successfully Detected the Vulnerability": ("Yes", "Picus found a bug and the bug is the same as the actual bug"),
                "Category 2. Unsupported Vulnerability": ("No", "The bug is not underconstrained bug so Picus does not support it"),
                "Category 3. Timeout": ("No", "Picus does not halt after running for 100 seconds and it hits timeout limit"),
                "Category 4. Incorrectly Reported as Properly Constrained": ("No", "Picus outputs 'The circuit is properly constrained' but the circuit contains a bug"),
                "Category 5. Failure": ("No", "Picus outputs 'Cannot determine whether the circuit is properly constrained'")
            }

            for section_title, section_content in sections:
                success, evaluation = success_map.get(section_title, ("Unknown", "Unknown"))
                # Extract bug entries from the section content
                bug_entries = re.findall(r'\d+\.\s+(circom/.+)', section_content)
                for bug_title in bug_entries:
                    csv_writer.writerow([bug_title.strip(), success, evaluation])
                    print(f"Debug: Written entry - {bug_title.strip()}, {success}, {evaluation}")

    except Exception as e:
        print(f"Error writing to CSV file: {e}")

def main():
    md_path = Path(__file__).resolve().parent / "picus_analysis.md"
    csv_path = Path(__file__).resolve().parent / "picus_analysis.csv"
    parse_markdown_to_csv(md_path, csv_path)
    print("CSV file has been created successfully.")

if __name__ == "__main__":
    main()
