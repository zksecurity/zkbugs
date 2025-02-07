p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# Fixed value
EPOCH_KEY_NONCE_PER_EPOCH = 255
n = 8

# Symbolic Variables
nonce = var('nonce')
in_ = [nonce, EPOCH_KEY_NONCE_PER_EPOCH]

# Constraints
constraints = []
constraints.append(nonce > 255)
# Exploit overflow in LessThan template
# Replaced 1<<n with 2**n
constraints.append(nonce + 2**n - 255 > p)

# Solve the system symbolically
solution = solve(constraints, in_[0], solution_dict=True)

# Output the results
print("Solutions:")
print(solution)
