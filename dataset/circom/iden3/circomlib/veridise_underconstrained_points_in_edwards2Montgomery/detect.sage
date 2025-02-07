# In this case we don't care that we are working on the finite field
#p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
#F = GF(p)

# Symbolic Variables
in_ = [var('in0'), var('in1')]
out = [var('out0'), var('out1')]

# Constraints
constraints = []
constraints.append(out[0] * (1 - in_[1]) == 1 + in_[1])
constraints.append(out[1] * in_[0] == out[0])

# Additional constraint: exploit division by zero
constraints.append(in_[0] == 0)

# Solve the system symbolically
solution = solve(constraints, in_ + out, solution_dict=True)

# Output the results
print("Solutions:")
print(solution)
