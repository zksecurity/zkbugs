fnv-plus
========

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]

Javascript FNV-1a Hashing Algorithm up to 1024 bits, with highly optimized 32bit and 52bit implementations.

## Concept
The FNV-1a hash algorithm, often simply called "fnv", disperses hashes
throughout the n-bit hash space with very good dispersion and is very
fast.

Use this module to generate unique hash/checksum values for Javascript
strings or objects. **Note:** The FNV-1a algorithm is not even remotely suitable as
a cryptographic pseudo-random generator, and should not be used to secure any
thing for any reason. It is designed for *uniqueness*, not *randomness*.

##### Why **fnv-plus**?
- It is the **fastest** FNV implementation available for Node.js (thanks [desudesutalk](https://github.com/desudesutalk)). See [Benchmarks](https://github.com/tjwebb/fnv-plus/tree/master/benchmark).
- It is the only npm module that is capable of generating fnv hashes for keyspaces larger than 32 bits.
- `fnv-plus` is well-tested. Many other fnv implementations offer no unit tests to prove they work and are performant.
- `fnv-plus` implements a 52bit version of FNV-1a which provides a larger hash space while still making use of Javascript's 53-bit integer space.

##### New in 1.3.x
- No dependencies!
- [Fast Variants](https://github.com/tjwebb/fnv-plus#fast-variants) that optimize for speed.

##### New in 1.2.x
- You can easily define custom seeds.
- the `hash()` function can now take arbitrary Javascript objects as input.
- changed default bitlength to **52**

## Install
```sh
$ npm install fnv-plus --save
```

## Usage

    var fnv = require('fnv-plus'),
        astring = 'hello world',
        ahash52 = fnv.hash(astring),        // 52-bit hash by default
        ahash64 = fnv.hash(astring, 64);    // 64-bit hash specified

    console.log(ahash52.hex() == 'a65e7023cd59e');    //true
    console.log(ahash52.str() == 'stglysbf6m');       //true
    console.log(ahash52.dec() == '2926792616498590'); //true

    console.log(ahash64.hex() == '779a65e7023cd2e7');     //true
    console.log(ahash64.str() == '1th7cxzlyc0dj');        //true
    console.log(ahash64.dec() == '8618312879776256743');  //true

    // fast variants
    console.log(fnv.fast1a32hex(astring) == 'd58b3fa7');      //true
    console.log(fnv.fast1a52hex(astring) == 'a65e7023cd59e'); //true

    fnv.seed('foobar testseed');
    console.log(fnv.hash(astring, 64).hex() == ahash64.hex()); // false
    // ^^ because the default seed is not 'foobar testseed'

## API

#### `fnv.hash(string, bitlength)`
  - Hash a string using the given bit length (52 is default)
  - returns a `FnvHash` object

#### `fnv.seed(string)`
  - Seed the algorithm to produce different values. Hashing the same value with
    different seeds will very likely result in different results. To the extent
    your seed can be random, it can serve as a source of randomness, but
    nonetheless is *not* a replacement for a crypgographic PRG (pseudo-random
    generator).
  - default seed is `chongo <Landon Curt Noll> /\>./\\`

#### `fnv.useUTF8(bool)`
  - Controls UTF-8 awareness of hash functions
  - default is `false`

#### `FnvHash.str()`
Returns the hashed value as an ascii string

#### `FnvHash.hex()`
Returns the hashed value as a hexadecimal string

#### `FnvHash.dec()`
Returns the hashed value as a decimal string

### Fast variants

This functions runs faster because they have no *lib-overhead* (see
[benchmarks](benchmark/README.md) for more info). They always compute 1a
version of hashes and always use default seed. Directly returns hash values
(not `FnvHash` object).

#### `fnv.fast1a32(string)`
  - Calculate FNV-1a 32bit hash
  - returns int

#### `fnv.fast1a32hex(string)`
  - Calculate FNV-1a 32bit hash
  - returns hex string

#### `fnv.fast1a52(string)`
  - Calculate FNV-1a 52bit hash
  - returns int

#### `fnv.fast1a52hex(string)`
  - Calculate FNV-1a 52bit hash
  - returns hex string

#### `fnv.fast1a64(string)`
  - Calculate FNV-1a 64bit hash
  - returns hex string

#### `fnv.fast1a32utf(string)`
  - Calculate FNV-1a 32bit hash
  - handles UTF-8 strings
  - returns int

#### `fnv.fast1a32hexutf(string)`
  - Calculate FNV-1a 32bit hash
  - handles UTF-8 strings
  - returns hex string

#### `fnv.fast1a52utf(string)`
  - Calculate FNV-1a 52bit hash
  - handles UTF-8 strings
  - returns int

#### `fnv.fast1a52hexutf(string)`
  - Calculate FNV-1a 52bit hash
  - handles UTF-8 strings
  - returns hex string

#### `fnv.fast1a64utf(string)`
  - Calculate FNV-1a 64bit hash
  - handles UTF-8 strings
  - returns hex string


## License
MIT

[npm-image]: https://img.shields.io/npm/v/fnv-plus.svg?style=flat-square
[npm-url]: https://npmjs.org/package/fnv-plus
[travis-image]: https://img.shields.io/travis/tjwebb/fnv-plus.svg?style=flat-square
[travis-url]: https://travis-ci.org/tjwebb/fnv-plus
