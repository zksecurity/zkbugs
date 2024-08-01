# SageMath script

# Prime number in circom
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
F = GF(p)

inp = F(2)  # inp is 2
w = 4  # w is 4

# out should be [0, 0, 1, 0], but we set it to [0, 0, 0, 0]
out = [0, 0, 0, 0]

success = 0

# Print the values
print(f"inp: {inp}")
print(f"w: {w}")
print(f"out: {out}")
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
for i in range(w):
    constraint1_passes = (out[i] * (inp-i) == 0)
    if not constraint1_passes:
        print("out[i] * (inp-i) === 0 fails")
        exit(-1)
    lc += out[i]

constraint2_passes = (lc == success)
constraint3_passes = (success * (success - 1) == 0)

if constraint1_passes and constraint2_passes and constraint3_passes:
    print(f"All constraints passed")
