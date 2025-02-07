pragma circom 2.0.0;

/**
 * Rotate left a 32-bit integer by L bits
 * Note: "in" must already be a constrained 32-bit integer
 */
template RotateLeft32Bits(L) {
	signal input in;
	signal output out;

	signal part1 <-- (in << L) & 0xFFFFFFFF;
	signal part2 <-- in >> (32 - L);
	out <== part1 + part2;
	(part1 / 2**L) + (part2 * 2**(32-L)) === in;
}
