import os
from pathlib import Path
import re

# Command: python3 create_bugs_md.py

def get_bug_paths(dataset_dir):
    bug_paths = []
    for root, dirs, files in os.walk(dataset_dir):
        if 'README.md' in files and 'zkbugs_config.json' in files:
            bug_paths.append(root)
    return bug_paths

def create_toc(bugs_by_dsl):
    toc = "# Table of Contents\n\n"
    github_base_url = "https://github.com/zksecurity/zkbugs/tree/main/dataset"
    for dsl, bugs in bugs_by_dsl.items():
        dsl_url = f"{github_base_url}/{dsl}"
        toc += f"- [{dsl}]({dsl_url})\n"
        for bug_id in bugs:
            bug_url = f"{github_base_url}/{bug_id}"
            toc += f"    - [{bug_id}]({bug_url})\n"
    return toc

def create_content(bugs_by_dsl):
    content = ""
    for dsl, bugs in bugs_by_dsl.items():
        content += f"# {dsl}\n\n"
        for bug_id in bugs:
            content += f"## {bug_id}\n\n"
            readme_path = os.path.join('dataset', bug_id, 'README.md')
            with open(readme_path, 'r') as f:
                readme_content = f.read()
            # Increase the level of all headers in the README content
            readme_content = re.sub(r'^(#+)', r'##\1', readme_content, flags=re.MULTILINE)
            content += readme_content + "\n\n"
    return content

def main():
    dataset_dir = "dataset"
    bug_paths = get_bug_paths(dataset_dir)

    bugs_by_dsl = {}
    for path in bug_paths:
        parts = path.split(os.sep)
        dsl = parts[1]
        bug_id = "/".join(parts[1:])
        if dsl not in bugs_by_dsl:
            bugs_by_dsl[dsl] = []
        bugs_by_dsl[dsl].append(bug_id)

    toc = create_toc(bugs_by_dsl)
    content = create_content(bugs_by_dsl)

    # Clear the existing content of BUGS.md before writing new content
    with open('BUGS.md', 'w') as f:
        f.write('')  # This empties the file

    # Now write the new content
    with open('BUGS.md', 'w') as f:
        f.write(toc + "\n" + content)

    print("BUGS.md has been created successfully.")

if __name__ == "__main__":
    main()
