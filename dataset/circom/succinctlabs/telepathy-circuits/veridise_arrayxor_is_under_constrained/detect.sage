#!/usr/bin/env sage

# Import necessary libraries
from sage.all import *
import random

def generate_array_xor_input(n=4):
    # Generate two random arrays of n 8-bit integers
    a = [random.randint(0, 255) for _ in range(n)]
    b = [random.randint(0, 255) for _ in range(n)]
    
    # Calculate the XOR of the two arrays
    out = [a[i] ^ b[i] for i in range(n)]
    
    # Print the input and expected output
    print(f"Input a: {a}")
    print(f"Input b: {b}")
    print(f"Expected output: {out}")
    
    # Generate the input for the circom circuit
    circom_input = {
        "a": a,
        "b": b
    }
    
    # Convert the input to JSON format
    import json
    json_input = json.dumps(circom_input, indent=2)
    
    print("\nCircom input (JSON format):")
    print(json_input)

# Generate input for ArrayXOR(4)
generate_array_xor_input(4)

print("Generate a correct witness first, then modify the entry 2 to 5")
print("Each entry can be any field element. out is underconstrained")
