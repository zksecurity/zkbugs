import hashlib

# Scalar field modulus
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# The circuit computes pubKey = s * (Tx, Ty) + (Ux, Uy)
# Set s = 0 and (Ux, Uy) = pubKey, then (Tx, Ty) can be anything
s = 0
Tx = randint(1, p-1)
Ty = randint(1, p-1)

# Code from https://asecuritysite.com/sage/sage08
F = FiniteField(2**256-2**32-2**9 -2**8 - 2**7 - 2**6 - 2**4 - 1)
a  = 0
b  = 7
E  = EllipticCurve(F, [a, b])
G  = E((55066263022277343669578718895168534326250603453777594175500187360389116729240, 
32670510020758816978083085130507043184471273380659243275938904335757337482424))
n  = 115792089237316195423570985008687907852837564279074904382605163141518161494337
h  = 1
Fn = FiniteField(n)

def hashit(msg):  
  return Integer('0x' + hashlib.sha256(msg.encode()).hexdigest())

def keygen():
  d = randint(1, n - 1)
  Q = d * G
  return (Q, d)

pubKey = keygen()
Ux = pubKey[0][0]
Uy = pubKey[0][1]

print("s = ", s)
print("Tx = ", Tx)
print("Ty = ", Ty)
print("Ux = ", Ux)
print("Uy = ", Uy)
