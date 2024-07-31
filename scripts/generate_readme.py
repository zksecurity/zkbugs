import os
import json
import argparse

def json_to_markdown(json_data, key):
    data = json_data[key]
    markdown = f"# {data['Vulnerability']}\n\n"
    markdown += f"* Id: {data['Id']}\n"
    markdown += f"* Project: {data['Project']}\n"
    markdown += f"* Commit: {data['Commit']}\n"
    markdown += f"* Fix Commit: {data['Fix Commit']}\n"
    markdown += f"* DSL: {data['DSL']}\n"
    markdown += f"* Vulnerability: {data['Vulnerability']}\n"
    markdown += "* Location\n"
    markdown += f"  - Path: {data['Location']['Path']}\n"
    markdown += f"  - Function: {data['Location']['Function']}\n"
    markdown += f"  - Line: {data['Location']['Line']}\n"
    markdown += "* Source: Audit Report\n"
    markdown += f"  - Source Link: {data['Source']['Audit Report']['Source Link']}\n"
    markdown += f"  - Bug ID: {data['Source']['Audit Report']['Bug ID']}\n"
    markdown += "* Commands\n"
    for command, cmd in data['Commands'].items():
        markdown += f"  - {command}: `{cmd}`\n"
    markdown += "\n## Short Description of the Vulnerability\n\n"
    markdown += data['Short Description of the Vulnerability'] + "\n\n"
    markdown += "## Short Description of the Exploit\n\n"
    markdown += data['Short Description of the Exploit'] + "\n\n"
    markdown += "## Proposed Mitigation\n\n"
    markdown += data['Proposed Mitigation'] + "\n"
    return markdown

def process_directory(path):
    if not os.path.isdir(path):
        print(f"The directory '{path}' does not exist.")
        return
    config_path = os.path.join(path, 'zkbugs_config.json')
    if not os.path.isfile(config_path):
        print(f"The config file does not exist in the directory '{path}'.")
        return
    
    try:
        with open(config_path, 'r') as file:
            config_data = json.load(file)
    except json.JSONDecodeError as e:
        print(f"The JSON file is not well formatted: {e}")
        return

    for key in config_data:
        markdown_content = json_to_markdown(config_data, key)
        readme_path = os.path.join(path, 'README.md')
        with open(readme_path, 'w') as readme_file:
            readme_file.write(markdown_content)
        
        print(f"README.md created in {path} for key '{key}'")

def main():
    parser = argparse.ArgumentParser(description='Process zkbugs config JSON and create a README.md file.')
    parser.add_argument('paths', metavar='P', type=str, nargs='+', help='a path to a directory')

    args = parser.parse_args()
    
    for path in args.paths:
        process_directory(path)

if __name__ == "__main__":
    main()
