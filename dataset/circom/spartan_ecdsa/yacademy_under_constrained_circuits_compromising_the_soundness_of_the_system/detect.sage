import json

p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
F = GF(p)

# Constants
q = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141
qlo = q & ((2 ** 128) - 1)
qhi = q >> 128
tQ = 115792089237316195423570985008687907852405143892509244725752742275123193348738
tQlo = tQ & (2 ** 128 - 1)
tQhi = tQ >> 128

# Choose a value for s
s = 1337

# Split s into slo and shi
slo = s & (2**128 - 1)
shi = s >> 128

# Attacker modifies slo since it is not constrained
slo_modified = slo + 1314521

# Calculate carry
carry = (slo_modified + tQlo) >> 128

# Calculate intermediate signals
ahi = shi + tQhi + carry
bhi = qhi
alo = slo_modified + tQlo - (carry << 128)
blo = qlo

# Calculate alpha, beta, gamma
alpha = ahi > bhi
beta = ahi == bhi
gamma = alo >= blo

# Calculate isQuotientOne
isQuotientOne = alpha or (beta and gamma)

# Calculate theta and borrow
theta = qlo > (slo_modified + tQlo)
borrow = theta and isQuotientOne

# Calculate klo and khi
klo = (slo_modified + tQlo + borrow * (2**128)) - isQuotientOne * qlo
khi = (shi + tQhi - borrow) - isQuotientOne * qhi

# Convert klo and khi to bit arrays
klo_bits = [int((klo >> i) & 1) for i in range(256)]
khi_bits = [int((khi >> i) & 1) for i in range(256)]

# Prepare the witness
witness = [0] * 1337  # Initialize with zeros

# Fill in the witness values according to the mapping
witness[0] = 1  # constant term
witness[1:257] = klo_bits[:128] + khi_bits[:128]  # out - entry 1 to 256
witness[257] = s
witness[258] = slo_modified
witness[259] = shi
witness[260] = carry
witness[261] = ahi
witness[262] = bhi
witness[263] = alo
witness[264] = blo
witness[265] = klo
witness[266] = khi
witness[267] = int(alpha)
witness[268:270] = [ahi, bhi]
witness[270] = int(ahi < bhi)
witness[271:273] = [ahi, bhi]
witness[273:403] = [int((ahi - bhi) >> i) & 1 for i in range(130)]
witness[403] = ahi - bhi
witness[404] = int(beta)
witness[405:407] = [ahi, bhi]
witness[407] = int(ahi - bhi == 0)
witness[408] = ahi - bhi
witness[409] = 1 if ahi - bhi == 0 else pow(ahi - bhi, -1, p)
witness[410] = int(beta and gamma)
witness[411] = int(beta)
witness[412] = int(gamma)
witness[413] = int(borrow)
witness[414] = int(theta)
witness[415] = int(isQuotientOne)
witness[416] = int(gamma)
witness[417:419] = [alo, blo]
witness[419] = int(alo < blo)
witness[420:422] = [alo, blo]
witness[422:552] = [int((alo - blo) >> i) & 1 for i in range(130)]
witness[552] = alo - blo
witness[553:682] = [int((slo_modified + tQlo) >> i) & 1 for i in range(129)]
witness[682] = slo_modified + tQlo
witness[683] = int(isQuotientOne)
witness[684] = int(beta and gamma)
witness[685] = int(alpha)
witness[686:942] = khi_bits
witness[942] = khi
witness[943:1199] = klo_bits
witness[1199] = klo
witness[1200] = int(theta)
witness[1201:1203] = [qlo, slo_modified + tQlo]
witness[1203] = int(qlo > (slo_modified + tQlo))
witness[1204:1206] = [qlo, slo_modified + tQlo]
witness[1206:1336] = [int((qlo - (slo_modified + tQlo)) >> i) & 1 for i in range(130)]
witness[1336] = qlo - (slo_modified + tQlo)

# Process negative values
for i in range(len(witness)):
    if isinstance(witness[i], int) and witness[i] < 0:
        witness[i] = witness[i] % p

# Save the witness to a JSON file
with open('exploitable_witness.json', 'w') as f:
    json.dump([str(x) for x in witness], f)

print("Exploitable witness saved to exploitable_witness.json")