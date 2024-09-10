from sage.all import *

# BabyJubJub curve parameters
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
Fr = GF(p)
A = Fr(168700)
D = Fr(168696)
E = EllipticCurve(Fr, [0, A, 0, 1, 0])

# Subgroup order
subgroup_order = 2736030358979909402780800718157159386076813972158567259200215660948447373040

# Manually chosen note
note = "12345678901234567890123456789012345678901234567890123456789012345"

# Known base point of BabyJubJub curve
pub_key = E(17777552123799933955779906779655732241715742912184938656739573121738514868268,
            2626589144620713026669568689430873010625803728049924121243784502389097019475)

# Another point on the curve (you could generate this randomly)
R8 = E(3916711772683448532789789445991866178509653479034760899198517799527759544131,
       5378912912622866911322403340058433062147753786483715616132980724860148372340)

# S is set to subgroup_order - 1
S = subgroup_order - 1

# Print the input.json
print("{")
print(f'  "note": "{note}",')
print(f'  "pub_key": [')
print(f'    "{pub_key[0]}",')
print(f'    "{pub_key[1]}"')
print(f'  ],')
print(f'  "sig": [')
print(f'    "{R8[0]}",')
print(f'    "{R8[1]}",')
print(f'    "{S}"')
print(f'  ]')
print("}")