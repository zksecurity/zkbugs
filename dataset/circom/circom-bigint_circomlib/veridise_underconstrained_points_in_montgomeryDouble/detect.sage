p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
F = GF(p)

# Fixed values
a = 168700
d = 168696

A = (2 * (a + d)) / (a - d) # A = 168698
B = 4 / (a - d) # B = 1

A = F(A)
B = F(B)

# lambda is underconstrained when in[1] = 0. It can be any number.
lamda = F(1337)
print("lambda = ", lamda)

# Solve for in[0]
R.<x> = PolynomialRing(GF(p))
L = (3*x**2 + 2*A*x + 1).roots()
print("Solution(s) for in[0]: ", L) # [(19227208690775748531865437331126676461733156385287048589618245965417551240156, 1), (9957115138343285097796436995883023656331329481934330535312692950016859974868, 1)]

x1 = F(19227208690775748531865437331126676461733156385287048589618245965417551240156)
x2 = F(9957115138343285097796436995883023656331329481934330535312692950016859974868)

print("Verify if this the first solution works: ", 3*x1**2 + 2*A*x1 + 1 == 0)
print("Verify if this the second solution works: ", 3*x2**2 + 2*A*x2 + 1 == 0)
print("Let's use the first solution.")

out = [0, 0]
out[0] = B*lamda*lamda - A - 2*x1
out[1] = lamda * (x1 - out[0])

print("out = ", out)

x1_2 = x1 ** 2
print("x1_2 = ", x1_2)
