import json

# Parameters
n = 126  # Maximum value allowed by the template
k = 2    # A small value for simplicity

# Function to simulate long division and generate attacker inputs
def generate_attacker_inputs(n, k):
    # Choose a large value for a
    a = (1 << (n * k)) + (1 << (n + 1))  # Ensure remainder exceeds 2^n
    # Choose a non-zero value for b
    b = (1 << (n * k - 1))  # A large non-zero value for b

    # Perform division to get quotient and remainder
    quotient, remainder = divmod(a, b)

    # Assert that the remainder exceeds 2^n
    assert remainder > (1 << n), "Remainder does not exceed 2^n"

    # Convert a and b to their respective bit representations
    a_bits = [int(a >> (i * n) & ((1 << n) - 1)) for i in range(2 * k)]
    b_bits = [int(b >> (i * n) & ((1 << n) - 1)) for i in range(k)]

    # Create JSON object
    inputs = {
        "a": a_bits,
        "b": b_bits
    }

    # Print JSON result
    print(json.dumps(inputs, indent=4))

    # Print debug information
    print(f"Quotient: {quotient}")
    print(f"Remainder: {remainder}")
    print(f"Remainder overflow: {remainder - 2**n > 0}")

# Generate and print attacker inputs
generate_attacker_inputs(n, k)