import json
from sage.all import *

"""
Original input was taken from https://github.com/yi-sun/circom-pairing/blob/master/scripts/signature/input_signature.json

{"in": [["2009822906594717","20442509737585892","19998406545305169","3257293002446733","9524330011591718","22878868367690592","556175690519393"],["5482847202149361","4456548308632729","21161498208540270","18926196016982932","18046733294100249","18607721477678504","984728513755546"]]}
"""

# Load the input from input.json
with open('input.json', 'r') as f:
    input_data = json.load(f)

# Subtracting one from the most significant limb and adding 2**55 to the second-most significant limb
new_x_array = input_data["in"][0][:]
new_y_array = [str(int(input_data["in"][1][0]) - 1)]\
            + [str(int(input_data["in"][1][1]) + 2**55)] \
            + input_data["in"][1][2:]

# Prepare the output dictionary
output = {
    "in": [
        [str(x) for x in new_x_array],
        [str(y) for y in new_y_array]
    ]
}

# Print the output in JSON format
print(json.dumps(output, indent=2))
