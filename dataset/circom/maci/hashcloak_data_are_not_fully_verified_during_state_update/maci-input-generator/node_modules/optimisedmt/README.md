# Optimised Incremental Merkle Tree

## The problem

Ordinary incremental Merkle tree implementations have inefficient update
operations. Every time a leaf is updated, the entire tree is recomputed by
inserting each leaf all over again.

## The solution

Trade off storage/memory for speed.

Represent nodes as a key-value map where the key is the node index and the
value is the node.

Use a simple key-value map to store data. This may be on disk or in memory.
There should be plenty of mature and fast options like LMDB.

**Node index**
The node index is the index of a node array which represents the Merkle tree.

For example, a binary Merkle tree with 2 levels and leaves `a, b, c, d` can be
represented with this node array:

```
[a, b, c, d, h(a, b), h(c, d), root]
```

where h() is a hash function.

`a` is at index 0.

`h(a, b)` is at index 4.

**Zero values**

Upon initialisation of the tree, we compute the zero values. This is the empty
node per level.

`[z, h(z, z), h(h(z, z), h(z, z))]`

If `c` and `d` are empty leaves, then the nodes can be represented as such:

```
{
    0: a,
    1: b,
    4: h(a, b),
    6: root = h(h(a, b), h(z, z))
}
```

There is no need to store the values of items at indices 2, 3, and 5, since
those are precalculated zero values.

**Computing Merkle proofs**

Example 1: there are 4 leaves in a binary MT and all leaves are non-zero. The
nodes array is:

```
[a, b, c, d, h(a, b), h(c, d), root]
```

The representation of the node array as a key-value map is as such:
```
{
    0: a,
    1: b,
    2: c,
    3: d,
    4: h(a, b),
    5: h(c, d),
    6: root = h(h(a, b), h(c, d))
}
```

We want to compute the Merkle proof of leaf 2 (whose value is c).

First, compute the path indices.

```
let r = Math.floor(index / arity)
indices = []
for i in range(0, levels):
    p = r % arity // e.g. p % 2 for a binary tree
    indices.push(p)
    r = Math.floor(r /leavesPerNode)
```

When `index == 2`, `indices == [1, 0]`.

Next, compute the path elements.

```

pathElements = []
j = 1
for i in indices:
    e = nodeArray[j * arity + i]
    pathElements.push(e)
    j ++
```

As such:

```
pathElements = [
    nodeArray[1 * 2 + 1 = 3] = d,
    nodeArray[2 * 2 + 0 = 4] = h(a, b),
]
```

To verify the Merkle path:

```
root == h(d, h(a, b))
```

**Updates**

To perform an update, only `depth - 1` hashes have to be computed.

Consider again this binary Merkle tree with 4 leaves:

```
[a, b, c, d, h(a, b), h(c, d), h(...)]
```

To update the leaf at index 2 (whose value is c), only 2 hash operations are
needed:

```
[a, b, c*, d, h(a, b), h(c*, d), h(...)*]
```
