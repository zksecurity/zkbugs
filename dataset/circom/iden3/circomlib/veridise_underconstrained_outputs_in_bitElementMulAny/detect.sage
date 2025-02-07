p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
F = GF(p)

# Fixed values
a = 168700
d = 168696

A = (2 * (a + d)) / (a - d) # A = 168698
B = 4 / (a - d) # B = 1

A = F(A)
B = F(B)

#--------MontgomeryDouble--------#

# Solve for in[0]
R.<x> = PolynomialRing(GF(p))
L = (3*x**2 + 2*A*x + 1).roots()
print("Solution(s) for in[0]: ", L) # [(19227208690775748531865437331126676461733156385287048589618245965417551240156, 1), (9957115138343285097796436995883023656331329481934330535312692950016859974868, 1)]

x1 = F(19227208690775748531865437331126676461733156385287048589618245965417551240156)
x2 = F(9957115138343285097796436995883023656331329481934330535312692950016859974868)

print("Verify if this the first solution of in[0] works: ", 3*x1**2 + 2*A*x1 + 1 == 0)
print("Verify if this the second solution of in[0] works: ", 3*x2**2 + 2*A*x2 + 1 == 0)
print("Let's use the first solution.")

# Solve for lambda in MontgomeryDouble
# We need a lambda such that `out[0] = in[0]`
# This is because `doubler.out[1] ==> adder.in1[1]` and we want `adder.in1[1] = 0`
# In MontgomeryDouble, `out[1] <== lamda * (in[0] - out[0]) - in[1]`, so we need `out[0] = in[0]`
# `out[0] <== B*lamda*lamda - A - 2*in[0]` -> we solve lambda from here
R.<x> = PolynomialRing(GF(p))
L = (B*x**2 - A - 2*x1 - x1).roots() # -x1 in the end since we move out[0] to RHS and out[0] = in[0] = x1
print("Solutions for lambda: ", L)

lamda1 = F(17227713526953394140741591647523112279518733089659685263306152777950041868941)
lamda2 = F(4660529344885881081504814097734162809029631310756349080392051408625766626676)

print("Verify if this the first solution works: ", B*lamda1**2 - A - 2*x1 - x1 == 0)
print("Verify if this the second solution works: ", B*lamda2**2 - A - 2*x1 - x1 == 0)
print("Let's use the first solution.")

out = [0, 0]
out[0] = B*lamda1*lamda1 - A - 2*x1
out[1] = lamda1 * (x1 - out[0])

print("out = ", out)

x1_2 = x1 ** 2
print("x1_2 = ", x1_2)
