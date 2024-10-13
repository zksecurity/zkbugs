import re
import csv

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
            
            # Revised regex pattern to match the markdown structure
            bug_entries = re.findall(
                r'###\s+(.+?)\n- \*\*Short Description of the Vulnerability\*\*:\s+(.+?)\n- \*\*Circomspect Output\*\*:\s+(.+?)\n- \*\*Success\*\*:\s+(Yes|No|No, but expected)\n- \*\*Evaluation\*\*:\s+(.+?)\n',
                content, re.DOTALL
            )
            
            if bug_entries:
                print(f"Debug: Found {len(bug_entries)} bug entries.")
                for entry in bug_entries:
                    bug_title = entry[0].strip()
                    success = entry[3].strip()
                    evaluation = entry[4].strip()
                    csv_writer.writerow([bug_title, success, evaluation])
                    print(f"Debug: Written entry - {bug_title}, {success}, {evaluation}")
            else:
                print("Debug: No bug entries found. Check regex and markdown structure.")
    except Exception as e:
        print(f"Error writing to CSV file: {e}")

def main():
    md_path = 'circomspect_analysis.md'
    csv_path = 'circomspect_analysis.csv'
    parse_markdown_to_csv(md_path, csv_path)
    print("CSV file has been created successfully.")

if __name__ == "__main__":
    main()
