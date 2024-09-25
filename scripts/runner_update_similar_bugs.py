import os
import json
import subprocess

SCRIPT_PATH=os.path.dirname(os.path.realpath(__file__))

def update_similar_bugs():
    # Update the path to zkbugs_similar_bugs.json
    with open(os.path.join(SCRIPT_PATH, '..', 'dataset', 'zkbugs_similar_bugs.json'), 'r') as file:
        similar_bugs_data = json.load(file)

    # Iterate through each DSL in the similar bugs data
    for dsl, groups in similar_bugs_data.items():
        # Iterate through each group in the DSL
        for group in groups:
            similar_bugs = group['Similar Bugs']
            
            # Iterate through each bug path in the "Similar Bugs" list
            for bug_path in similar_bugs:
                # Construct the real path using the DSL and bug path
                real_bug_path = os.path.join(SCRIPT_PATH, '..', 'dataset', dsl, bug_path)
                config_path = os.path.join(real_bug_path, 'zkbugs_config.json')
                
                if not os.path.isfile(config_path):
                    print(f"The config file does not exist in the directory '{real_bug_path}'.")
                    continue
                
                try:
                    with open(config_path, 'r') as file:
                        config_data = json.load(file)
                except json.JSONDecodeError as e:
                    print(f"The JSON file is not well formatted: {e}")
                    continue
                
                # Update the "Similar Bugs" field in the config data
                # There is only one key in the config data, so this approach is a bit hacky
                for key in config_data:
                    config_data[key]['Similar Bugs'] = [b for b in similar_bugs if b != bug_path]
                
                # Write the updated config data back to the zkbugs_config.json file
                with open(config_path, 'w') as file:
                    json.dump(config_data, file, indent=2)
                
                # Update the path to generate_readme.py
                generate_readme = os.path.join(SCRIPT_PATH, 'generate_readme.py')
                subprocess.run(['python3', generate_readme, real_bug_path])

if __name__ == "__main__":
    update_similar_bugs()
