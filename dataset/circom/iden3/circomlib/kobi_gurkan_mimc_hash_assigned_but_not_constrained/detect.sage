p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

print("ins[0] and k are just be random field elements. Copy them to input.json.")
print("ins[0] = ", randint(1, p - 1))
print("k = ", randint(1, p - 1))
print("Generate a correct witness first, then modify the 2nd entry in the witness to this outs[0], which is also just a random field element.")
print("outs[0] = ", randint(1, p - 1))
print("This indicates that there is no constraint restricting outs[0], it can be any value.")