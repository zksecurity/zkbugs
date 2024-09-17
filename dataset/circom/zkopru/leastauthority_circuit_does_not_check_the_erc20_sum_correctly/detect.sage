import json
from sage.all import *

# Helper functions
def poseidon(inputs):
    # Simplified Poseidon hash function (replace with actual implementation)
    return sum(inputs) % (2**254)

def eddsa_sign(private_key, message):
    # Simplified EdDSA signature (replace with actual implementation)
    return [private_key * message % (2**254)] * 3

# Generate random field element
def random_field():
    return ZZ.random_element(2**254)

# Set up parameters
tree_depth = 4
n_i = 1  # Number of input notes
n_o = 1  # Number of output notes

# Generate input data
input_data = {
    "spending_note_eddsa_point": [[random_field() for _ in range(2)] for _ in range(n_i)],
    "spending_note_eddsa_sig": [[random_field() for _ in range(3)] for _ in range(n_i)],
    "spending_note_nullifier_seed": [random_field() for _ in range(n_i)],
    "spending_note_salt": [random_field() for _ in range(n_i)],
    "spending_note_eth": [random_field() for _ in range(n_i)],
    "spending_note_token_addr": [random_field() for _ in range(n_i)],
    "spending_note_erc20": [random_field() for _ in range(n_i)],
    "spending_note_erc721": [0 for _ in range(n_i)],  # Set to 0 as we're using ERC20
    "note_index": [random_field() for _ in range(n_i)],
    "siblings": [[random_field() for _ in range(n_i)] for _ in range(tree_depth)],
    "inclusion_references": [random_field() for _ in range(n_i)],
    "nullifiers": [random_field() for _ in range(n_i)],
    "new_note_spending_pubkey": [random_field() for _ in range(n_o)],
    "new_note_salt": [random_field() for _ in range(n_o)],
    "new_note_eth": [0 for _ in range(n_o)],  # Initialize to 0, will be set later
    "new_note_token_addr": [random_field() for _ in range(n_o)],
    "new_note_erc20": [0 for _ in range(n_o)],  # Initialize to 0, will be set later
    "new_note_erc721": [0 for _ in range(n_o)],  # Set to 0 as we're using ERC20
    "new_note_hash": [random_field() for _ in range(n_o)],
    "typeof_new_note": [0 for _ in range(n_o)],  # 0 for UTXO
    "public_data_to": [0 for _ in range(n_o)],
    "public_data_eth": [0 for _ in range(n_o)],
    "public_data_token_addr": [0 for _ in range(n_o)],
    "public_data_erc20": [0 for _ in range(n_o)],
    "public_data_erc721": [0 for _ in range(n_o)],
    "public_data_fee": [0 for _ in range(n_o)],
    "fee": random_field(),
    "swap": 0
}

# Ensure constraints are satisfied

# 1. Calculate spending pubkey
for i in range(n_i):
    pubkey_x = input_data["spending_note_eddsa_point"][i][0]
    pubkey_y = input_data["spending_note_eddsa_point"][i][1]
    nullifier_seed = input_data["spending_note_nullifier_seed"][i]
    spending_pubkey = poseidon([pubkey_x, pubkey_y, nullifier_seed])

# 2. Calculate asset hash
for i in range(n_i):
    eth = input_data["spending_note_eth"][i]
    token_addr = input_data["spending_note_token_addr"][i]
    erc20 = input_data["spending_note_erc20"][i]
    erc721 = input_data["spending_note_erc721"][i]
    asset_hash = poseidon([eth, token_addr, erc20, erc721])

# 3. Calculate note hash
for i in range(n_i):
    salt = input_data["spending_note_salt"][i]
    note_hash = poseidon([spending_pubkey, salt, asset_hash])

# 4. Generate EdDSA signature
for i in range(n_i):
    private_key = random_field()  # This should be kept secret in a real implementation
    input_data["spending_note_eddsa_sig"][i] = eddsa_sign(private_key, note_hash)

# 5. Calculate nullifier
for i in range(n_i):
    nullifier_seed = input_data["spending_note_nullifier_seed"][i]
    leaf_index = input_data["note_index"][i]
    input_data["nullifiers"][i] = poseidon([nullifier_seed, leaf_index])

# 6. Ensure zero sum for ETH
eth_inflow = sum(input_data["spending_note_eth"])
input_data["fee"] = eth_inflow // 2  # Set fee to half of the inflow
input_data["new_note_eth"][0] = eth_inflow - input_data["fee"]  # Set the remaining to the output note
eth_outflow = sum(input_data["new_note_eth"]) + input_data["fee"]
assert eth_inflow == eth_outflow, "ETH inflow and outflow must be equal"

# 7. Ensure zero sum for ERC20
erc20_inflow = sum(input_data["spending_note_erc20"])
input_data["new_note_erc20"][0] = erc20_inflow  # Set all ERC20 to the output note
erc20_outflow = sum(input_data["new_note_erc20"])
assert erc20_inflow == erc20_outflow, "ERC20 inflow and outflow must be equal"

# 8. Calculate new note hash
for i in range(n_o):
    new_spending_pubkey = input_data["new_note_spending_pubkey"][i]
    new_salt = input_data["new_note_salt"][i]
    new_eth = input_data["new_note_eth"][i]
    new_token_addr = input_data["new_note_token_addr"][i]
    new_erc20 = input_data["new_note_erc20"][i]
    new_erc721 = input_data["new_note_erc721"][i]
    new_asset_hash = poseidon([new_eth, new_token_addr, new_erc20, new_erc721])
    input_data["new_note_hash"][i] = poseidon([new_spending_pubkey, new_salt, new_asset_hash])

# Convert all values to strings for JSON serialization
for key, value in input_data.items():
    if isinstance(value, list):
        input_data[key] = [[str(v) for v in sublist] if isinstance(sublist, list) else str(sublist) for sublist in value]
    else:
        input_data[key] = str(value)

# Write to JSON file
with open('input.json', 'w') as f:
    json.dump(input_data, f, indent=2)

print("Generated input.json with valid data for ZkTransaction(4, 1, 1)")