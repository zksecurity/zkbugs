# Fixed values
n = 55
k = 7

# lower_bound = 36025922209447795
lower_bound = max([35747322042231467, 36025922209447795, 1084959616957103, 7925923977987733, 16551456537884751, 23443114579904617, 1829881462546425])
print("lower_bound = ", lower_bound)
upper_bound = 2**n - 1
print("upper_bound = ", upper_bound)

pubKey = [[randint(lower_bound , upper_bound) for _ in range(k)] for _ in range(2)]
print("pubKey = ", pubKey)

signature = [[[randint(lower_bound , upper_bound) for _ in range(k)] for _ in range(2)] for _ in range(2)]
print("signature = ", signature)

hash_ = [[[randint(lower_bound , upper_bound) for _ in range(k)] for _ in range(2)] for _ in range(2)]
print("hash = ", hash_)
