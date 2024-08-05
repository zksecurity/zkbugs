p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# It is easy to come up with this exploit by hand
print(f"1 < 0 =", 1 < 0)
print(f"1 < p =", 1 < p)
print("1 < 0 is false of course, but in scalar field we can overflow the modulus and let the circuit evaluate 1 < p. The result is true but in the circuit it is equivalent to 1 < 0, breaking developer's assumption.")
print("This exploit works because Num2Bits(254) is used, which allows attacker to provide any value larger than scalar field modulus p and smaller than 2**254.")
