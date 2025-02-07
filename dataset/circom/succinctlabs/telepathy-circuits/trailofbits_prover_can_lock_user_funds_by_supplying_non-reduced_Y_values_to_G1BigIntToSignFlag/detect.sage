import json
from sage.all import *

"""
Original input:

{"in": ["5482847202149361","4456548308632729","21161498208540270","18926196016982932","18046733294100249","18607721477678504","984728513755546"]}

This is the y-coordinate of the public key from https://github.com/yi-sun/circom-pairing/blob/master/scripts/signature/input_signature.json
"""


p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# Load the input from input.json
with open('input.json', 'r') as f:
    input_data = json.load(f)

# Convert bigint representation to field element
def bigint_to_field_element(bigint_array):
    # Assuming the bigint is represented in base 2^55
    base = 2**55
    field_element = sum(int(x) * (base**i) for i, x in enumerate(bigint_array))
    return field_element

# Convert field element back to bigint representation
def field_element_to_bigint(field_element, num_limbs=7):
    base = 2**55
    bigint_array = []
    for _ in range(num_limbs):
        bigint_array.append(str(field_element % base))
        field_element //= base
    return bigint_array

# Convert y-coordinate to field element
y_field_element = bigint_to_field_element(input_data["in"])
print(f"y_field_element: {y_field_element}")

# Make sure the previous conversion was correct
y_big_int = field_element_to_bigint(y_field_element)
print(f"y_big_int: {y_big_int}")

# Negate the field element
# This step is needed to create "negative" y-coordinate as described in the report
neg_y_field_element = -y_field_element
print(f"neg_y_field_element: {neg_y_field_element}")

# This is the actual "original input" that we want to use
neg_y_bigint = {"in": field_element_to_bigint(neg_y_field_element % p)}
print(f"neg_y_bigint: {json.dumps(neg_y_bigint, indent=2)}")

# Compute 2p + (-y) where y is neg_y_field_element
# This value is congruent to -Y mod p
neg_y_plus_2p = -neg_y_field_element + 2 * p
print(f"neg_y_plus_2p: {neg_y_plus_2p}")

# Convert negated field element back to bigint
neg_y_plus_2P_bigint = field_element_to_bigint(neg_y_plus_2p)
print(f"neg_y_plus_2P_bigint: {neg_y_plus_2P_bigint}")

# Prepare the output dictionary
output = {
    "in": neg_y_plus_2P_bigint
}

# Print the output in JSON format
print("Replace input.json with the following:")
print(json.dumps(output, indent=2))
