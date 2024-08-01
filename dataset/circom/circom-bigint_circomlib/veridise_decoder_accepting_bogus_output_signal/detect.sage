# SageMath script

# Prime number in circom
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
F = GF(p)

# Fixed values
inp = F(2)  # inp is 2
w = 4  # w is 4

# out should be [0, 0, 1, 0], but we are looking for a bogus value
# out = [0, 0, 0, 0]

success = 0

# Print the values
print(f"inp: {inp}")
print(f"w: {w}")
print(f"success: {success}")

"""
    for (var i=0; i<w; i++) {
        out[i] <-- (inp == i) ? 1 : 0;
        out[i] * (inp-i) === 0;
        lc = lc + out[i];
    }
"""
# Verify the constraint
lc = 0
out = []
constraint1_passes = True
for i in range(w):
    # We are not looking for correct witness...
    if i == 2:
        out.append(0)
        continue
    
    if inp - i != 0:
        out.append(0)
    else:
        out.append(1)

    if out[i] * (inp - i) != 0:
        constraint1_passes = False
        print("constraint out[i] * (inp-i) === 0 fails")

    lc += out[i]

print(f"out: {out}")

constraint2_passes = (lc == success)
constraint3_passes = (success * (success - 1) == 0)

if constraint1_passes and constraint2_passes and constraint3_passes:
    print(f"All constraints passed")
