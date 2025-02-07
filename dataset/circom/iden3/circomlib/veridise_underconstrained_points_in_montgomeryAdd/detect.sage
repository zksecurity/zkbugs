# In this case we don't care that we are working on the finite field
#p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
#F = GF(p)

# Fixed values
a = 168700
d = 168696

A = (2 * (a + d)) / (a - d) # A  = 168698
B = 4 / (a - d) # B = 1

# Symbolic Variables
in1 = [var('in1_0'), var('in1_1')]
in2 = [var('in2_0'), var('in2_1')]
out = [var('out0'), var('out1')]

lamda = 1

# Constraints
constraints = []
constraints.append(lamda * (in2[0] - in1[0]) == (in2[1] - in1[1]))
constraints.append(out[0] == B*lamda*lamda - A - in1[0] -in2[0])
constraints.append(out[1] == lamda * (in1[0] - out[0]) - in1[1])

# Additional constraint: exploit division by zero, and to get integer solutions
constraints.append(in1[0] == 0)
constraints.append(in2[0] == 0)

# Solve the system symbolically
solution = solve(constraints, in1 + in2 + out, solution_dict=True)

# Output the results
print("Solutions:")
print(solution)
