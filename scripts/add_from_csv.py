import argparse
import csv
import json
import os
import logging
import re
from urllib.parse import urlparse

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")


with open("reports/reports.json") as f:
    reports_json = json.load(f)


def get_commit(source):
    source = source.replace("reports/","")
    for report in reports_json:
        if source == report["File"]:
            return report["Commit"]
    return ""


def extract_project(url):
    """Extracts the project name from a GitHub URL."""
    if url and "github.com" in url:
        parts = urlparse(url).path.strip("/").split("/")
        if len(parts) >= 2:
            return f"{parts[0]}/{parts[1]}"
    return ""

def extract_fix_commit(fix_url):
    """Extracts the commit hash from a GitHub fix URL."""
    if not fix_url:
        return ""
    
    match = re.search(r'commit/([a-f0-9]{40})', fix_url)
    if match:
        return match.group(1)
    
    match = re.search(r'commits/([a-f0-9]{40})', fix_url)
    if match:
        return match.group(1)
    
    match = re.search(r'files#diff-([a-f0-9]+)', fix_url)
    if match:
        return match.group(1)

    return ""

def extract_auditor(source_link):
    """Extracts the auditor's name from the Source Link column."""
    parts = source_link.split('/')
    if len(parts) >= 3 and parts[0] == "reports" and parts[1] == "documents":
        return parts[2].split('-')[0]
    return ""

def process_csv(input_csv, dataset_dir):
    """Processes the CSV file and generates zkbugs_config.json files."""
    with open(input_csv, newline='', encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            title = row["Name"]
            dsl = row["ZK Framework (Circuit only)"].strip()
            source_code_url = row["Source Code"].strip()
            fix_url = row["Fix"].strip()
            vulnerability = row["Vulnerability"].strip()
            root_cause = row["Root Cause"].strip()
            impact = row["Impact"].strip()
            source_link = row["Source Link"].strip()

            # Determine project
            project = extract_project(source_code_url) or extract_project(fix_url)

            # Determine auditor
            auditor = extract_auditor(source_link)

            # Determine fix commit
            fix_commit = extract_fix_commit(fix_url)

            # Compute project_path
            filtered_title = title.replace(' ', '_').replace("’", "").replace("“", "").replace("”", "").replace("+", "_").replace("=", "_").replace("-", "_").replace("(", "").replace(")", "").replace("/", "").replace(".", "")
            if auditor:
                project_path = os.path.join(dataset_dir, dsl.lower(), project, f"{auditor}_{filtered_title}")
            else:
                project_path = os.path.join(dataset_dir, dsl.lower(), project, f"{filtered_title}")

            # Logging the extracted values
            #logging.info(f"Processing: {title}")
            ##logging.info(f" - DSL: {dsl}")
            #logging.info(f" - Project: {project}")
            #logging.info(f" - Auditor: {auditor}")
            #logging.info(f" - Fix Commit: {fix_commit}")
            #logging.info(f" - Vulnerability: {vulnerability}")
            #logging.info(f" - Root Cause: {root_cause}")
            #logging.info(f" - Impact: {impact}")
            #logging.info(f" - Project Path: {project_path}")

            # Create directories safely
            os.makedirs(project_path, exist_ok=True)

            # Build JSON structure
            config = {
                title: {
                    "Id": os.path.join(project, f"{auditor}_{title.replace(' ', '_')}" if auditor else f"{title.replace(' ', '_')}"),
                    "Path": f"dataset/{project_path}",
                    "Project": "https://github.com/" + project,
                    "Commit": get_commit(row["Source Link"].strip()),
                    "Fix Commit": fix_commit,
                    "DSL": dsl,
                    "Vulnerability": vulnerability,
                    "Impact": impact,
                    "Root Cause": root_cause,
                    "Reproduced": False,
                    "Location": {
                        "Path": "",
                        "Function": "",
                        "Line": ""
                    },
                    "Source": {
                        "Audit Report": {
                            "Source Link": f"https://github.com/zksecurity/zkbugs/blob/main/{source_link}" if auditor else source_link,
                            "Bug ID": title
                        }
                    },
                    "Commands": {
                        "Setup Environment": "",
                        "Reproduce": "",
                        "Compile and Preprocess": "",
                        "Positive Test": "",
                        "Find Exploit": "",
                        "Clean": ""
                    },
                    "Short Description of the Vulnerability": "",
                    "Short Description of the Exploit": "",
                    "Proposed Mitigation": ""
                }
            }

            # Save JSON file
            json_path = os.path.join(project_path, "zkbugs_config.json")
            with open(json_path, "w", encoding="utf-8") as jsonfile:
                json.dump(config, jsonfile, indent=4)

            logging.info(f"Saved config: {json_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process CSV and generate zkbugs_config.json files.")
    parser.add_argument("input_csv", help="Path to the input CSV file")
    parser.add_argument("dataset_dir", help="Path to the dataset directory")

    args = parser.parse_args()
    process_csv(args.input_csv, args.dataset_dir)
