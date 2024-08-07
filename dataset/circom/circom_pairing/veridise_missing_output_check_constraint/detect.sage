n = 55
k = 7

lower_bound = 36025922209447795
upper_bound = 2**n - 1

pubKey = [[randint(lower_bound , upper_bound) for _ in range(k)] for _ in range(2)]
print("pubKey = ", pubKey)

signature = [[[randint(lower_bound , upper_bound) for _ in range(k)] for _ in range(2)] for _ in range(2)]
print("signature = ", signature)

hash_ = [[[randint(lower_bound , upper_bound) for _ in range(k)] for _ in range(2)] for _ in range(2)]
print("hash = ", hash_)
