# SageMath script

# Prime number in circom
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
F = GF(p)

# Fixed values
in_ = F(5)  # input is 5
L = 3  # rotation of 3

# Fix part2 to a specific value, for example
part2 = F(2)

# Compute part1 as shown above
part1 = (in_ - part2 * 2^(32 - L)) * 2^L

# Compute out as part1 + part2
out = part1 + part2

# Print the values
print(f"part1: {part1}")
print(f"part2: {part2}")
print(f"out: {out}")

# Verify the constraint
constraint_passes = (part1 // 2^L + part2 * 2^(32 - L)) == in_
print(f"The constraint passes: {constraint_passes}")

# Check if out is not 40
if out != 40:
    print(f"Found values where out is not 40: part1 = {part1}, part2 = {part2}, out = {out}")
else:
    print(f"out is 40, trying different values might be needed.")
