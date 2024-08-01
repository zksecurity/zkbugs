# In this case we don't care that we are working on the finite field
#p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
#F = GF(p)

# Fixed values
inp = 2  # inp is 2
w = 4

# Symbolic Variables
out = [var('out{}'.format(i)) for i in range(w)]
success = var('success')

# Constraints
constraints = []

# Adding constraints for out[i]
for i in range(w):
    constraints.append(out[i] * (inp - i) == 0)

# Linear combination constraint
constraints.append(sum(out) == success)

# Constraint on success
constraints.append(success * (success - 1) == 0)

# Additional constraint: success is not 1
constraints.append(success != 1)

# Solve the system symbolically
solution = solve(constraints, out + [success], solution_dict=True)


# Output the results
print("Solutions where inp = 2 and success != 1:")
print(solution)
