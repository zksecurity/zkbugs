p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# Assumption is that the inputs are bounded by 2**8
# Pick a random max_abs_value in the correct range
BITS = 9
max_abs_value = 2**(BITS - 1) - 1

# Solve for `in`
in_ = var("in_")
constraints = []
constraints.append(max_abs_value + in_ >= 0)
constraints.append(2 * max_abs_value >= max_abs_value + in_)

# Solve the system symbolically
solution = solve(constraints, in_, solution_dict=True)

# Output the results
print("Solutions:")
print(solution)
