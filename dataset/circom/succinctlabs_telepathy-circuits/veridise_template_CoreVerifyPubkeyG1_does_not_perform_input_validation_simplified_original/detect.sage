import json

# input was taken from https://github.com/yi-sun/circom-pairing/blob/c686f0011f8d18e0c11bd87e0a109e9478eb9e61/scripts/signature/input_signature.json
valid_input = {
  "pubkey": [["2009822906594717","20442509737585892","19998406545305169","3257293002446733","9524330011591718","22878868367690592","556175690519393"],["5482847202149361","4456548308632729","21161498208540270","18926196016982932","18046733294100249","18607721477678504","984728513755546"]],
  "signature": [[["1487298433264780","21541914032228149","73299277954222","20592869769470411","32212248507196091","17554646455239324","1400739176536426"],["27905525805850593","18587761296700115","8576740118892489","11542896562448560","7356486269846127","23099198775676489","1749349290976783"]],[["31664845608474726","21511101585070684","7988459814562914","21965083449674839","34785620406298652","8737667885256512","1239676855703922"],["21168837382994750","18380311182872957","1550072237479276","25163299916141397","15976128696107164","19450465035445157","1263320772306782"]]],
  "hash": [[["8670705751816379","27916718246162202","6395341560288320","5071828068778565","884362211036596","13355992922842281","1162842904818986"],["14717501328985393","31614581546810189","9166577628201389","7197046436844177","34297293075691057","30988820664340476","955223845761836"]],[["26176120477808773","17848253405193635","10200691223057045","30698812458808988","35170596397378464","16950994534356644","1023288348312740"],["626986936810458","13104768905936102","12195987525789509","7065968987246367","12036339442865628","7744881743405338","1545199030663080"]]]
}

# Convert all string entries to integers in valid_input
valid_input = {
    "pubkey": [[int(x) for x in row] for row in valid_input["pubkey"]],
    "signature": [[[int(x) for x in subrow] for subrow in row] for row in valid_input["signature"]],
    "hash": [[[int(x) for x in subrow] for subrow in row] for row in valid_input["hash"]]
}

# defined in bls12_381_func.get_BLS12_381_prime()
p = [35747322042231467, 36025922209447795, 1084959616957103, 7925923977987733, 16551456537884751, 23443114579904617, 1829881462546425]

def array_to_number(arr):
    """
    Convert a 7-part array representation of a number to a single integer.
    Each part represents 64 bits of the number.
    """
    result = 0
    for i, part in enumerate(reversed(arr)):
        result += part << (64 * i)
    return result

def number_to_array(num):
    """
    Convert a single integer to a 7-part array representation.
    Each part represents 64 bits of the number.
    """
    result = []
    mask = (1 << 64) - 1  # 64-bit mask
    for _ in range(7):
        result.append(num & mask)
        num >>= 64
    return list(reversed(result))

# Convert array to number
p_num = array_to_number(p)
print(f"p as a number: {p_num}")

# Convert number back to array
p_array = number_to_array(p_num)
print(f"p as an array: {p_array}")

# Verify that the conversion is correct
print(f"Original p and converted p_array are equal: {p == p_array}")


# Function to create a delta that causes overflow but doesn't exceed 2^55 - 1
def create_overflow_delta(original, p):
    delta = [0] * 7
    max_value = 2**55 - 1
    for i in range(7):
        if original[i] <= p[i]:
            delta[i] = min(p[i] - original[i] + 1, max_value - original[i])
        else:
            delta[i] = 0
    return delta

# Convert delta array to number
def delta_to_number(delta):
    return sum(d << (64 * i) for i, d in enumerate(reversed(delta)))

# Calculate deltas for each component
pubkey0_delta = create_overflow_delta(valid_input["pubkey"][0], p)
pubkey1_delta = create_overflow_delta(valid_input["pubkey"][1], p)
signature00_delta = create_overflow_delta(valid_input["signature"][0][0], p)
signature01_delta = create_overflow_delta(valid_input["signature"][0][1], p)
signature10_delta = create_overflow_delta(valid_input["signature"][1][0], p)
signature11_delta = create_overflow_delta(valid_input["signature"][1][1], p)
hash00_delta = create_overflow_delta(valid_input["hash"][0][0], p)
hash01_delta = create_overflow_delta(valid_input["hash"][0][1], p)
hash10_delta = create_overflow_delta(valid_input["hash"][1][0], p)
hash11_delta = create_overflow_delta(valid_input["hash"][1][1], p)

# Calculate modified values
pubkey0 = number_to_array(array_to_number(valid_input["pubkey"][0]) + delta_to_number(pubkey0_delta))
pubkey1 = number_to_array(array_to_number(valid_input["pubkey"][1]) + delta_to_number(pubkey1_delta))
signature00 = number_to_array(array_to_number(valid_input["signature"][0][0]) + delta_to_number(signature00_delta))
signature01 = number_to_array(array_to_number(valid_input["signature"][0][1]) + delta_to_number(signature01_delta))
signature10 = number_to_array(array_to_number(valid_input["signature"][1][0]) + delta_to_number(signature10_delta))
signature11 = number_to_array(array_to_number(valid_input["signature"][1][1]) + delta_to_number(signature11_delta))
hash00 = number_to_array(array_to_number(valid_input["hash"][0][0]) + delta_to_number(hash00_delta))
hash01 = number_to_array(array_to_number(valid_input["hash"][0][1]) + delta_to_number(hash01_delta))
hash10 = number_to_array(array_to_number(valid_input["hash"][1][0]) + delta_to_number(hash10_delta))
hash11 = number_to_array(array_to_number(valid_input["hash"][1][1]) + delta_to_number(hash11_delta))

# Prepare the output dictionary
output = {
    "pubkey": [
        [str(x) for x in pubkey0],
        [str(x) for x in pubkey1]
    ],
    "signature": [
        [
            [str(x) for x in signature00],
            [str(x) for x in signature01]
        ],
        [
            [str(x) for x in signature10],
            [str(x) for x in signature11]
        ]
    ],
    "hash": [
        [
            [str(x) for x in hash00],
            [str(x) for x in hash01]
        ],
        [
            [str(x) for x in hash10],
            [str(x) for x in hash11]
        ]
    ]
}

# Print the output in JSON format
print(json.dumps(output, indent=2))

# Verify overflow and range check
def verify_overflow_and_range(original, modified, p):
    overflow = False
    range_check_pass = True
    for o, m, p_val in zip(original, modified, p):
        if m > p_val:
            overflow = True
        if m > 2**55 - 1:
            range_check_pass = False
    return overflow, range_check_pass

print("\nOverflow and Range Check verification:")
for name, orig, mod in [
    ("pubkey[0]", valid_input['pubkey'][0], pubkey0),
    ("pubkey[1]", valid_input['pubkey'][1], pubkey1),
    ("signature[0][0]", valid_input['signature'][0][0], signature00),
    ("signature[0][1]", valid_input['signature'][0][1], signature01),
    ("signature[1][0]", valid_input['signature'][1][0], signature10),
    ("signature[1][1]", valid_input['signature'][1][1], signature11),
    ("hash[0][0]", valid_input['hash'][0][0], hash00),
    ("hash[0][1]", valid_input['hash'][0][1], hash01),
    ("hash[1][0]", valid_input['hash'][1][0], hash10),
    ("hash[1][1]", valid_input['hash'][1][1], hash11)
]:
    overflow, range_check = verify_overflow_and_range(orig, mod, p)
    print(f"{name}: Overflow: {overflow}, Range Check Pass: {range_check}")