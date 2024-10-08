import json
from py_ecc.bls import G2ProofOfPossession as bls
from py_ecc.bls12_381 import G1, multiply, add
import os

def generate_scalar():
    # Generate a random 32-byte scalar
    return int.from_bytes(os.urandom(32), 'big')

def generate_public_key(scalar):
    # Multiply the scalar with the generator point G1
    return multiply(G1, scalar)

def bigint_format(point):
    # Convert each coordinate of the point to bigint format (7 limbs, 55-bit per limb)
    def to_bigint(coord):
        coord_int = int(coord)
        limbs = []
        for i in range(7):
            limb = (coord_int >> (55 * i)) & ((1 << 55) - 1)
            limbs.append(int(limb))  # Convert to native Python int
        return limbs

    return [to_bigint(coord) for coord in point]

def getBLS128381Prime():
    # This is the same as py_ecc.bls12_381.field_modulus
    p = [0] * 7
    p[0] = 35747322042231467
    p[1] = 36025922209447795
    p[2] = 1084959616957103
    p[3] = 7925923977987733
    p[4] = 16551456537884751
    p[5] = 23443114579904617
    p[6] = 1829881462546425
    return p

def convert_limb_to_number(limbs):
    # Convert the limb representation to a single integer
    number = 0
    for i, limb in enumerate(limbs):
        number += limb << (55 * i)
    return int(number)  # Ensure it's a native Python int

def main():
    # Generate random scalars a and b
    a = generate_scalar()
    b = generate_scalar()

    # Generate public keys A = aG, B = bG
    A = generate_public_key(a)
    B = generate_public_key(b)

    # Maliciously set C = A + B to trigger the vulnerability
    C = add(A, B)

    # Get the prime p and convert it to a single number
    p_limbs = getBLS128381Prime()
    p_number = convert_limb_to_number(p_limbs)

    print(json.dumps({"Prime p": p_number}, indent=4))

    # Prepare bigint data in JSON format
    bigint_data = {
        "Bigint A": bigint_format(A),
        "Bigint B": bigint_format(B),
        "Bigint C": bigint_format(C),
    }

    # Print the bigint format in JSON
    print(json.dumps(bigint_data, indent=4))

if __name__ == "__main__":
    main()