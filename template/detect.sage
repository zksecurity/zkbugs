"""
TODO:

This sagemath script is bug-specific, it should be implemented by those who wants to add a new bug.

There are a few scenarios:

1. Let the script generate input.json that demonstrates the bug.
2. Let the script generate a legit input.json, compile the circuit to get a correct witness first, then
modify witness.json to get exploitable_witness.json.
3. You need circomlibjs to generate input.json, then ignore this script and use a JS workflow.

There isn't an universal way of implementing this script, but the general idea is to set each constraint as
a condition and solve the system of equations. Another approach is to play with elliptic curve math and compute
the input from scratch, such as: https://github.com/yi-sun/circom-pairing/blob/master/python/bls12-381.ipynb.
"""

# In this case we don't care that we are working on the finite field
#p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
#F = GF(p)

# Symbolic Variables
in_ = [var('in0'), var('in1')]
out = [var('out0'), var('out1')]

# Constraints
constraints = []
constraints.append(out[0] * in_[1] == in_[0])
constraints.append(out[1] * (in_[0] + 1) == in_[0] - 1)

# Additional constraint: exploit division by zero
constraints.append(in_[1] == 0)

# Solve the system symbolically
solution = solve(constraints, in_ + out, solution_dict=True)

# Output the results
print("Solutions:")
print(solution)
