# requirements: pip install openai pdfplumber 
# WARNING: You should always check the results of this script.
# usage:
# OPENAI_API_KEY=YOU_KEY python scripts/update_json_using_openai.py file_with_paths.json
import argparse
import json
import os
import time
import openai
import logging
import pdfplumber

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# OpenAI API Key (set this via an environment variable for security)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def extract_report_path(source_link):
    """Extracts the local file path from the Source Link."""
    if source_link.startswith("https://github.com/zksecurity/zkbugs/blob/main/"):
        return source_link.replace("https://github.com/zksecurity/zkbugs/blob/main/", "")
    return None

def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    except Exception as e:
        logging.error(f"Failed to extract text from {pdf_path}: {e}")
        return None

def query_openai(prompt, instruction, max_retries=5):
    """Queries OpenAI API, handling rate limits with retries and exponential backoff."""
    wait_time = 2  # Initial wait time in seconds

    for attempt in range(max_retries):
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini", # gpt-4-turbo
                messages=[
                    {"role": "system", "content": instruction},
                    {"role": "user", "content": prompt}
                ]
            )
            # Ensure output is plain text
            return response.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()

        except openai.RateLimitError:
            logging.warning(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
            time.sleep(wait_time)
            wait_time *= 2  # Exponential backoff (2s → 4s → 8s → ...)

        except Exception as e:
            logging.error(f"OpenAI API error: {e}")
            break

    logging.error("Max retries exceeded. Skipping OpenAI request.")
    return None

def process_json(json_path):
    """Processes a JSON file, extracts audit data, and updates it."""
    print("=" * 80)
    logging.info(f"Processing JSON: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    title = list(data.keys())[0]
    entry = data[title]

    # Ensure it's an audit report
    if "Audit Report" not in entry.get("Source", {}):
        logging.warning(f"Skipping {json_path}: Not an audit report")
        return

    # Extract report path
    source_link = entry["Source"]["Audit Report"]["Source Link"]
    report_path = extract_report_path(source_link)

    if not report_path or not os.path.exists(report_path):
        logging.error(f"Audit report {report_path} not found for {title}")
        return

    # Extract text from PDF
    report_text = extract_text_from_pdf(report_path)
    if not report_text:
        logging.error(f"Failed to extract text from {report_path}")
        return

    # Get bug ID
    bug_id = entry["Source"]["Audit Report"]["Bug ID"]

    # **Generate OpenAI Prompts**
    desc_instruction = "Summarize the bug in 1-3 short sentences in a plain text format. Do not use JSON or markdown."
    desc_prompt = f"Find the description of the bug '{bug_id}' in the following report and summarize it concisely:\n\n{report_text}"
    short_description = query_openai(desc_prompt, desc_instruction) or ""

    fix_instruction = "Extract the recommended fix concisely (if available). Limit it to 1-2 sentences in plain text format. Do not use JSON or markdown."
    fix_prompt = f"Find the recommended fix for the bug '{bug_id}' in the report:\n\n{report_text}"
    proposed_mitigation = query_openai(fix_prompt, fix_instruction) or ""

    location_instruction = "Find the file path, function name, and line number for the bug if available. Return in plain text format as 'Path: XYZ, Function: ABC, Line: 123'. If the function or line is not specified, leave them empty. Do not use JSON or markdown."
    location_prompt = f"Find the file path, function name, and line number for the bug '{bug_id}' in the report:\n\n{report_text}"
    location_info = query_openai(location_prompt, location_instruction) or ""

    # **Parse location details**
    location = {"Path": "", "Function": "", "Line": ""}
    for line in location_info.split(","):
        if "Path:" in line:
            location["Path"] = line.split(":", 1)[1].strip()
        elif "Function:" in line and "not specified" not in line.lower():
            location["Function"] = line.split(":", 1)[1].strip()
        elif "Line:" in line and "not specified" not in line.lower():
            location["Line"] = line.split(":", 1)[1].strip()

    # Ensure empty fields if function/line are missing
    location["Function"] = location["Function"] if location["Function"] else ""
    location["Line"] = location["Line"] if location["Line"] else ""

    # **Log extracted data**
    logging.info(f" - Location: {location}")
    logging.info(f" - Short Description: {short_description}")
    logging.info(f" - Proposed Mitigation: {proposed_mitigation}")

    # **Update JSON data**
    entry["Location"] = location
    entry["Short Description of the Vulnerability"] = short_description
    entry["Proposed Mitigation"] = proposed_mitigation

    # **Save updated JSON**
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    logging.info(f"Updated JSON saved: {json_path}")
    print("=" * 80)

def process_json_list(input_txt):
    """Processes multiple JSON files listed in a text file."""
    with open(input_txt, "r", encoding="utf-8") as f:
        json_files = [line.strip() for line in f.readlines()]

    for json_file in json_files:
        if os.path.exists(json_file):
            process_json(json_file)
        else:
            logging.error(f"JSON file not found: {json_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update JSON files with vulnerability details from audit reports.")
    parser.add_argument("input_txt", help="Path to the text file listing JSON file paths.")
    args = parser.parse_args()

    process_json_list(args.input_txt)
